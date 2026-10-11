# ecommerce-frontend

[ecommerce-msa](https://github.com/TaeHyun77/ecommerce-msa) 백엔드용 React 프론트엔드입니다.

## 실행

```bash
npm install
cp .env.example .env   # 주소가 기본값과 다를 때만 수정
npm run dev            # http://localhost:3000
```

백엔드(gateway 8080, member-service 8082, product-service 8081, order-service 8083)를 먼저 띄워 주세요.
포트 3000은 member-service의 `app.oauth2.redirect-uri`와 맞춘 값이라 바꾸면 안 됩니다.

## 화면

| 경로 | 설명 | 호출 API |
|---|---|---|
| `/` | 상품 목록 (로그인 불필요, 품절 표시, 페이지 이동) | `GET /api/products?page=&size=` |
| `/products/:productId` | 상품 상세, 장바구니 담기 (담을 때만 로그인) | `GET /api/products/{productId}`, `POST /api/carts/items` |
| `/cart` | 장바구니 조회, 수량 변경, 삭제 (로그인 필요) | `GET /api/carts`, `PATCH /api/carts/items/{productId}`, `DELETE /api/carts/items/{productId}` |
| `/login` | 카카오/구글 로그인 | `GET {gateway}/oauth2/authorization/{provider}` (페이지 이동) |
| `/oauth2/redirect` | 로그인 후 토큰 수신 | - |
| `/me` | 내 정보, 주문 내역, 회원 탈퇴 | `GET /api/members/me`, `GET /api/members/me/orders`, `DELETE /api/members/me` |
| `/ops/products` | 상품 등록 | `POST /api/admin/products` |

## 구조

```
src/
  api/         fetch 래퍼(client), 토큰 저장소, 서비스별 API 함수
  auth/        AuthProvider(세션 복원, 로그아웃, 탈퇴), RequireAuth
  components/  레이아웃, 알림, 입력 필드, 보관 온도 배지
  hooks/       useRequest (조회용)
  lib/         날짜/금액 포맷, 라벨, 운영 콘솔 세션 저장
  pages/       사용자 화면, pages/ops 운영 콘솔
  types/api.ts 백엔드 DTO 타입
```

## 백엔드 연동 방식

- **프록시**: 백엔드에 CORS 설정이 없어서 Vite 개발 서버가 `/api`는 게이트웨이로, `/api/admin`은 product-service로 전달합니다 (`vite.config.ts`). 배포 시에는 같은 도메인에서 리버스 프록시로 묶거나 게이트웨이에 CORS를 추가해야 합니다.
- **토큰**: Access Token은 메모리에만 두고, 새로고침 시 httpOnly Refresh Token 쿠키로 재발급합니다. 401을 받으면 한 번 재발급 후 재시도합니다.
- **재발급 중복 방지**: 백엔드는 저장된 토큰과 다른 Refresh Token이 오면 탈취로 보고 삭제합니다. 재발급이 동시에 두 번 나가면 강제 로그아웃되므로 진행 중인 요청을 공유합니다 (`api/client.ts`, `auth/AuthProvider.tsx`).
- **에러**: 서비스의 `{code, message}`와 게이트웨이 401의 `{message}`를 모두 `ApiError`로 통일합니다.

## 알려진 제약

- 주문 생성 API가 없어 구매 화면은 없습니다. 첫 화면(`/`) 상품 목록은 로그인 없이 열리며, 로그인은 장바구니 담기, `/cart`, `/me`에서만 요구합니다.
- 운영 콘솔은 인증 없이 product-service를 직접 호출하는 개발용 화면입니다.
- Safari는 `http://localhost`에서 Secure 쿠키를 거부할 수 있어 Chrome 사용을 권장합니다.
- 재발급 요청이 서버에서 처리된 직후 응답을 받기 전에 페이지를 떠나면, 이전 쿠키가 남아 다음 재발급에서 로그아웃될 수 있습니다 (백엔드 Rotation 정책의 영향).
