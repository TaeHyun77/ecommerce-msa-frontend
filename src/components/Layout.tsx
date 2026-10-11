import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useCartCount } from '../cart/CartCountProvider';
import { CategoryMenu } from './CategoryMenu';
import { SearchBox } from './SearchBox';

export const STORE_NAME = 'e-commerce';

export function Layout() {
  const { status, member, logout } = useAuth();
  const { count } = useCartCount();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          {/* 로고 이미지에 스토어명이 들어 있어 헤더에는 텍스트를 따로 두지 않는다 */}
          <NavLink to="/" className="wordmark">
            <img src="/chall.png" alt={STORE_NAME} className="wordmark__logo" />
          </NavLink>

          <CategoryMenu />

          <SearchBox />

          <div className="app-header__account">
            <NavLink to="/cart" className="cart-link" aria-label={`장바구니 (담긴 상품 ${count}종)`}>
              <span aria-hidden="true">🛒</span>
              {count > 0 && <span className="cart-link__badge">{count}</span>}
            </NavLink>

            {status === 'authenticated' && member ? (
              <>
                <span className="app-header__name">{member.nickname}님</span>
                <button type="button" className="button button--quiet" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : status === 'guest' ? (
              <NavLink to="/login" className="button button--quiet">
                로그인
              </NavLink>
            ) : null}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
