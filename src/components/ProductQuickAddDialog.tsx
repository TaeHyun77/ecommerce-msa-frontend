import { useEffect, useRef, useState } from 'react';
import { addCartItem } from '../api/cart';
import { asApiError } from '../api/client';
import { getProduct } from '../api/product';
import { useCartCount } from '../cart/CartCountProvider';
import { useRequest } from '../hooks/useRequest';
import { formatWon } from '../lib/format';
import { QuantityStepper } from './QuantityStepper';

interface ProductQuickAddDialogProps {
  productId: number;
  onClose: () => void;
  onAdded: () => void;
}

// 목록에서 상세로 들어가지 않고 수량을 정해 담는 모달.
// 상품 설명은 목록 응답(ProductListItem)에 없어 열릴 때 상세를 따로 조회한다.
export function ProductQuickAddDialog({ productId, onClose, onAdded }: ProductQuickAddDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { refresh: refreshCartCount } = useCartCount();
  const { data: product, error, loading } = useRequest(() => getProduct(productId), [productId]);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // showModal()이어야 배경 딤과 포커스 가둠, ESC 닫기를 브라우저가 처리한다.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // 조회 실패는 모달을 열어둘 이유가 없어 알리고 닫는다.
  useEffect(() => {
    if (error) {
      window.alert(error.message);
      dialogRef.current?.close();
    }
  }, [error]);

  const handleAddToCart = async () => {
    if (!product) return;

    setAdding(true);
    try {
      await addCartItem({ productId: product.productId, quantity });
      refreshCartCount();
      onAdded();
      dialogRef.current?.close();
    } catch (e) {
      window.alert(asApiError(e).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    // ESC와 닫기 버튼 모두 close 이벤트로 모이므로 정리는 한 곳에서 한다.
    <dialog ref={dialogRef} className="quick-add" onClose={onClose}>
      <button type="button" className="quick-add__close" aria-label="닫기" onClick={() => dialogRef.current?.close()}>
        ✕
      </button>

      {!product ? (
        <p className="page-status">{loading ? '상품 정보를 불러오고 있습니다.' : '상품 정보를 가져오지 못했습니다.'}</p>
      ) : (
        <>
          <div className="quick-add__thumb">
            {product.thumbnailUrl && <img src={product.thumbnailUrl} alt="" />}
          </div>

          <div className="quick-add__info">
            {product.brand && <span className="quick-add__brand">{product.brand}</span>}
            <h2 className="quick-add__name">{product.name}</h2>
            <p className="quick-add__price">{formatWon(product.price)}</p>
            {product.description ? (
              <p className="quick-add__description">{product.description}</p>
            ) : (
              <p className="quick-add__description muted">등록된 상품 설명이 없습니다.</p>
            )}
          </div>

          <div className="quick-add__order">
            <QuantityStepper value={quantity} onChange={setQuantity} disabled={adding} />
            <span className="quick-add__total">{formatWon(product.price * quantity)}</span>
          </div>

          <button
            type="button"
            className="button button--primary quick-add__submit"
            disabled={adding}
            onClick={handleAddToCart}
          >
            {adding ? '담는 중…' : '장바구니 담기'}
          </button>
        </>
      )}
    </dialog>
  );
}
