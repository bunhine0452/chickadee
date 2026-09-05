import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { t } from '@chickadee/i18n';
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

/**
 * 한 번에 펴 두는 줄 수. 넘는 만큼은 접힌다 (D141).
 *
 * 왜 20 인가: 창은 감싸는 블록이라 이 리포 실측으로 중앙값 15~40줄, 최대 40줄
 * (`@chickadee/cards` 의 `WINDOW_MAX_LINES`)이다. 코드 한 줄이 16px × 1.85 ≈ 29.6px 라
 * 20줄이면 592px — 최소 창 680px(D11)에서 판정란 예약 118px 을 빼고 남는 자리에 가깝다.
 * 그리고 40줄을 다 펴면 한 판이 두 판 시간이 된다(사용자 판단, C 단계).
 */
const FOLD_LINES = 20;

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

/**
 * 접었을 때 보여 줄 구간 `[start, end)`. 초점을 가운데 두되, 짚을 토큰과 빈칸은
 * 접힘 뒤로 숨기지 않는다 — 숨기면 라디오 묶음에 없는 보기가 생긴다.
 *
 * `null` 이면 접지 않는다 (줄이 상한 이하이거나, 반드시 보여야 할 범위가 상한을 넘을 때).
 */
function foldOf(lines: readonly CodeLine[]): { start: number; end: number } | null {
  if (lines.length <= FOLD_LINES) return null;

  const must: number[] = [];
  lines.forEach((line, i) => {
    if (line.target === true || 'seg' in line) must.push(i);
  });
  const first = must[0] ?? 0;
  const last = must[must.length - 1] ?? 0;
  if (last - first + 1 > FOLD_LINES) return null;

  // 남는 자리를 위아래로 반씩 준다 — 접히는 쪽이 한쪽으로 쏠리지 않는다.
  const pad = Math.floor((FOLD_LINES - (last - first + 1)) / 2);
  const start = Math.max(0, Math.min(first - pad, lines.length - FOLD_LINES));
  return { start, end: start + FOLD_LINES };
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
  const [open, setOpen] = useState(false);
  const graded = answer !== null && answer !== undefined;
  const keys = pickKeys(lines);
  const foldable = useMemo(() => foldOf(lines), [lines]);
  const fold = open ? null : foldable;

  /**
   * 편 뒤에는 접는 단추가, 접은 뒤에는 펴는 단추가 방금 누른 자리를 대신한다. 손이 옮겨
   * 가지 않으면 키보드로 편 사람이 그 자리에서 포커스를 잃는다 (05 §7 키보드 완결).
   * 마우스로 눌렀을 때도 같은 자리로 가므로 다음 `Tab` 이 앞으로 돌아가지 않는다.
   */
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const sel = open ? '.unfold.less' : '.unfold:not(.less)';
    ref.current?.querySelector<HTMLButtonElement>(sel)?.focus();
  }, [open]);

  const toggleFold = (next: boolean) => {
    moved.current = true;
    setOpen(next);
  };

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
    // 펼침 단추 위에서는 `← →`·숫자가 토큰을 옮기면 안 된다 — 그 자리의 주인은 단추다.
    if ((e.target as HTMLElement).closest('.unfold') !== null) return;
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
  const lineRow = (line: CodeLine) => (
    <div key={line.n} className={cx('ln', line.target === true && 'hi')} data-n={line.n}>
      <i>{line.n}</i>
      <span>{'seg' in line ? renderSegs(line.seg) : line.t === '' ? ' ' : <HlText text={line.t} />}</span>
    </div>
  );

  /**
   * 접힌 자리 하나 · 다 편 뒤의 되접는 자리 하나. 진짜 `<button>` 이라 탭으로 닿고
   * Space 로 눌린다 — **접기·펴기는 마우스 없이도 왕복한다** (05 §7 키보드 완결).
   *
   * 키를 여기서 멈춰 세운다: `T0Plate` 가 `document` 에서 Enter 를 「제출」로, Space 를
   * 「다음」으로 듣는다(05 §7). 버블을 끊지 않으면 단추에 포커스가 있어도 판이 넘어간다.
   */
  const foldRow = (at: 'up' | 'down' | 'less', label: string, next: boolean) => (
    <div key={`fold-${at}`} className="ln fold">
      <i aria-hidden="true">{at === 'less' ? '' : '…'}</i>
      <span>
        <button
          type="button"
          className={cx('unfold', at === 'less' && 'less')}
          aria-expanded={!next}
          onClick={() => toggleFold(next)}
          onKeyDown={(e) => {
            if (e.code !== 'Enter' && e.code !== 'Space' && e.code !== 'NumpadEnter') return;
            e.preventDefault();
            e.stopPropagation();
            toggleFold(next);
          }}
        >
          {label}
        </button>
      </span>
    </div>
  );

  const more = (n: number): string => t('plate.foldMore', { n: String(n) });

  const body: ReactNode[] = [];
  if (fold === null) {
    body.push(...lines.map(lineRow));
    // 접을 수 있는 판을 편 상태 — 되접는 자리를 마지막 줄 뒤에 둔다.
    if (open && foldable !== null) body.push(foldRow('less', t('plate.foldLess'), false));
  } else {
    if (fold.start > 0) body.push(foldRow('up', more(fold.start), true));
    body.push(...lines.slice(fold.start, fold.end).map(lineRow));
    if (fold.end < lines.length) body.push(foldRow('down', more(lines.length - fold.end), true));
  }

  // 라디오 묶음일 때만 키를 듣는다 — 역할 없는 `<div>` 에 핸들러를 달면 마우스 없이
  // 닿을 수 없는 상호작용이 되고 jsx-a11y 가 막는다.
  // `tabIndex: -1` 은 탭 순서에 넣지 않으면서 프로그램 포커스만 허락한다 — 묶음 안의
  // 토큰이 로빙 tabindex 로 돌기 때문에 묶음 자신이 탭에 걸리면 한 번 더 멈추게 된다.
  const interactive = group
    ? { role: 'radiogroup' as const, 'aria-label': t('plate.pickTargets'), tabIndex: -1, onKeyDown }
    : {};

  return (
    <div ref={ref} className={cx('code', group && !graded && 'pickable', className)} {...interactive}>
      {body}
    </div>
  );
}
