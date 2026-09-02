import type { CSSProperties } from 'react';
import { cx } from './cx';
// 토큰은 앱의 `apps/desktop/src/styles/tokens.css` 가 단일 출처다(`pnpm design:sync` 가 생성).
// 이 컴포넌트가 쓰는 --verdict-* 도 거기 있다 — 여기서 다시 정의하면 두 출처가 갈라진다(D56).
import './Stamp.css';

/** 목업 클래스명 그대로. 뜻은 정합 / 동등 / 어긋남 (00 §3). */
export type StampTone = 'pink' | 'blue' | 'yellow';

export interface StampProps {
  text: string;
  sub?: string | undefined;
  tone?: StampTone | undefined;
  big?: boolean | undefined;
  /** 도장 각도(도). 부속 숨김이면 CSS 가 무시한다. */
  rotate?: number | undefined;
  /** 찍히는 순간의 .38s 애니메이션. */
  hit?: boolean | undefined;
}

/**
 * `.stamp` — 판정 도장. 오버프린트(`mix-blend-mode`)라 **본문 단 밖에서만** 쓴다 (05 §4.3).
 * 의미는 `h4`·`LiveRegion` 이 나르므로 도장 자체는 접근성 트리에서 뺀다 (05 §5).
 */
export function Stamp({ text, sub, tone = 'pink', big, rotate, hit }: StampProps) {
  const style: CSSProperties | undefined =
    rotate === undefined ? undefined : ({ '--r': `${rotate}deg` } as CSSProperties);
  return (
    <span
      className={cx('stamp', tone !== 'pink' && tone, big && 'big', hit && 'hit')}
      style={style}
      aria-hidden="true"
    >
      {text}
      {sub === undefined ? null : <small>{sub}</small>}
    </span>
  );
}
