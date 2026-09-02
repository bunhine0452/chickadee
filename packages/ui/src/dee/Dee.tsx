import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { cx } from '../cx';
import type { InkLayer } from '../types';
import { useDeeMotion } from './useDeeMotion';
import type { DeeMotion } from './useDeeMotion';
import './dee.css';

/** 심볼 3종. `#logo` 는 브랜드 마크라 `Dee` 가 아니라 `DeeLogo` 가 그린다. */
export type DeeSymbol = 'badge' | 'bird' | 'head';

/** 이 크기 아래로는 전신이 판독되지 않는다 — 자동으로 머리 심볼로 바꾼다 (05 §6). */
export const DEE_HEAD_SIZE_LIMIT = 24;

const SYMBOL_ID: Readonly<Record<DeeSymbol, string>> = {
  badge: 'dee',
  bird: 'deeBird',
  head: 'deeHead',
};

export interface DeeProps {
  /** 잉크 겹 0~4. `data-ly` 속성 하나만 바뀌고 DOM 은 그대로다. */
  ly: InkLayer;
  symbol?: DeeSymbol | undefined;
  /** px. `DEE_HEAD_SIZE_LIMIT` 미만이면 심볼이 `head` 로 바뀐다. */
  size?: number | undefined;
  motion?: DeeMotion | null | undefined;
  /** 크림 원판 위에 얹은 스티커로 감싼다 (`.dee-sticker`). */
  sticker?: boolean | undefined;
  /** 타이핑 중이면 모션 0 (05 §6). */
  typing?: boolean | undefined;
  /** 감축 모드 — 클래스는 붙고 최종 포즈만 남는다. */
  reducedMotion?: boolean | undefined;
  /** 같은 모션을 다시 재생시키려면 올린다. */
  motionNonce?: number | undefined;
  className?: string | undefined;
}

/**
 * `.dee` — 판(plate)이 겹으로 켜지는 박새. 표정은 없다 (05 §6).
 * 장식이므로 접근성 트리에서 뺀다 — 겹은 `Passes` 와 글자가 나른다.
 */
export function Dee({
  ly,
  symbol = 'badge',
  size,
  motion,
  sticker,
  typing,
  reducedMotion,
  motionNonce,
  className,
}: DeeProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  useDeeMotion(ref, motion, { typing, reducedMotion, nonce: motionNonce });

  const resolved: DeeSymbol = size !== undefined && size < DEE_HEAD_SIZE_LIMIT ? 'head' : symbol;
  const box: CSSProperties | undefined = size === undefined ? undefined : { width: size, height: size };

  const svg = (
    <svg
      ref={ref}
      className={cx('dee', className)}
      data-ly={ly}
      style={sticker === true ? undefined : box}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${SYMBOL_ID[resolved]}`} />
    </svg>
  );

  if (sticker !== true) return svg;
  return (
    <span className="dee-sticker" style={box}>
      {svg}
    </span>
  );
}

export interface DeeLogoProps {
  size?: number | undefined;
  className?: string | undefined;
}

/** `#logo` — 고정색 브랜드 마크 (마스트헤드 66px · 작업 띠 46px · 요약 84px). */
export function DeeLogo({ size, className }: DeeLogoProps) {
  const box: CSSProperties | undefined = size === undefined ? undefined : { width: size, height: size };
  return (
    <svg className={cx('brand-logo', className)} style={box} aria-hidden="true" focusable="false">
      <use href="#logo" />
    </svg>
  );
}
