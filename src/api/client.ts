import type { ErrorBody, TokenResponse } from '../types/api';
import { tokenStore } from './tokenStore';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: '입력값이 올바르지 않습니다.',
  401: '로그인이 필요합니다.',
  403: '이 작업을 할 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '이미 처리된 요청입니다.',
  500: '서버에서 오류가 발생했습니다.',
  502: '서버에 연결하지 못했습니다.',
  503: '서비스를 잠시 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
};

async function errorFromResponse(response: Response): Promise<ApiError> {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // 본문이 없거나 JSON이 아닌 경우 - 상태 코드 기본 메시지를 쓴다.
  }
  const message =
    body.message ?? FALLBACK_MESSAGES[response.status] ?? `요청을 처리하지 못했습니다. (${response.status})`;
  return new ApiError(response.status, body.code, message);
}

function networkError(): ApiError {
  return new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
}

export function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(-1, 'UNKNOWN', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
}

// ---- Access Token 재발급 ----
// 백엔드는 Refresh Token Rotation을 쓰고, 저장된 토큰과 다른 토큰이 오면 탈취로 보고 즉시 삭제한다.
// 따라서 재발급 요청이 동시에 두 번 나가면 두 번째 요청이 이전 쿠키를 보내 강제 로그아웃된다.
// (401이 여러 요청에서 동시에 나거나, React StrictMode가 effect를 두 번 실행하는 경우)
// 진행 중인 요청을 공유해 한 번만 나가도록 막는다.
let reissueInFlight: Promise<string | null> | null = null;

export function reissueAccessToken(): Promise<string | null> {
  if (!reissueInFlight) {
    reissueInFlight = (async () => {
      try {
        const response = await fetch('/api/auth/reissue', { method: 'POST', credentials: 'include' });
        if (!response.ok) {
          tokenStore.clear();
          return null;
        }
        const body = (await response.json()) as TokenResponse;
        tokenStore.set(body.accessToken);
        return body.accessToken;
      } catch {
        return null;
      } finally {
        reissueInFlight = null;
      }
    })();
  }
  return reissueInFlight;
}

// ---- 공통 요청 함수 ----
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  // false면 Authorization 헤더를 붙이지 않고 401 재발급도 하지 않는다 (인증 없는 운영 API용).
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;
  const url = buildUrl(path, query);

  const send = () => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const token = tokenStore.get();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    return fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
  };

  let response: Response;
  try {
    response = await send();

    // Access Token 만료(30분) - 한 번만 재발급 후 재시도
    if (response.status === 401 && auth) {
      const newToken = await reissueAccessToken();
      if (!newToken) throw await errorFromResponse(response);

      response = await send();
      if (response.status === 401) tokenStore.clear();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw networkError();
  }

  if (!response.ok) throw await errorFromResponse(response);

  // 204 No Content, 202 Accepted처럼 본문이 없는 응답도 처리
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
