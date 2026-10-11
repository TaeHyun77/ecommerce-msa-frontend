import type { Cart, CartItemAddRequest, CartItemQuantityRequest } from '../types/api';
import { request } from './client';

// order-service 장바구니 API. 게이트웨이가 JWT로 회원을 식별하므로 로그인 상태에서만 호출한다.
// 변경 API의 응답(변경된 항목)은 쓰지 않고, 합계와 주문 가능 여부가 서버 기준으로 다시 계산되도록 장바구니를 재조회한다.

export const CART_MAX_QUANTITY = 99; // order-service CartItem.MAX_QUANTITY

export function getCart(): Promise<Cart> {
  return request<Cart>('/api/carts');
}

// 201 Created - 이미 담긴 상품이면 수량이 더해진다.
export function addCartItem(body: CartItemAddRequest): Promise<void> {
  return request<void>('/api/carts/items', { method: 'POST', body });
}

export function changeCartItemQuantity(productId: number, body: CartItemQuantityRequest): Promise<void> {
  return request<void>(`/api/carts/items/${productId}`, { method: 'PATCH', body });
}

// 204 No Content
export function removeCartItem(productId: number): Promise<void> {
  return request<void>(`/api/carts/items/${productId}`, { method: 'DELETE' });
}
