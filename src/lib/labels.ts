import type { Provider, StorageType } from '../types/api';

export const PROVIDER_LABEL: Record<Provider, string> = {
  KAKAO: '카카오',
  GOOGLE: '구글',
};

// 식품공전 보관 기준
export const STORAGE_INFO: Record<StorageType, { label: string; range: string }> = {
  REFRIGERATED: { label: '냉장', range: '0~10℃' },
  FROZEN: { label: '냉동', range: '-18℃ 이하' },
  ROOM_TEMPERATURE: { label: '상온', range: '15~25℃' },
};

export const STORAGE_TYPES: StorageType[] = ['REFRIGERATED', 'FROZEN', 'ROOM_TEMPERATURE'];

// order-service OrderStatus
const ORDER_STATUS_LABEL: Record<string, string> = {
  ORDERED: '주문 접수',
  PAID: '결제 완료',
  CANCELLED: '주문 취소',
  COMPLETED: '배송 완료',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}
