import { CART_MAX_QUANTITY } from '../api/cart';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

export function QuantityStepper({ value, onChange, disabled = false }: QuantityStepperProps) {
  return (
    <div className="stepper" role="group" aria-label="수량">
      <button type="button" aria-label="수량 줄이기" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label="수량 늘리기"
        disabled={disabled || value >= CART_MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
