import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cx } from '@chickadee/ui';
import type { CodeLine, Seg } from '@chickadee/store-sql';

import { Hole } from './Hole';
import type { HoleState } from './Hole';
import { PickToken } from './PickToken';
import { hl } from './hl';
import './CodePlate.css';

/** 물리 키로 고를 수 있는 토큰 수. 05 §7 의 `1~4` 그대로. */
const PICK_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'] as const;
const NUMPAD_KEYS = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'] as const;

export interface CodePlateProps {
  lines: readonly CodeLine[];
  /** 지목형 — 판 안의 토큰이 곧 보기다. `role=radiogroup` 이 붙는다. */
  pickable?: boolean | undefined;
  /** 짚은 토큰 번호(1부터). 아직 안 짚었으면 `null`. */
  selected?: number | null | undefined;
  /** 채점된 뒤의 정답 토큰 번호. 주면 판이 굳고 더는 못 짚는다. */
  answer?: number | null | undefined;
  /** 빈칸형의 빈칸 한 자리. 판에 `▢` 가 뚫린다. */
  hole?: { value?: string | undefined; state: HoleState } | undefined;
  onPick?: ((k: number) => void) | undefined;
  className?: string | undefined;
}

/** 코드 한 줄을 강조 조각으로 그린다. 색은 글자에만 얹는다 — 판 안에 색 면은 없다. */
function HlText({ text }: { text: string }) {
  return (
    <>
      {hl(text).map((tk, i) =>
        tk.cls === null ? (
          <span key={i}>{tk.t}</span>
        ) : (
          <i key={i} className={tk.cls}>
            {tk.t}
          </i>
        ),
      )}
    </>
  );
}

/** 판에 실제로 박힌 토큰 번호들. 키보드 이동이 이 순서를 돈다. */
function pickKeys(lines: readonly CodeLine[]): number[] {
  const out: number[] = [];
  for (const line of lines) {
    if (!('seg' in line)) continue;
    for (const sg of line.seg) {
      if ('hole' in sg) continue;
      if (sg.pick !== undefined) out.push(sg.pick);
    }
  }
  return out;
}

/**
 * `.code` — 교정지 안의 코드 판 (05 §5).
 *
 * 보통은 읽기만 하는 `<div>` 다. `pickable` 이면 토큰이 보기가 되어
 * `role=radiogroup aria-label="짚을 곳"` 이 붙고 `←→`·`1~4` 로 옮긴다 (05 §7).
 * 채점되면 `pickable` 클래스만 걷어 커서를 되돌리고 역할은 남긴다 — 굳은 라디오도
 * 스크린리더에는 여전히 「보기 묶음」이라야 무엇을 골랐는지 읽힌다.
 */
export function CodePlate({ lines, pickable, selected, answer, hole, onPick, className }: CodePlateProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const graded = answer !== null && answer !== undefined;
  const keys = pickKeys(lines);

  const move = (delta: number) => {
    if (keys.length === 0) return;
    const at = selected == null ? -1 : keys.indexOf(selected);
    const next = at < 0 ? (delta > 0 ? keys[0] : keys[keys.length - 1]) : keys[(at + delta + keys.length) % keys.length];
    if (next === undefined) return;
    onPick?.(next);
    ref.current?.querySelector<HTMLButtonElement>(`.tk[data-k="${next}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 한국어 IME 조합 중에는 판정하지 않는다. 키는 물리 키(`e.code`)로만 본다 (05 §7).
    if (e.nativeEvent.isComposing || pickable !== true || graded) return;
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      move(1);
      return;
    }
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      move(-1);
      return;
    }
    const digit = PICK_KEYS.indexOf(e.code as (typeof PICK_KEYS)[number]);
    const pad = NUMPAD_KEYS.indexOf(e.code as (typeof NUMPAD_KEYS)[number]);
    const n = digit >= 0 ? digit + 1 : pad >= 0 ? pad + 1 : 0;
    if (n === 0) return;
    const key = keys[n - 1];
    if (key === undefined) return;
    e.preventDefault();
    onPick?.(key);
    ref.current?.querySelector<HTMLButtonElement>(`.tk[data-k="${key}"]`)?.focus();
  };

  const group = pickable === true;

  const renderSegs = (segs: readonly Seg[]) =>
    segs.map((sg, i) => {
      if ('hole' in sg) return <Hole key={i} value={hole?.value} state={hole?.state ?? 'empty'} />;
      if (sg.pick === undefined) return <HlText key={i} text={sg.t} />;
      const k = sg.pick;
      return (
        <PickToken
          key={i}
          k={k}
          label={sg.t}
          checked={selected === k}
          right={graded && answer === k}
          wrong={graded && selected === k && answer !== k}
          disabled={graded || !group}
          tabIndex={selected == null ? (keys[0] === k ? 0 : -1) : selected === k ? 0 : -1}
          onPick={onPick}
        />
      );
    });

  // 빈 줄에도 공백 한 칸을 남긴다 — 안 그러면 그 줄만 높이가 무너져 세로 리듬이 어긋난다.
  const body = lines.map((line) => (
    <div key={line.n} className={cx('ln', line.target === true && 'hi')} data-n={line.n}>
      <i>{line.n}</i>
      <span>{'seg' in line ? renderSegs(line.seg) : line.t === '' ? ' ' : <HlText text={line.t} />}</span>
    </div>
  ));

  // 라디오 묶음일 때만 키를 듣는다 — 역할 없는 `<div>` 에 핸들러를 달면 마우스 없이
  // 닿을 수 없는 상호작용이 되고 jsx-a11y 가 막는다.
  // `tabIndex: -1` 은 탭 순서에 넣지 않으면서 프로그램 포커스만 허락한다 — 묶음 안의
  // 토큰이 로빙 tabindex 로 돌기 때문에 묶음 자신이 탭에 걸리면 한 번 더 멈추게 된다.
  const interactive = group
    ? { role: 'radiogroup' as const, 'aria-label': '짚을 곳', tabIndex: -1, onKeyDown }
    : {};

  return (
    <div ref={ref} className={cx('code', group && !graded && 'pickable', className)} {...interactive}>
      {body}
    </div>
  );
}
