import type { CreatedOrder, OrderCreateRequest, OrderDetail, OrderPaymentRequest, OrderPaymentResult } from '../types/api';
import { request } from './client';

// order-service 주문 API. 게이트웨이가 JWT로 회원을 식별하므로 로그인 상태에서만 호출한다.
// orderNo는 토스 successUrl 쿼리에서 오는 값이라 경로에 넣기 전에 인코딩한다.

// 201 Created - 결제 대기 주문을 만들고 재고를 선점한다.
export function createOrder(body: OrderCreateRequest): Promise<CreatedOrder> {
  return request<CreatedOrder>('/api/orders', { method: 'POST', body });
}

// 200(PAID)과 202(APPROVING)를 본문의 status로 구분한다. 이미 결제된 주문이면 다시 호출해도 PAID를 돌려준다.
export function approveOrderPayment(orderNo: string, body: OrderPaymentRequest): Promise<OrderPaymentResult> {
  return request<OrderPaymentResult>(`/api/orders/${encodeURIComponent(orderNo)}/payment`, { method: 'POST', body });
}

export function getOrder(orderNo: string): Promise<OrderDetail> {
  return request<OrderDetail>(`/api/orders/${encodeURIComponent(orderNo)}`);
}
