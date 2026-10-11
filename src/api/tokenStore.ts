// Access Token은 XSS 노출을 줄이기 위해 메모리에만 둔다.
// 새로고침하면 사라지므로 앱 시작 시 Refresh Token 쿠키로 재발급받는다(AuthProvider 참고).
type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null) {
    if (token === accessToken) return;
    accessToken = token;
    listeners.forEach((listener) => listener(token));
  },
  clear() {
    tokenStore.set(null);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
