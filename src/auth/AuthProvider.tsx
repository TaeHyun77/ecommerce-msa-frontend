import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { logout as logoutApi } from '../api/auth';
import { reissueAccessToken } from '../api/client';
import { getMe, withdraw as withdrawApi } from '../api/member';
import { tokenStore } from '../api/tokenStore';
import type { Member } from '../types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  status: AuthStatus;
  member: Member | null;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const OAUTH_REDIRECT_PATH = '/oauth2/redirect';

// OAuth2 로그인 직후에는 URL 쿼리로 Access Token이 오고, 그 외에는 Refresh Token 쿠키로 재발급받는다.
function readRedirectToken(): string | null {
  if (window.location.pathname !== OAUTH_REDIRECT_PATH) return null;
  return new URLSearchParams(window.location.search).get('accessToken');
}

// StrictMode에서 effect가 두 번 실행돼도 초기화는 한 번만 한다.
let bootstrapPromise: Promise<Member | null> | null = null;

function bootstrap(): Promise<Member | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const redirectToken = readRedirectToken();
      if (redirectToken) {
        tokenStore.set(redirectToken);
      } else {
        await reissueAccessToken();
      }

      if (!tokenStore.get()) return null;

      try {
        return await getMe();
      } catch {
        tokenStore.clear();
        return null;
      }
    })();
  }
  return bootstrapPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    let active = true;
    bootstrap().then((me) => {
      if (!active) return;
      setMember(me);
      setStatus(me ? 'authenticated' : 'guest');
    });
    return () => {
      active = false;
    };
  }, []);

  // 재발급 실패 등으로 토큰이 사라지면 어느 화면에 있든 비로그인 상태로 전환
  useEffect(
    () =>
      tokenStore.subscribe((token) => {
        if (token === null) {
          setMember(null);
          setStatus('guest');
        }
      }),
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      // 서버 요청이 실패해도 이 브라우저에서는 로그아웃 처리
      tokenStore.clear();
    }
  }, []);

  const withdraw = useCallback(async () => {
    await withdrawApi();
    tokenStore.clear();
  }, []);

  const value = useMemo(() => ({ status, member, logout, withdraw }), [status, member, logout, withdraw]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  return context;
}
