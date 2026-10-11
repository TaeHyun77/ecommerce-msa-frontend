import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCart } from '../api/cart';
import { useAuth } from '../auth/AuthProvider';

interface CartCountContextValue {
  count: number; // 담긴 상품 종류 수 - 수량 합계가 아니다
  refresh: () => void;
}

const CartCountContext = createContext<CartCountContextValue | null>(null);

// 헤더 배지용으로만 장바구니 개수를 들고 있는다.
// 장바구니를 바꾸는 화면이 여러 곳(상품 목록 모달, 상품 상세, 장바구니)이라 갱신 시점을 refresh()로 공유한다.
export function CartCountProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [count, setCount] = useState(0);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') {
      setCount(0);
      return;
    }

    let active = true;
    getCart()
      .then((cart) => {
        if (active) setCount(cart.items.length);
      })
      .catch(() => {
        // 배지는 보조 정보라 조회가 실패해도 화면을 막지 않고 직전 값을 유지한다.
      });

    return () => {
      active = false;
    };
  }, [status, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(() => ({ count, refresh }), [count, refresh]);

  return <CartCountContext.Provider value={value}>{children}</CartCountContext.Provider>;
}

export function useCartCount(): CartCountContextValue {
  const context = useContext(CartCountContext);
  if (!context) throw new Error('useCartCount는 CartCountProvider 안에서만 사용할 수 있습니다.');
  return context;
}
