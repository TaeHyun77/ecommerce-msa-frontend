import { Navigate, useLocation } from 'react-router';
import { socialLoginUrl } from '../api/auth';
import { useAuth } from '../auth/AuthProvider';
import { Notice } from '../components/Notice';
import { STORE_NAME } from '../components/Layout';
import type { Provider } from '../types/api';

export const POST_LOGIN_PATH_KEY = 'auth.postLoginPath';

interface LoginLocationState {
  from?: string;
  notice?: string;
}

export function LoginPage() {
  const { status } = useAuth();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginLocationState;

  if (status === 'authenticated') {
    return <Navigate to={state.from ?? '/me'} replace />;
  }

  const startLogin = (provider: Provider) => {
    // OAuth2 왕복 중에는 라우터 state가 사라지므로 돌아올 경로를 세션에 남긴다.
    sessionStorage.setItem(POST_LOGIN_PATH_KEY, state.from ?? '/me');
    window.location.href = socialLoginUrl(provider);
  };

  return (
    <section className="login">
      <div className="login__copy">
        <h1 className="login__title">{STORE_NAME}에 로그인</h1>
        <p className="login__lead">
          카카오나 구글 계정으로 바로 시작하세요. 처음 로그인하면 회원가입이 함께 진행됩니다.
        </p>
      </div>

      {state.notice && <Notice tone="success" title={state.notice} />}

      <div className="login__actions">
        <button type="button" className="social-button social-button--kakao" onClick={() => startLogin('KAKAO')}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.88 5.36 4.7 6.78-.2.72-.74 2.66-.85 3.07-.13.5.18.5.39.36.16-.1 2.56-1.74 3.6-2.45.7.1 1.42.16 2.16.16 5.52 0 10-3.58 10-8S17.52 3 12 3z"
            />
          </svg>
          카카오로 계속하기
        </button>
        <button type="button" className="social-button social-button--google" onClick={() => startLogin('GOOGLE')}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.03v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.34z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.23-2.5c-.9.6-2.04.95-3.4.95-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
            <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9z" />
            <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2 10 10 0 0 0 3.07 7.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98z" />
          </svg>
          구글로 계속하기
        </button>
      </div>
    </section>
  );
}
