import { useState } from 'react';
import { useNavigate } from 'react-router';
import { asApiError, type ApiError } from '../api/client';
import { getMyOrders } from '../api/member';
import { useAuth } from '../auth/AuthProvider';
import { ErrorNotice } from '../components/Notice';
import { useRequest } from '../hooks/useRequest';
import { formatDateTime, formatWon } from '../lib/format';
import { orderStatusLabel, PROVIDER_LABEL } from '../lib/labels';

export function MyPage() {
  const { member } = useAuth();
  if (!member) return null;

  return (
    <div className="mypage">
      <section className="profile" aria-labelledby="profile-title">
        {member.profileImageUrl ? (
          <img className="profile__avatar" src={member.profileImageUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="profile__avatar profile__avatar--empty" aria-hidden="true">
            {member.nickname.slice(0, 1)}
          </span>
        )}
        <div className="profile__text">
          <h1 id="profile-title" className="profile__name">
            {member.nickname}
          </h1>
          <p className="profile__email">{member.email}</p>
          <p className="profile__meta">
            <span className={`provider-tag provider-tag--${member.provider.toLowerCase()}`}>
              {PROVIDER_LABEL[member.provider]} 계정
            </span>
            {member.role === 'ADMIN' && <span className="provider-tag">관리자</span>}
          </p>
        </div>
      </section>

      <OrderSection />
      <WithdrawSection />
    </div>
  );
}

function OrderSection() {
  const { data: orders, error, loading, reload } = useRequest(getMyOrders, []);

  return (
    <section className="section" aria-labelledby="orders-title">
      <div className="section__head">
        <h2 id="orders-title" className="section__title">
          주문 내역
        </h2>
        {orders && orders.length > 0 && <span className="muted">{orders.length}건</span>}
      </div>

      {error && (
        <div className="stack-sm">
          <ErrorNotice
            error={error}
            hint={
              error.code === 'ORDER_SERVICE_UNAVAILABLE'
                ? '주문 서비스가 응답하지 않아 잠시 조회를 멈췄습니다. 회원 정보는 그대로 이용할 수 있습니다.'
                : undefined
            }
          />
          <button type="button" className="button" onClick={reload} disabled={loading}>
            {loading ? '다시 불러오는 중' : '다시 불러오기'}
          </button>
        </div>
      )}

      {!error && loading && !orders && <p className="muted">주문 내역을 불러오고 있습니다.</p>}

      {!error && orders && orders.length === 0 && <p className="empty">아직 주문한 내역이 없습니다.</p>}

      {orders && orders.length > 0 && (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.orderId} className="order-row">
              <div className="order-row__main">
                <span className="order-row__no">주문번호 {order.orderId}</span>
                <span className="order-row__date">{formatDateTime(order.orderedAt)}</span>
              </div>
              <span className={`order-status order-status--${order.status.toLowerCase()}`}>
                {orderStatusLabel(order.status)}
              </span>
              <span className="order-row__amount">{formatWon(order.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WithdrawSection() {
  const { withdraw } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleWithdraw = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await withdraw();
      navigate('/login', { replace: true, state: { notice: '탈퇴가 완료되었습니다.' } });
    } catch (e) {
      setError(asApiError(e));
      setSubmitting(false);
    }
  };

  return (
    <section className="section section--danger" aria-labelledby="withdraw-title">
      <h2 id="withdraw-title" className="section__title">
        회원 탈퇴
      </h2>
      <p className="muted">
        탈퇴하면 닉네임과 프로필 사진이 지워지고 모든 기기에서 로그아웃됩니다. 같은 소셜 계정으로 다시 로그인하면
        계정이 다시 활성화됩니다.
      </p>

      {error && <ErrorNotice error={error} />}

      {confirming ? (
        <div className="button-row">
          <button type="button" className="button button--danger" onClick={handleWithdraw} disabled={submitting}>
            {submitting ? '탈퇴 처리 중' : '탈퇴하기'}
          </button>
          <button type="button" className="button button--quiet" onClick={() => setConfirming(false)} disabled={submitting}>
            취소
          </button>
        </div>
      ) : (
        <button type="button" className="button button--outline-danger" onClick={() => setConfirming(true)}>
          회원 탈퇴
        </button>
      )}
    </section>
  );
}
