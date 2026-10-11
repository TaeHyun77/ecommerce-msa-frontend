import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { removeCartItem } from '../api/cart';
import { asApiError, type ApiError } from '../api/client';
import { approveOrderPayment, getOrder } from '../api/order';
import { useCartCount } from '../cart/CartCountProvider';
import { ErrorNotice, Notice } from '../components/Notice';
import { formatWon } from '../lib/format';
import type { OrderDetail } from '../types/api';

const POLL_INTERVAL_MS = 5_000;
// order-service 복구 스케줄러가 승인 시작 2분 뒤부터 다시 처리하므로 그보다 넉넉히 4분 동안 확인한다.
const POLL_MAX_ATTEMPTS = 48;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// true면 결제 완료, false면 결과 확인 중
async function requestApproval(orderNo: string, paymentKey: string, amount: number): Promise<boolean> {
  try {
    const result = await approveOrderPayment(orderNo, { paymentKey, amount });
    return result.status === 'PAID';
  } catch (e) {
    // 새로고침이나 다른 탭에서 같은 승인이 이미 진행 중인 경우 - 결과 확인으로 넘어간다
    if (asApiError(e).code === 'PAYMENT_IN_PROGRESS') return false;
    throw e;
  }
}

// 결제한 상품을 장바구니에서 지운다. 이미 지운 상품(404)이나 일시적인 실패는 결제 결과와 무관해 무시한다
// - 남은 상품은 장바구니에서 직접 지울 수 있다.
async function removePaidItemsFromCart(order: OrderDetail): Promise<OrderDetail> {
  await Promise.allSettled(order.lines.map((line) => removeCartItem(line.productId)));
  return order;
}

// 확정된 주문(PAID 또는 CANCELLED)을 돌려주고, 확인 시간 안에 확정되지 않으면 null을 돌려준다.
async function settlePayment(orderNo: string, paymentKey: string, amount: number): Promise<OrderDetail | null> {
  if (await requestApproval(orderNo, paymentKey, amount)) {
    return removePaidItemsFromCart(await getOrder(orderNo));
  }

  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    const order = await getOrder(orderNo);
    if (order.status === 'PAID') return removePaidItemsFromCart(order);
    if (order.status === 'CANCELLED') return order;
  }
  return null;
}

// StrictMode에서 effect가 두 번 실행돼도 승인 요청은 주문당 한 번만 보낸다.
const settlements = new Map<string, Promise<OrderDetail | null>>();

type Result = { state: 'pending' } | { state: 'settled'; order: OrderDetail | null } | { state: 'error'; error: ApiError };

// 토스 successUrl - 결제창 인증만 끝난 상태라 여기서 승인을 요청해야 결제가 완료된다.
export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const { refresh: refreshCartCount } = useCartCount();
  const [result, setResult] = useState<Result>({ state: 'pending' });

  const orderNo = params.get('orderId');
  const paymentKey = params.get('paymentKey');
  const amount = Number(params.get('amount'));
  const valid = Boolean(orderNo && paymentKey && amount > 0);

  useEffect(() => {
    if (!orderNo || !paymentKey || !(amount > 0)) return;

    let settlement = settlements.get(orderNo);
    if (!settlement) {
      settlement = settlePayment(orderNo, paymentKey, amount);
      settlements.set(orderNo, settlement);
    }

    let active = true;
    settlement
      .then((order) => {
        if (order?.status === 'PAID') refreshCartCount();
        if (active) setResult({ state: 'settled', order });
      })
      .catch((e: unknown) => {
        if (active) setResult({ state: 'error', error: asApiError(e) });
      });
    return () => {
      active = false;
    };
  }, [orderNo, paymentKey, amount, refreshCartCount]);

  if (!valid) {
    return (
      <section className="narrow">
        <Notice tone="error" title="결제 정보를 확인할 수 없습니다.">
          <p>결제창을 거쳐 들어온 주소가 아닙니다. 주문 내역에서 결제 결과를 확인해주세요.</p>
        </Notice>
        <Link to="/me" className="button">
          주문 내역 보기
        </Link>
      </section>
    );
  }

  if (result.state === 'pending') {
    return <p className="page-status">결제를 확인하고 있습니다. 승인이 늦어지면 몇 분 정도 걸릴 수 있습니다.</p>;
  }

  if (result.state === 'error') {
    return (
      <section className="narrow">
        <ErrorNotice error={result.error} />
        <Link to="/cart" className="button">
          장바구니로 돌아가기
        </Link>
      </section>
    );
  }

  const { order } = result;

  if (!order) {
    return (
      <section className="narrow">
        <Notice title="결제 결과를 아직 확인하지 못했습니다.">
          <p>결제는 계속 처리되고 있습니다. 잠시 후 주문 내역에서 결과를 확인해주세요.</p>
        </Notice>
        <Link to="/me" className="button">
          주문 내역 보기
        </Link>
      </section>
    );
  }

  if (order.status === 'CANCELLED') {
    return (
      <section className="narrow">
        <Notice tone="error" title="결제가 승인되지 않아 주문이 취소되었습니다.">
          <p>청구된 금액은 없습니다. 장바구니에서 다시 주문해주세요.</p>
        </Notice>
        <Link to="/cart" className="button">
          장바구니로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className="narrow">
      <Notice tone="success" title="결제가 완료되었습니다.">
        <p>{order.orderName}</p>
        <p>결제금액 {formatWon(order.totalAmount)}</p>
        <p className="notice__meta">주문번호 {order.orderNo}</p>
      </Notice>
      <div className="button-row">
        <Link to="/me" className="button button--primary">
          주문 내역 보기
        </Link>
        <Link to="/" className="button">
          쇼핑 계속하기
        </Link>
      </div>
    </section>
  );
}
