import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { addCartItem } from '../api/cart';
import { asApiError, type ApiError } from '../api/client';
import { getProduct } from '../api/product';
import { useAuth } from '../auth/AuthProvider';
import { useCartCount } from '../cart/CartCountProvider';
import { ErrorNotice, Notice } from '../components/Notice';
import { QuantityStepper } from '../components/QuantityStepper';
import { useRequest } from '../hooks/useRequest';
import { formatWon } from '../lib/format';
import { STORAGE_INFO } from '../lib/labels';
import { NotFoundPage } from './NotFoundPage';

export function ProductDetailPage() {
  const productId = Number(useParams().productId);
  if (!Number.isInteger(productId) || productId <= 0) return <NotFoundPage />;
  // productId가 바뀌면 수량/알림 상태를 초기화하도록 key로 다시 마운트한다.
  return <ProductDetail key={productId} productId={productId} />;
}

function ProductDetail({ productId }: { productId: number }) {
  const { status } = useAuth();
  const { refresh: refreshCartCount } = useCartCount();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: product, error, loading } = useRequest(() => getProduct(productId), [productId]);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<ApiError>();

  if (loading && !product) return <p className="page-status">상품 정보를 불러오고 있습니다.</p>;

  if (!product) {
    return (
      <section className="narrow">
        {error && <ErrorNotice error={error} />}
        <Link to="/" className="button">
          상품 목록으로
        </Link>
      </section>
    );
  }

  const changeQuantity = (next: number) => {
    setQuantity(next);
    setAdded(false);
  };

  const handleAddToCart = async () => {
    // 둘러보기는 로그인 없이 가능하고, 담는 시점에만 로그인으로 보낸 뒤 이 화면으로 돌아온다.
    if (status !== 'authenticated') {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setAdding(true);
    setAdded(false);
    setAddError(undefined);
    try {
      await addCartItem({ productId: product.productId, quantity });
      refreshCartCount();
      setAdded(true);
    } catch (e) {
      setAddError(asApiError(e));
    } finally {
      setAdding(false);
    }
  };

  const storage = STORAGE_INFO[product.storageType];

  return (
    <article className="product-detail">
      <div className="product-detail__top">
        <div className="product-detail__thumb">
          {product.thumbnailUrl && <img src={product.thumbnailUrl} alt={product.name} />}
          {product.soldOut && <span className="product-detail__sold-out">품절</span>}
        </div>

        <div className="product-detail__info">
          <h1 className="product-detail__name">
            {product.brand && <span className="product-detail__brand">[{product.brand}] </span>}
            {product.name}
          </h1>
          <p className="product-detail__price">{formatWon(product.price)}</p>

          <dl className="product-detail__specs">
            <div>
              <dt>보관방법</dt>
              <dd>
                {storage.label} <span className="muted">({storage.range})</span>
              </dd>
            </div>
            {product.brand && (
              <div>
                <dt>브랜드</dt>
                <dd>{product.brand}</dd>
              </div>
            )}
            <div>
              <dt>상품코드</dt>
              <dd className="code">{product.productCode}</dd>
            </div>
          </dl>

          {product.soldOut ? (
            <button type="button" className="button button--primary product-detail__cta" disabled>
              품절된 상품입니다
            </button>
          ) : (
            <>
              <div className="product-detail__order">
                <span className="product-detail__order-name">{product.name}</span>
                <div className="product-detail__order-row">
                  <QuantityStepper value={quantity} onChange={changeQuantity} />
                  <span className="product-detail__order-price">{formatWon(product.price * quantity)}</span>
                </div>
              </div>

              <p className="product-detail__total">
                총 상품금액 <strong>{formatWon(product.price * quantity)}</strong>
              </p>

              {added && (
                <Notice tone="success" title="장바구니에 상품을 담았습니다.">
                  <Link to="/cart">장바구니 보기</Link>
                </Notice>
              )}
              {addError && <ErrorNotice error={addError} />}

              <button
                type="button"
                className="button button--primary product-detail__cta"
                disabled={adding}
                onClick={handleAddToCart}
              >
                {adding ? '담는 중…' : '장바구니 담기'}
              </button>
            </>
          )}
        </div>
      </div>

      <section className="product-detail__description">
        <h2 className="product-detail__section-title">상품설명</h2>
        {product.description ? <p>{product.description}</p> : <p className="muted">등록된 상품 설명이 없습니다.</p>}
      </section>
    </article>
  );
}
