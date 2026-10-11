import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { Notice } from '../components/Notice';
import { POST_LOGIN_PATH_KEY } from './LoginPage';

// member-service의 OAuth2SuccessHandler가 /oauth2/redirect?accessToken=... 으로 보낸다.
// 토큰 처리는 AuthProvider가 앱 시작 시 끝내므로, 이 화면은 결과에 따라 이동만 한다.
export function OAuthRedirectPage() {
  const { status } = useAuth();
  const [nextPath] = useState(() => sessionStorage.getItem(POST_LOGIN_PATH_KEY) ?? '/me');

  useEffect(() => {
    if (status !== 'loading') sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
  }, [status]);

  if (status === 'loading') {
    return <p className="page-status">로그인을 마무리하고 있습니다.</p>;
  }

  if (status === 'authenticated') {
    // replace로 이동해 주소창과 방문 기록에서 accessToken 쿼리를 지운다.
    return <Navigate to={nextPath} replace />;
  }

  return (
    <section className="narrow">
      <Notice tone="error" title="로그인을 완료하지 못했습니다.">
        <p>토큰을 받지 못했거나 회원 정보를 불러오지 못했습니다. 다시 로그인해주세요.</p>
      </Notice>
      <Link to="/login" className="button">
        로그인 화면으로
      </Link>
    </section>
  );
}
