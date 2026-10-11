import type { ProductDetail, ProductPage } from '../types/api';
import { request } from './client';

// 게이트웨이 화이트리스트 경로라 비로그인도 조회된다. 판매중 상품만 최신 등록순으로 온다.
// categoryId가 상위 카테고리면 하위 카테고리 상품까지 함께 온다.
export function getProducts(page: number, size: number, categoryId?: number): Promise<ProductPage> {
  return request<ProductPage>('/api/products', { query: { page, size, categoryId } });
}

export function getProduct(productId: number): Promise<ProductDetail> {
  return request<ProductDetail>(`/api/products/${productId}`);
}
