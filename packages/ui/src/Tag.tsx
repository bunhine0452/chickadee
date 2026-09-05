import type { ReactNode } from 'react';
import { cx } from './cx';
import './Tag.css';

/** 뜻이 있는 색만 쓴다 — 액센트 하나와 상태 넷 (정본 §6). */
export type TagTone = 'neutral' | 'accent' | 'ok' | 'bad' | 'warn' | 'info';

export interface TagProps {
  /**
   * 기본은 `neutral` 이다. 종류·트랙·범주를 색으로 가르지 마라 — 그 정보는 글자가 나른다.
   * 색을 쓰는 것은 「맞았다 · 틀렸다 · 진행 중 · 잠김」처럼 **상태**일 때뿐이다.
   */
  tone?: TagTone | undefined;
  /** 테두리와 면을 빼고 글자만 남긴다. */
  ghost?: boolean | undefined;
  children: ReactNode;
}

/** `.tag` — 짧은 라벨. 색만으로 정보를 나르지 않도록 안에 항상 글자가 있다 (05 §9 색맹). */
export function Tag({ tone = 'neutral', ghost, children }: TagProps) {
  return <span className={cx('tag', tone !== 'neutral' && tone, ghost === true && 'ghost')}>{children}</span>;
}
