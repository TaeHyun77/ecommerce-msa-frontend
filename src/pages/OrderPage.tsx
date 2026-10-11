import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useState } from 'react';
import { Link } from 'react-router';
import { getCart } from '../api/cart';
import { ApiError, asApiError } from '../api/client';
import { createOrder } from '../api/order';
import { useAuth } from '../auth/AuthProvider';
import { ErrorNotice, Notice } from '../components/Notice';
import { useRequest } from '../hooks/useRequest';
import { formatWon } from '../lib/format';
import type { CreatedOrder } from '../types/api';

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

// 인증 결과에 따라 successUrl 또는 failUrl로 페이지가 이동한다. 결제창을 닫거나 요청 값이 잘못된 경우에만 예외로 돌아온다.
async function requestCardPayment(clientKey: string, order: CreatedOrder): Promise<void> {
  const tossPayments = await loadTossPayments(clientKey);
  const payment = tossPayments.payment({ customerKey: ANONYMOUS });
  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: order.amount }, // 화면 금액이 아닌 서버가 계산한 주문 금액
    orderId: order.orderNo,
    orderName: order.orderName,
    successUrl: `${window.location.origin}/payment/success`,
    failUrl: `${window.location.origin}/payment/fail`,
  });
}

// 토스 SDK는 { code, message } 형태의 에러를 던진다.
function toPaymentError(error: unknown): ApiError {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  return new ApiError(-1, code, message ?? '결제창을 열지 못했습니다.');
}

// 주문 상품은 장바구니를 다시 조회해 정한다 - 새로고침해도 유지되고 주문 가능 여부도 서버 기준으로 최신이다.
export function OrderPage() {
  const { member } = useAuth();
  const { data: cart, error, loading, reload } = useRequest(getCart, []);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<ApiError>();

  if (!member) return null;
  if (!cart && loading) return <p className="page-status">주문 정보를 불러오고 있습니다.</p>;

  const items = cart?.items.filter((item) => item.orderable) ?? [];
  const excludedCount = (cart?.items.length ?? 0) - items.length;

  // 주문은 결제 버튼을 누를 때 만든다 - 주문 생성과 함께 재고가 선점되고 결제 기한이 시작되기 때문이다.
  const pay = async (clientKey: string) => {
    setPaying(true);
    setPayError(undefined);

    let order: CreatedOrder;
    try {
      order = await createOrder({ items: items.map(({ productId, quantity }) => ({ productId, quantity })) });
    } catch (e) {
      setPayError(asApiError(e));
      setPaying(false);
      reload(); // 재고 부족 등으로 실패했다면 주문 가능 여부를 다시 받는다
      return;
    }

    try {
      await requestCardPayment(clientKey, order);
    } catch (e) {
      const paymentError = toPaymentError(e);
      // 결제창을 닫은 경우 - 주문은 결제 기한이 지나면 취소되고 선점한 재고도 풀린다
      if (paymentError.code !== 'USER_CANCEL') setPayError(paymentError);
      setPaying(false);
    }
  };

  return (
    <section className="checkout">
      <h1 className="page-title checkout__title">주문/결제</h1>

      {error && <ErrorNotice error={error} />}
      {payError && <ErrorNotice error={payError} />}
      {!TOSS_CLIENT_KEY && (
        <Notice tone="error" title="결제 설정이 필요합니다.">
          <p>.env에 VITE_TOSS_CLIENT_KEY(test_ck_로 시작)를 넣고 개발 서버를 다시 시작해주세요.</p>
        </Notice>
      )}

      {cart && items.length === 0 && (
        <div className="empty">
          <p>주문할 수 있는 상품이 없습니다.</p>
          <Link to="/cart" className="button">
            장바구니로 돌아가기
          </Link>
        </div>
      )}

      {cart && items.length > 0 && (
        <div className="cart__body">
          <div className="checkout__main">
            <section className="checkout-section" aria-labelledby="orderer-title">
              <h2 id="orderer-title" className="section__title">
                주문자 정보
              </h2>
              <dl className="checkout-info">
                <dt>이름</dt>
                <dd>{member.nickname}</dd>
                <dt>이메일</dt>
                <dd>{member.email}</dd>
              </dl>
            </section>

            <section className="checkout-section" aria-labelledby="order-items-title">
              <div className="section__head">
                <h2 id="order-items-title" className="section__title">
                  주문 상품
                </h2>
                <span className="muted">{items.length}건</span>
              </div>
              {excludedCount > 0 && (
                <p className="muted small">품절이거나 재고가 부족한 상품 {excludedCount}건은 주문에서 제외됩니다.</p>
              )}
              <ul className="checkout-items">
                {items.map((item) => (
                  <li key={item.productId} className="checkout-item">
                    <span className="cart-item__thumb">{item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" />}</span>
                    <div className="checkout-item__info">
                      <span className="checkout-item__name">{item.name}</span>
                      <span className="muted small">
                        {formatWon(item.price)} × {item.quantity}개
                      </span>
                    </div>
                    <span className="checkout-item__amount">{formatWon(item.lineAmount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="cart-summary">
            <div className="cart-summary__row">
              <span>상품금액</span>
              <strong>{formatWon(cart.totalAmount)}</strong>
            </div>
            <div className="cart-summary__row">
              <span>결제수단</span>
              <span>신용·체크카드</span>
            </div>
            <button
              type="button"
              className="button button--primary"
              disabled={paying || !TOSS_CLIENT_KEY}
              onClick={() => TOSS_CLIENT_KEY && pay(TOSS_CLIENT_KEY)}
            >
              {paying ? '결제창을 여는 중…' : `${formatWon(cart.totalAmount)} 결제하기`}
            </button>
            <p className="muted small">결제 버튼을 누르면 주문이 만들어지고 재고가 확보됩니다. 결제 기한 안에 결제하지 않으면 주문은 취소됩니다.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
