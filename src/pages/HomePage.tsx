import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { getProducts } from '../api/product';
import { ErrorNotice } from '../components/Notice';
import { ProductCard } from '../components/ProductCard';
import { useRequest } from '../hooks/useRequest';
import { CATEGORY_PARAM } from '../lib/category';

const PAGE_SIZE = 20;

// 로그인 없이 들어오는 첫 화면 - 로그인은 구매 시점에만 요구한다.
// ?category=ID가 있으면 그 카테고리(상위면 하위 포함)의 상품만 보여준다.
export function HomePage() {
  const [params] = useSearchParams();
  const categoryId = Number(params.get(CATEGORY_PARAM)) || undefined;

  // 카테고리가 바뀌면 페이지를 0으로 되돌린다 - effect로 초기화하면 이전 페이지로 한 번 더 요청이 나가서,
  // 어느 카테고리의 페이지인지를 함께 저장해 렌더에서 바로 판단한다.
  const [pageState, setPageState] = useState({ categoryId, page: 0 });
  const page = pageState.categoryId === categoryId ? pageState.page : 0;
  const setPage = (next: number) => setPageState({ categoryId, page: next });

  const { data, error, loading } = useRequest(() => getProducts(page, PAGE_SIZE, categoryId), [page, categoryId]);

  return (
    <section className="home">
      {error && <ErrorNotice error={error} />}

      {!data && loading && <p className="page-status">상품을 불러오고 있습니다.</p>}

      {data && data.content.length === 0 && (
        <div className="empty">{categoryId ? '이 카테고리에 판매 중인 상품이 없습니다.' : '아직 판매 중인 상품이 없습니다.'}</div>
      )}

      {data && data.content.length > 0 && (
        <ul className="product-grid">
          {data.content.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="button-row pager">
          <button type="button" className="button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
            이전
          </button>
          <span className="muted small">
            {page + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            className="button"
            disabled={!data.hasNext || loading}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </section>
  );
}
