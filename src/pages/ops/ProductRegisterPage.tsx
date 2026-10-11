import { useState, type FormEvent } from 'react';
import { asApiError, type ApiError } from '../../api/client';
import { registerProduct } from '../../api/ops';
import { Field } from '../../components/Field';
import { ErrorNotice, Notice } from '../../components/Notice';
import { StorageBadge } from '../../components/StorageBadge';
import { formatWon } from '../../lib/format';
import { STORAGE_INFO, STORAGE_TYPES } from '../../lib/labels';
import { opsSession } from '../../lib/opsSession';
import type { Product, ProductCreateRequest, StorageType } from '../../types/api';

interface FormState {
  productCode: string;
  name: string;
  brand: string;
  description: string;
  storageType: StorageType | '';
  price: string;
  thumbnailUrl: string;
  categoryId: string;
}

const EMPTY_FORM: FormState = {
  productCode: '',
  name: '',
  brand: '',
  description: '',
  storageType: '',
  price: '',
  thumbnailUrl: '',
  categoryId: '',
};

const optional = (value: string) => (value.trim() === '' ? undefined : value.trim());

function validate(form: FormState): string | null {
  if (!form.productCode.trim()) return '상품코드를 입력해주세요.';
  if (!form.name.trim()) return '상품명을 입력해주세요.';
  if (!form.storageType) return '보관 방법을 선택해주세요.';
  if (form.price === '' || Number(form.price) < 0) return '판매가는 0원 이상이어야 합니다.';
  if (form.categoryId === '') return '카테고리 번호를 입력해주세요.';
  if (form.description.length > 500) return '상품 설명은 500자 이하여야 합니다.';
  return null;
}

export function ProductRegisterPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [clientError, setClientError] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Product | null>(null);
  const [registered, setRegistered] = useState<Product[]>(() => opsSession.products());

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setCreated(null);

    const message = validate(form);
    setClientError(message);
    if (message) return;

    const body: ProductCreateRequest = {
      productCode: form.productCode.trim(),
      name: form.name.trim(),
      brand: optional(form.brand),
      description: optional(form.description),
      storageType: form.storageType as StorageType,
      price: Number(form.price),
      thumbnailUrl: optional(form.thumbnailUrl),
      categoryId: Number(form.categoryId),
    };

    setSubmitting(true);
    try {
      const product = await registerProduct(body);
      opsSession.addProduct(product);
      setRegistered(opsSession.products());
      setCreated(product);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ops-page">
      <header className="ops-page__head">
        <h1 className="page-title">상품 등록</h1>
        <p className="muted">등록하면 재고가 0개로 함께 만들어집니다. 재고는 입고 처리로 늘어납니다.</p>
      </header>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form__grid">
          <Field label="상품코드" htmlFor="productCode" required hint="SKU. 입고할 때 이 코드로 상품을 찾습니다.">
            <input
              id="productCode"
              className="input input--code"
              value={form.productCode}
              onChange={(e) => update('productCode', e.target.value)}
              placeholder="SKU-0001"
              autoComplete="off"
            />
          </Field>
          <Field label="상품명" htmlFor="name" required>
            <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="유기농 우유 900ml" />
          </Field>
          <Field label="브랜드" htmlFor="brand">
            <input id="brand" className="input" value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="파크팜" />
          </Field>
          <Field label="판매가" htmlFor="price" required>
            <div className="input-affix">
              <input
                id="price"
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="3900"
              />
              <span className="input-affix__suffix">원</span>
            </div>
          </Field>
        </div>

        <fieldset className="field">
          <legend className="field__label">
            보관 방법<span className="field__required"> (필수)</span>
          </legend>
          <div className="storage-picker">
            {STORAGE_TYPES.map((type) => (
              <label key={type} className={`storage-option storage-option--${type.toLowerCase()}`}>
                <input
                  type="radio"
                  name="storageType"
                  value={type}
                  checked={form.storageType === type}
                  onChange={() => update('storageType', type)}
                />
                <span className="storage-option__label">{STORAGE_INFO[type].label}</span>
                <span className="storage-option__range">{STORAGE_INFO[type].range}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form__grid">
          <Field label="카테고리 번호" htmlFor="categoryId" required hint="카테고리 API가 아직 없어 번호로 입력합니다.">
            <input
              id="categoryId"
              className="input"
              type="number"
              min={1}
              inputMode="numeric"
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
              placeholder="1"
            />
          </Field>
          <Field label="썸네일 주소" htmlFor="thumbnailUrl">
            <input
              id="thumbnailUrl"
              className="input"
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => update('thumbnailUrl', e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>

        <Field label="상품 설명" htmlFor="description" hint={`${form.description.length} / 500자`}>
          <textarea
            id="description"
            className="input textarea"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>

        {clientError && <Notice tone="error" title={clientError} />}
        {error && <ErrorNotice error={error} hint={error.code === 'DUPLICATE_PRODUCT_CODE' ? '다른 상품코드를 입력하세요.' : undefined} />}
        {created && (
          <Notice tone="success" title={`${created.productCode} 등록됨`} />
        )}

        <div className="button-row">
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? '등록하는 중' : '상품 등록'}
          </button>
        </div>
      </form>

      {registered.length > 0 && (
        <section className="section" aria-labelledby="registered-title">
          <div className="section__head">
            <h2 id="registered-title" className="section__title">
              이 탭에서 등록한 상품
            </h2>
            <span className="muted">{registered.length}개</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">상품코드</th>
                  <th scope="col">상품명</th>
                  <th scope="col">보관</th>
                  <th scope="col" className="num">
                    판매가
                  </th>
                </tr>
              </thead>
              <tbody>
                {registered.map((product) => (
                  <tr key={product.productId}>
                    <td className="code">{product.productCode}</td>
                    <td>
                      {product.name}
                      {product.brand && <span className="muted"> {product.brand}</span>}
                    </td>
                    <td>
                      <StorageBadge type={product.storageType} />
                    </td>
                    <td className="num">{formatWon(product.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
