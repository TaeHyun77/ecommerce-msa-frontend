import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드에 CORS 설정이 없으므로 개발 서버 프록시로 같은 출처(localhost:3000)처럼 호출한다.
// 포트 3000은 member-service의 app.oauth2.redirect-uri(http://localhost:3000/oauth2/redirect)와 맞춘 값이다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayUrl = env.VITE_GATEWAY_URL || 'http://localhost:8080';
  const productServiceUrl = env.PRODUCT_SERVICE_URL || 'http://localhost:8081';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      // 키 순서대로 매칭되므로 구체적인 경로를 /api보다 먼저 둔다.
      proxy: {
        // 게이트웨이에 라우팅되지 않은 product-service 관리 API - 직접 호출
        '/api/admin': { target: productServiceUrl, changeOrigin: true },
        // 나머지 사용자 API는 게이트웨이 경유 (JWT 검증 후 X-Member-Id 헤더 주입)
        '/api': { target: gatewayUrl, changeOrigin: true },
      },
    },
  };
});
