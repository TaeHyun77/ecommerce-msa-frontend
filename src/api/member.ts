import type { Member, MemberOrder } from '../types/api';
import { request } from './client';

export function getMe(): Promise<Member> {
  return request<Member>('/api/members/me');
}

// order-service 장애 또는 서킷 OPEN이면 503 ORDER_SERVICE_UNAVAILABLE
export function getMyOrders(): Promise<MemberOrder[]> {
  return request<MemberOrder[]>('/api/members/me/orders');
}

export function withdraw(): Promise<void> {
  return request<void>('/api/members/me', { method: 'DELETE' });
}
