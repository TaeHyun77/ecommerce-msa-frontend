import type { ProductPage } from '../types/api';
import { request } from './client';

// 검색이 어떻게 시작됐는지 - 서버가 검색어 집계에서 후보 클릭과 직접 입력을 다르게 판정한다.
export type SearchSource = 'TYPED' | 'SUGGESTION';

// 게이트웨이가 토큰이 있으면 검증해 회원을 식별하고 없으면 비회원으로 통과시키는 경로다(무효한 토큰은 401). 응답 형식은 상품 목록과 같다.
// 자동완성 후보를 눌러 시작한 검색은 source를 SUGGESTION으로 보내야 상품명 후보 클릭이 검색어로 집계되지 않는다.
export function searchProducts(q: string, page: number, size: number, source: SearchSource): Promise<ProductPage> {
  return request<ProductPage>('/api/search/products', { query: { q, page, size, source } });
}

// 자동완성 후보를 최대 10개 돌려준다. 많이 검색된 검색어와 판매중 상품명이 섞여 있다.
// 공백만 있거나 50자를 넘는 검색어는 서버가 400으로 거절한다.
export function getSuggestions(q: string): Promise<string[]> {
  return request<string[]>('/api/search/suggestions', { query: { q } });
}
