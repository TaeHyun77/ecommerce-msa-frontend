// 백엔드 DTO와 1:1로 맞춘 타입. 백엔드 record 필드가 바뀌면 여기부터 수정한다.

// ---- member-service ----
export type Provider = 'KAKAO' | 'GOOGLE';
export type Role = 'USER' | 'ADMIN';

// MemberResponse
export interface Member {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: Provider;
  role: Role;
}

// MemberOrderResponse - member-service가 status를 String으로 받으므로 string으로 둔다.
export interface MemberOrder {
  orderId: number;
  status: string;
  totalAmount: number;
  orderedAt: string; // LocalDateTime (yyyy-MM-ddTHH:mm:ss)
}

// TokenResponse
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ---- product-service ----
export type StorageType = 'REFRIGERATED' | 'FROZEN' | 'ROOM_TEMPERATURE';
export type ProductStatus = 'ON_SALE' | 'SUSPENDED';

// ProductCreateRequest
export interface ProductCreateRequest {
  productCode: string;
  name: string;
  brand?: string;
  description?: string;
  storageType: StorageType;
  price: number;
  thumbnailUrl?: string;
  categoryId: number;
}

// ProductResponse
export interface Product {
  productId: number;
  productCode: string;
  name: string;
  brand: string | null;
  description: string | null;
  status: ProductStatus;
  storageType: StorageType;
  price: number;
  thumbnailUrl: string | null;
  categoryId: number;
}

// ProductListResponse - 재고 수량 대신 품절 여부만 노출한다.
export interface ProductListItem {
  productId: number;
  name: string;
  brand: string | null;
  price: number;
  storageType: StorageType;
  thumbnailUrl: string | null;
  categoryId: number;
  soldOut: boolean;
}

// ProductDetailResponse - 판매중이 아니거나 없는 상품이면 404 PRODUCT_NOT_FOUND
export interface ProductDetail extends ProductListItem {
  productCode: string;
  description: string | null;
}

// CategoryTreeResponse - 상위 > 하위 2단계로 고정이라 하위의 children은 항상 빈 배열
export interface CategoryNode {
  categoryId: number;
  name: string;
  children: CategoryNode[];
}

// ProductPageResponse
export interface ProductPage {
  content: ProductListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

// ---- order-service ----
// CartItemAddRequest - 수량은 1~99
export interface CartItemAddRequest {
  productId: number;
  quantity: number;
}

// CartItemQuantityRequest - 담기와 달리 합산하지 않고 이 수량으로 바꾼다. 0은 불가(삭제는 DELETE)
export interface CartItemQuantityRequest {
  quantity: number;
}

// CartItemResponse
export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  lineAmount: number; // 판매가 × 수량
  thumbnailUrl: string | null;
  soldOut: boolean;
  orderable: boolean; // 판매중이고 담긴 수량만큼 재고가 남아 있는지
}

// CartResponse - 판매중지/삭제된 상품은 서버가 목록에서 뺀다
export interface Cart {
  items: CartItem[];
  totalAmount: number; // 주문 가능한 항목만 합산
}

// OrderCreateRequest - 같은 상품을 두 줄로 보내면 400 DUPLICATE_ORDER_PRODUCT
export interface OrderCreateRequest {
  items: { productId: number; quantity: number }[];
}

// OrderCreateResponse - 토스페이먼츠 결제창 요청에 그대로 쓴다 (orderNo → orderId)
export interface CreatedOrder {
  orderNo: string;
  orderName: string;
  amount: number;
  expiresAt: string; // 결제 기한 - 지나면 주문이 취소되고 선점한 재고가 풀린다
}

export type OrderStatus = 'PAYMENT_WAITING' | 'APPROVING' | 'PAID' | 'CANCELLED' | 'COMPLETED';

// OrderPaymentRequest - 토스 successUrl 쿼리로 받은 값
export interface OrderPaymentRequest {
  paymentKey: string;
  amount: number;
}

// OrderPaymentResponse - PAID(200) 또는 APPROVING(202, 결과 확인 중)
export interface OrderPaymentResult {
  orderNo: string;
  status: OrderStatus;
}

// OrderDetailResponse
export interface OrderDetail {
  orderNo: string;
  status: OrderStatus;
  orderName: string;
  totalAmount: number;
  orderedAt: string;
  expiresAt: string;
  lines: { productId: number; productName: string; unitPrice: number; quantity: number }[];
}

// 공통 에러 응답 - 서비스는 {code, message}, 게이트웨이 401은 {message}만 내려준다.
export interface ErrorBody {
  code?: string;
  message?: string;
}
