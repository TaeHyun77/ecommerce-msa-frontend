import type { Product, ProductCreateRequest } from '../types/api';
import { request } from './client';

// product-service의 관리 API.
// 아직 게이트웨이에 라우팅되지 않았고 인증도 없어서 auth: false로 호출한다 (vite 프록시가 8081로 직접 전달).

export function registerProduct(body: ProductCreateRequest): Promise<Product> {
  return request<Product>('/api/admin/products', { method: 'POST', body, auth: false });
}
