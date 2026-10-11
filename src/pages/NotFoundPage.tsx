import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="narrow">
      <h1 className="page-title">페이지를 찾을 수 없습니다</h1>
      <p className="muted">주소가 바뀌었거나 없는 페이지입니다.</p>
      <Link to="/" className="button">
        처음으로
      </Link>
    </section>
  );
}
