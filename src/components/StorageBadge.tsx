import { STORAGE_INFO } from '../lib/labels';
import type { StorageType } from '../types/api';

// 보관 온도는 신선식품 운영에서 가장 먼저 확인하는 정보라 색과 온도를 함께 표시한다.
export function StorageBadge({ type }: { type: StorageType }) {
  const info = STORAGE_INFO[type];
  return (
    <span className={`storage-badge storage-badge--${type.toLowerCase()}`}>
      <span className="storage-badge__label">{info.label}</span>
      <span className="storage-badge__range">{info.range}</span>
    </span>
  );
}
