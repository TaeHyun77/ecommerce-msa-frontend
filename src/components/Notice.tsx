import type { ReactNode } from 'react';
import type { ApiError } from '../api/client';

type Tone = 'error' | 'success' | 'info';

export function Notice({ tone = 'info', title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <p className="notice__title">{title}</p>}
      {children && <div className="notice__body">{children}</div>}
    </div>
  );
}

// 백엔드 에러 코드를 함께 보여주면 운영 화면에서 원인을 찾기 쉽다.
export function ErrorNotice({ error, hint }: { error: ApiError; hint?: ReactNode }) {
  return (
    <Notice tone="error" title={error.message}>
      {(error.code || error.status > 0) && (
        <p className="notice__meta">
          {error.status > 0 ? `HTTP ${error.status}` : ''}
          {error.code && error.status > 0 ? ' / ' : ''}
          {error.code}
        </p>
      )}
      {hint && <p>{hint}</p>}
    </Notice>
  );
}
