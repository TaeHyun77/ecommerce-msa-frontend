import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { formatWon } from '../lib/format';
import type { ProductListItem } from '../types/api';
import { ProductQuickAddDialog } from './ProductQuickAddDialog';

// 모달 열림/담기 완료 상태는 카드마다 독립이라 카드 단위로 분리한다.
// 담기 버튼은 카드 전체를 감싸는 링크 밖에 두어야 클릭이 상세 페이지 이동으로 새지 않는다.
export function ProductCard({ product }: { product: ProductListItem }) {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    // 둘러보기는 로그인 없이 가능하고, 담는 시점에만 로그인으로 보낸 뒤 이 화면으로 돌아온다.
    // 수량까지 고른 뒤 로그인으로 튕기지 않도록 모달을 열기 전에 확인한다.
    if (status !== 'authenticated') {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setAdded(false);
    setQuickAddOpen(true);
  };

  return (
    <li className={`product-card${product.soldOut ? ' product-card--sold-out' : ''}`}>
      <Link to={`/products/${product.productId}`} className="product-card__link">
        <div className="product-card__thumb">
          {product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="" loading="lazy" /> : null}
          {product.soldOut && <span className="product-card__sold-out">품절</span>}
        </div>
        <div className="product-card__body">
          {product.brand && <span className="product-card__brand">{product.brand}</span>}
          <span className="product-card__name">{product.name}</span>
          <span className="product-card__price">{formatWon(product.price)}</span>
        </div>
      </Link>

      <button
        type="button"
        className="button button--primary product-card__add"
        disabled={product.soldOut}
        onClick={handleAddToCart}
      >
        {product.soldOut ? '품절' : added ? '담았습니다 ✓' : '담기'}
      </button>

      {quickAddOpen && (
        <ProductQuickAddDialog
          productId={product.productId}
          onClose={() => setQuickAddOpen(false)}
          onAdded={() => setAdded(true)}
        />
      )}
    </li>
  );
}
