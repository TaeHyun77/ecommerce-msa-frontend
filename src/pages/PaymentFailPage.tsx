import { Link, useSearchParams } from 'react-router';
import { Notice } from '../components/Notice';

// 토스 failUrl - 결제창 인증 단계에서 실패한 경우라 승인 요청이 가지 않았고 청구되지 않는다.
export function PaymentFailPage() {
  const [params] = useSearchParams();
  const code = params.get('code');

  return (
    <section className="narrow">
      <Notice tone="error" title="결제를 완료하지 못했습니다.">
        <p>{params.get('message') ?? '결제 인증에 실패했습니다.'}</p>
        <p>청구된 금액은 없습니다. 만들어진 주문은 결제 기한이 지나면 자동으로 취소되고 확보한 재고도 돌아갑니다.</p>
        {code && <p className="notice__meta">{code}</p>}
      </Notice>
      <Link to="/cart" className="button">
        장바구니로 돌아가기
      </Link>
    </section>
  );
}
