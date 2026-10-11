import type { Provider } from '../types/api';
import { request } from './client';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8080';

// 소셜 로그인은 fetch가 아니라 페이지 이동이다.
// 게이트웨이 → member-service가 OAuth2 흐름을 처리한 뒤
// /oauth2/redirect?accessToken=... 로 돌려보내고 Refresh Token은 httpOnly 쿠키로 심는다.
export function socialLoginUrl(provider: Provider): string {
  return `${GATEWAY_URL}/oauth2/authorization/${provider.toLowerCase()}`;
}

export function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' });
}
