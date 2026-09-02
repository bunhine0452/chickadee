import { cx } from './cx';
import type { InkLayer, Track } from './types';
import './Passes.css';

/** 겹 칸 수 — 잉크 겹은 0~4 이고 칸은 4개다 (0겹 = 전부 꺼짐). */
export const PASS_SLOTS = 4;

export interface PassesProps {
  /** 켜진 겹 수 (0~4). */
  n: InkLayer;
  track: Track;
  /**
   * 스크린리더 문장. **필수** — 색만으로 겹을 읽을 수 없다 (05 §9 색맹 행).
   * 예: `"T0 · 잉크 3겹"`.
   */
  label: string;
  /** 노드(스티커) 안에 쓰는 작은 판 — 목업 `.n-pass`. */
  compact?: boolean | undefined;
}

/** `.passes` / `.n-pass` — 잉크 겹 막대. */
export function Passes({ n, track, label, compact }: PassesProps) {
  return (
    <span className={cx(compact ? 'n-pass' : 'passes', track)} role="img" aria-label={label}>
      {Array.from({ length: PASS_SLOTS }, (_, i) => (
        <i key={i} className={i < n ? 'on' : undefined} />
      ))}
    </span>
  );
}
