import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { getSuggestions, type SearchSource } from '../api/search';
import { SEARCH_PATH, SOURCE_PARAM } from '../lib/search';

const DEBOUNCE_MS = 250;
const MAX_QUERY_LENGTH = 50; // 서버가 이보다 긴 검색어를 400으로 거절한다

// 헤더 검색창. 입력하면 자동완성 후보를 보여주고, 제출하면 검색 결과 페이지로 이동한다.
export function SearchBox() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const listId = useId();

  // 검색 결과 화면에서는 현재 검색어를 보여주고, 다른 화면으로 나가면 비운다.
  const urlKeyword = pathname === SEARCH_PATH ? (params.get('q') ?? '') : '';

  const [keyword, setKeyword] = useState(urlKeyword);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setKeyword(urlKeyword);
  }, [urlKeyword]);

  // 열려 있을 때만 조회한다. 선택/제출 후 setKeyword로 값이 바뀌어도 후보를 다시 열지 않기 위해 open을 조건으로 쓴다.
  useEffect(() => {
    const trimmed = keyword.trim();
    if (!open || trimmed === '') {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      getSuggestions(trimmed)
        .then((names) => {
          if (!active) return;
          setSuggestions(names);
          setActiveIndex(-1);
        })
        // 자동완성은 부가 기능이라 실패해도 알림 없이 후보만 비운다.
        .catch(() => {
          if (active) setSuggestions([]);
        });
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword, open]);

  const submit = (value: string, source: SearchSource = 'TYPED') => {
    const trimmed = value.trim();
    setOpen(false);
    setActiveIndex(-1);
    if (trimmed === '') return;
    setKeyword(trimmed);

    const search = new URLSearchParams({ q: trimmed });
    if (source === 'SUGGESTION') search.set(SOURCE_PARAM, source);
    navigate({ pathname: SEARCH_PATH, search: search.toString() });
  };

  const expanded = open && suggestions.length > 0;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter는 글자 확정용이라 제출로 취급하지 않는다.
    if (event.nativeEvent.isComposing) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      if (expanded && activeIndex >= 0) submit(suggestions[activeIndex], 'SUGGESTION');
      else submit(keyword);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // 입력창(-1)까지 포함해 순환한다.
      const total = suggestions.length + 1;
      setActiveIndex((index) => ((index + 1 + step + total) % total) - 1);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    if (!containerRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="app-search" role="search" ref={containerRef} onBlur={handleBlur}>
      <input
        type="search"
        className="app-search__input"
        placeholder="상품 검색"
        aria-label="상품 검색"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        maxLength={MAX_QUERY_LENGTH}
        value={keyword}
        onChange={(event) => {
          setKeyword(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {expanded && (
        <ul className="app-search__list" id={listId} role="listbox">
          {suggestions.map((name, index) => (
            <li
              key={name}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`app-search__option${index === activeIndex ? ' app-search__option--active' : ''}`}
              // 클릭 시 input이 blur되어 목록이 닫히기 전에 선택이 처리되도록 mousedown 기본 동작을 막는다.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => submit(name, 'SUGGESTION')}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
