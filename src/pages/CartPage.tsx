import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { changeCartItemQuantity, getCart, removeCartItem } from '../api/cart';
import { asApiError, type ApiError } from '../api/client';
import { useCartCount } from '../cart/CartCountProvider';
import { ErrorNotice } from '../components/Notice';
import { QuantityStepper } from '../components/QuantityStepper';
import { useRequest } from '../hooks/useRequest';
import { formatWon } from '../lib/format';
import type { CartItem } from '../types/api';

// 주문 불가 사유 - 품절이 아니면서 주문 불가면 담긴 수량보다 재고가 적은 경우다.
function unorderableReason(item: CartItem): string | null {
  if (item.orderable) return null;
  return item.soldOut ? '품절' : '재고 부족';
}

export function CartPage() {
  const { data: cart, error, loading, reload } = useRequest(getCart, []);
  const { refresh: refreshCartCount } = useCartCount();
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<ApiError>();

  // 변경 후에는 합계와 주문 가능 여부를 서버 기준으로 다시 받는다.
  const mutate = async (productId: number, action: () => Promise<void>) => {
    setPendingId(productId);
    setActionError(undefined);
    try {
      await action();
    } catch (e) {
      setActionError(asApiError(e));
    } finally {
      setPendingId(null);
      reload();
      refreshCartCount(); // 삭제로 상품 종류가 줄면 헤더 배지도 함께 맞춘다
    }
  };

  if (!cart && loading) return <p className="page-status">장바구니를 불러오고 있습니다.</p>;

  return (
    <section className="cart">
      <h1 className="page-title cart__title">장바구니</h1>

      {error && <ErrorNotice error={error} />}
      {actionError && <ErrorNotice error={actionError} />}

      {cart && cart.items.length === 0 && (
        <div className="empty">
          <p>장바구니에 담긴 상품이 없습니다.</p>
          <Link to="/" className="button">
            상품 보러 가기
          </Link>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <div className="cart__body">
          <ul className="cart-list">
            {cart.items.map((item) => {
              const reason = unorderableReason(item);
              const busy = pendingId === item.productId;
              return (
                <li key={item.productId} className={`cart-item${reason ? ' cart-item--unorderable' : ''}`}>
                  <Link to={`/products/${item.productId}`} className="cart-item__thumb">
                    {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" />}
                  </Link>
                  <div className="cart-item__info">
                    <Link to={`/products/${item.productId}`} className="cart-item__name">
                      {item.name}
                    </Link>
                    <span className="muted small">{formatWon(item.price)}</span>
                    {reason && <span className="cart-item__reason">{reason}</span>}
                  </div>
                  <QuantityStepper
                    value={item.quantity}
                    disabled={busy || item.soldOut}
                    onChange={(next) =>
                      mutate(item.productId, () => changeCartItemQuantity(item.productId, { quantity: next }))
                    }
                  />
                  <span className="cart-item__amount">{formatWon(item.lineAmount)}</span>
                  <button
                    type="button"
                    className="cart-item__remove"
                    aria-label={`${item.name} 삭제`}
                    disabled={busy}
                    onClick={() => mutate(item.productId, () => removeCartItem(item.productId))}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>

          <aside className="cart-summary">
            <div className="cart-summary__row">
              <span>상품금액</span>
              <strong>{formatWon(cart.totalAmount)}</strong>
            </div>
            <button
              type="button"
              className="button button--primary"
              disabled={!cart.items.some((item) => item.orderable)}
              onClick={() => navigate('/order')}
            >
              {formatWon(cart.totalAmount)} 주문하기
            </button>
            <p className="muted small">품절이거나 재고가 부족한 상품은 금액과 주문에서 제외됩니다.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
