import { cx } from './cx';
import type { InkLayer, Track } from './types';
import './Passes.css';

/** 겹 칸 수 — 잉크 겹은 0~4 이고 칸은 4개다 (0겹 = 전부 꺼짐). */
export const PASS_SLOTS = 4;

export interface PassesProps {
  /** 켜진 겹 수 (0~4). */
  n: InkLayer;
  /**
   * 트랙. **색을 고르지 않는다** — 켜진 칸은 언제나 진행 색 하나다 (D179 · 정본 §6).
   * 클래스로만 남아 있고, 트랙 이름은 옆의 `Pill` 글자가 말한다. 트랙이 없는 자리
   * (겹 척도 · 선행 목록 · 판정란의 겹 이동)에서는 생략한다.
   */
  track?: Track | undefined;
  /**
   * 스크린리더 문장. **필수** — 색만으로 겹을 읽을 수 없다 (05 §9 색맹 행).
   * 예: `"T0 · 잉크 3겹"`.
   */
  label: string;
  /** 노드(스티커) 안에 쓰는 작은 판 — 목업 `.n-pass`. */
  compact?: boolean | undefined;
}

/** `.passes` / `.n-pass` — 겹 막대. 숫자와 막대가 진도를 말한다 (D179). */
export function Passes({ n, track, label, compact }: PassesProps) {
  return (
    <span className={cx(compact ? 'n-pass' : 'passes', track)} role="img" aria-label={label}>
      {Array.from({ length: PASS_SLOTS }, (_, i) => (
        <i key={i} className={i < n ? 'on' : undefined} />
      ))}
    </span>
  );
}
