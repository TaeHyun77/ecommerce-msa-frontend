import { useCallback, useEffect, useState } from 'react';
import { ApiError, asApiError } from '../api/client';

interface RequestState<T> {
  data?: T;
  error?: ApiError;
  loading: boolean;
}

// 조회 API용 훅. reload()로 다시 요청하며, 재요청 중에도 이전 데이터는 유지한다.
export function useRequest<T>(fetcher: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<RequestState<T>>({ loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ data: prev.data, loading: true }));

    fetcher()
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch((error: unknown) => {
        if (active) setState((prev) => ({ data: prev.data, error: asApiError(error), loading: false }));
      });

    return () => {
      active = false;
    };
    // fetcher는 매 렌더마다 새로 만들어지므로 deps로 재요청 시점을 제어한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, reload };
}
