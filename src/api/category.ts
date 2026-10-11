import type { CategoryNode } from '../types/api';
import { request } from './client';

// 게이트웨이 화이트리스트 경로라 비로그인도 조회된다.
export function getCategories(): Promise<CategoryNode[]> {
  return request<CategoryNode[]>('/api/categories');
}
