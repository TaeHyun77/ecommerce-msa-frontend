import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required && <span className="field__required"> (필수)</span>}
      </label>
      {children}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
