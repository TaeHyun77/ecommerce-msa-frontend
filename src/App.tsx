import { Navigate, Route, Routes } from 'react-router';
import { OAUTH_REDIRECT_PATH } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MyPage } from './pages/MyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderPage } from './pages/OrderPage';
import { PaymentFailPage } from './pages/PaymentFailPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SearchPage } from './pages/SearchPage';
import { OAuthRedirectPage } from './pages/OAuthRedirectPage';
import { OpsLayout } from './pages/ops/OpsLayout';
import { ProductRegisterPage } from './pages/ops/ProductRegisterPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route
          path="cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="order"
          element={
            <RequireAuth>
              <OrderPage />
            </RequireAuth>
          }
        />
        <Route
          path="payment/success"
          element={
            <RequireAuth>
              <PaymentSuccessPage />
            </RequireAuth>
          }
        />
        <Route path="payment/fail" element={<PaymentFailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path={OAUTH_REDIRECT_PATH.slice(1)} element={<OAuthRedirectPage />} />
        <Route
          path="me"
          element={
            <RequireAuth>
              <MyPage />
            </RequireAuth>
          }
        />

        <Route path="ops" element={<OpsLayout />}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<ProductRegisterPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
