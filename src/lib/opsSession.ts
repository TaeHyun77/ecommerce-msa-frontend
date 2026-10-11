import type { Product } from '../types/api';

// 백엔드에 상품 목록 조회 API가 아직 없어서,
// 이 브라우저 탭에서 등록한 상품을 sessionStorage에 남겨 화면에 다시 보여준다.
const PRODUCTS_KEY = 'ops.registeredProducts';

function read<T>(key: string): T[] {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(items));
  } catch {
    // 저장 공간이 없어도 화면 동작에는 영향이 없다.
  }
}

export const opsSession = {
  products(): Product[] {
    return read<Product>(PRODUCTS_KEY);
  },
  addProduct(product: Product) {
    const rest = read<Product>(PRODUCTS_KEY).filter((p) => p.productCode !== product.productCode);
    write(PRODUCTS_KEY, [product, ...rest]);
  },
};
