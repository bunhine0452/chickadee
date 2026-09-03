import { RichText } from '@chickadee/ui';

import './HintBox.css';

export interface HintBoxProps {
  /** **이미 펼쳐진** 힌트만 넘어온다 — 몇 단까지 열렸는지는 부모가 안다. */
  hints: readonly string[];
}

/**
 * `.hintbox` — 펼친 힌트 (05 §5).
 *
 * 힌트 문구는 사전에서 온 서식 글(`<b>`)이라 `RichText` 를 지나간다 (06 §4.2 · D42).
 * 아직 하나도 안 펼쳤으면 자리 자체가 없다 — 빈 상자는 「여기 뭔가 있었나」를 남긴다.
 */
export function HintBox({ hints }: HintBoxProps) {
  if (hints.length === 0) return null;

  return (
    <div className="hintbox">
      {hints.map((h, i) => (
        <span key={i}>
          <b>힌트 {i + 1}</b> — <RichText html={h} />
        </span>
      ))}
    </div>
  );
}
