import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getCategories } from '../api/category';
import { useRequest } from '../hooks/useRequest';
import { CATEGORY_PARAM } from '../lib/category';

// 헤더 카테고리 메뉴. 왼쪽에서 상위를 고르면 오른쪽에 하위 목록이 나오고, 항목을 고르면 홈을 그 카테고리로 필터링한다.
export function CategoryMenu() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selectedId = Number(params.get(CATEGORY_PARAM)) || undefined;

  const { data: categories, error } = useRequest(getCategories, []);
  const [open, setOpen] = useState(false);
  const [activeTopId, setActiveTopId] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // 열면 첫 상위 카테고리를 보여줘서 오른쪽 패널이 비어 있지 않게 한다.
  const activeTop = categories?.find((top) => top.categoryId === activeTopId) ?? categories?.[0];

  // categoryId가 없으면 필터 없는 전체 상품 홈으로 이동한다.
  const select = (categoryId?: number) => {
    setOpen(false);
    const search = categoryId ? new URLSearchParams({ [CATEGORY_PARAM]: String(categoryId) }).toString() : '';
    navigate({ pathname: '/', search });
  };

  const subClass = (categoryId: number) =>
    `category-menu__sub${categoryId === selectedId ? ' category-menu__sub--selected' : ''}`;

  return (
    <div className="category-menu" ref={containerRef}>
      <button
        type="button"
        className="category-menu__toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span aria-hidden="true">☰</span> 카테고리
      </button>

      {open && (
        <div className="category-menu__panel">
          {error && <p className="category-menu__message">카테고리를 불러오지 못했습니다.</p>}

          {categories && (
            <>
              {/* 상위 항목은 하위 목록을 여는 용도로만 쓴다 - 호버가 없는 터치와 키보드에서도 하위에 닿을 수 있어야 해서,
                  상위 전체 보기는 오른쪽 패널의 첫 항목으로 따로 둔다. */}
              <ul className="category-menu__tops">
                <li>
                  <button type="button" className="category-menu__top" onClick={() => select()}>
                    전체 상품
                  </button>
                </li>
                {categories.map((top) => (
                  <li key={top.categoryId}>
                    <button
                      type="button"
                      className={`category-menu__top${top.categoryId === activeTop?.categoryId ? ' category-menu__top--active' : ''}`}
                      onMouseEnter={() => setActiveTopId(top.categoryId)}
                      onFocus={() => setActiveTopId(top.categoryId)}
                      onClick={() => setActiveTopId(top.categoryId)}
                    >
                      {top.name}
                    </button>
                  </li>
                ))}
              </ul>

              {activeTop && (
                <ul className="category-menu__subs">
                  <li>
                    <button
                      type="button"
                      className={subClass(activeTop.categoryId)}
                      onClick={() => select(activeTop.categoryId)}
                    >
                      {activeTop.name} 전체
                    </button>
                  </li>
                  {activeTop.children.map((sub) => (
                    <li key={sub.categoryId}>
                      <button
                        type="button"
                        className={subClass(sub.categoryId)}
                        onClick={() => select(sub.categoryId)}
                      >
                        {sub.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
