import type { ReactNode } from 'react';
import { cx } from './cx';
import type { Track } from './types';
import './Pill.css';

export interface PillProps {
  /** 트랙 색면. 없으면 종이 위 먹글자. */
  track?: Track | undefined;
  /** 테두리만 남긴 유령 알약. */
  ghost?: boolean | undefined;
  children: ReactNode;
}

/** `.pill` — 트랙 라벨. 색만으로 정보를 나르지 않도록 안에 항상 글자가 있다 (05 §9 색맹). */
export function Pill({ track, ghost, children }: PillProps) {
  return <span className={cx('pill', track, ghost && 'ghost')}>{children}</span>;
}
