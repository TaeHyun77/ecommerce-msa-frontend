import { useSearchParams } from 'react-router';
import { searchProducts, type SearchSource } from '../api/search';
import { ErrorNotice } from '../components/Notice';
import { ProductCard } from '../components/ProductCard';
import { useRequest } from '../hooks/useRequest';
import { SOURCE_PARAM } from '../lib/search';

const PAGE_SIZE = 20;

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page - 1 : 0; // URL은 1부터, API는 0부터 센다
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();

  if (q === '') {
    return (
      <section className="search-result">
        <div className="empty">검색어를 입력해 주세요.</div>
      </section>
    );
  }

  // 검색어가 바뀌면 이전 검색어의 결과가 잠깐 비치지 않도록 key로 상태를 새로 시작한다.
  return <SearchResults key={q} q={q} />;
}

function SearchResults({ q }: { q: string }) {
  const [params, setParams] = useSearchParams();
  const page = parsePage(params.get('page'));
  const source: SearchSource = params.get(SOURCE_PARAM) === 'SUGGESTION' ? 'SUGGESTION' : 'TYPED';
  const { data, error, loading } = useRequest(() => searchProducts(q, page, PAGE_SIZE, source), [q, page, source]);

  // 서버는 첫 페이지 검색만 집계하므로, 다른 페이지에서 첫 페이지로 돌아와도 같은 source로 요청되도록 URL에 유지한다.
  const goToPage = (next: number) => {
    const nextParams: Record<string, string> = { q, page: String(next + 1) };
    if (source === 'SUGGESTION') nextParams[SOURCE_PARAM] = source;
    setParams(nextParams);
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="search-result">
      <h1 className="search-result__title">
        ‘{q}’ 검색 결과{data && <span className="muted small"> {data.totalElements.toLocaleString()}건</span>}
      </h1>

      {error && <ErrorNotice error={error} />}

      {!data && loading && <p className="page-status">검색하고 있습니다.</p>}

      {data && data.content.length === 0 && <div className="empty">‘{q}’에 대한 검색 결과가 없습니다.</div>}

      {data && data.content.length > 0 && (
        <ul className="product-grid">
          {data.content.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </ul>
      )}

      {/* 서버가 판매중지 상품을 뒤늦게 걸러 한 페이지의 건수가 줄 수 있어 hasNext로 다음 페이지를 판단한다. */}
      {data && data.totalPages > 1 && (
        <div className="button-row pager">
          <button type="button" className="button" disabled={page === 0 || loading} onClick={() => goToPage(page - 1)}>
            이전
          </button>
          <span className="muted small">
            {page + 1} / {data.totalPages}
          </span>
          <button type="button" className="button" disabled={!data.hasNext || loading} onClick={() => goToPage(page + 1)}>
            다음
          </button>
        </div>
      )}
    </section>
  );
}
