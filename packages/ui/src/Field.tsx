import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import './Field.css';

export interface FieldProps {
  label: string;
  /** 입력을 그리는 쪽. `id`·`aria-describedby` 를 받아 그대로 넘긴다. */
  children: (a: { id: string; 'aria-describedby': string | undefined; 'aria-invalid'?: true }) => ReactNode;
  /** 입력 아래 도움말. 오류가 있으면 오류가 이 자리를 대신한다. */
  hint?: string | undefined;
  /** 오류 문구. 있으면 `aria-invalid` 가 붙고 문구가 `role=alert` 로 나간다. */
  error?: string | undefined;
  /** 코드·경로를 넣는 칸이면 고정폭으로. */
  mono?: boolean | undefined;
}

/**
 * `.field` — 라벨 · 입력 · 도움말을 한 덩이로 묶는다.
 * 설명이 설명하는 것 바로 옆에 있어야 한다(근접성) — 이 컴포넌트가 그 거리를 고정한다.
 */
export function Field({ label, children, hint, error, mono }: FieldProps) {
  const id = useId();
  const describedBy = error !== undefined ? `${id}-err` : hint !== undefined ? `${id}-hint` : undefined;
  return (
    <div className={cx('field', mono === true && 'mono', error !== undefined && 'invalid')}>
      <label className="field-label" htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-describedby': describedBy,
        ...(error === undefined ? {} : { 'aria-invalid': true as const }),
      })}
      {error !== undefined
        ? <p className="field-error" id={`${id}-err`} role="alert">{error}</p>
        : hint !== undefined
          ? <p className="field-hint" id={`${id}-hint`}>{hint}</p>
          : null}
    </div>
  );
}
