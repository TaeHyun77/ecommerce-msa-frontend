import { Outlet } from 'react-router';

export function OpsLayout() {
  return (
    <div className="ops">
      <p className="ops__banner">
        개발용 화면입니다. 게이트웨이를 거치지 않고 product-service(8081)를 인증 없이 직접 호출합니다.
      </p>

      <Outlet />
    </div>
  );
}
