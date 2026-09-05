import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { t, type MessageKey } from '@chickadee/i18n';
import { cx, RichText } from '@chickadee/ui';
import type { InkLayer } from '@chickadee/ui';
import type { DictLayer } from '@chickadee/store-sql';

import { AskRung } from './AskRung';
import type { AskRungProps } from './AskRung';
import { DictRung } from './DictRung';
import { PrereqRung } from './PrereqRung';
import type { PrereqRow } from './PrereqRung';
import { UsesRung } from './UsesRung';
import type { UseRow } from './UsesRung';
import './ReprintLadder.css';

/** 사다리 단. 1→4 로 갈수록 밖으로 나간다 — 4단만 선택 사항이다 (정본 §3-1). */
export type RungNo = 1 | 2 | 3 | 4;

/** 4단의 머리말. 목업 `t0.js` 의 `RUNGS` 그대로. 문장은 부를 때 푼다 (D117). */
const RUNGS = [
  { h: 'ladder.rung1', s: 'ladder.rung1Sub', llm: false },
  { h: 'ladder.rung2', s: 'ladder.rung2Sub', llm: false },
  { h: 'ladder.rung3', s: 'ladder.rung3Sub', llm: false },
  { h: 'ladder.rung4', s: 'ladder.rung4Sub', llm: true },
] as const satisfies readonly { h: MessageKey; s: MessageKey; llm: boolean }[];

const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'] as const;
const NUMPADS = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'] as const;

/** 사다리가 그리는 카드. `PrereqRow`·`UseRow` 가 왜 스키마 타입이 아닌지는 각 파일에 적었다. */
export interface LadderCard {
  dict: readonly DictLayer[];
  prereq: readonly PrereqRow[];
  uses: readonly UseRow[];
}

export interface ReprintLadderProps {
  rung: RungNo;
  onRung: (rung: RungNo) => void;
  /** 사다리를 열기 전의 겹. */
  lyFrom: InkLayer;
  /** 사다리를 열어 한 겹 내려간 뒤의 겹. */
  lyTo: InkLayer;
  card: LadderCard;
  /** 이번 사다리에서 이미 보고 온 아래층 개념 id. */
  prereqDone: readonly string[];
  /** 원래 예정돼 있던 다시 찍기 시점 — 「11일 뒤」. */
  nextWas?: string | undefined;
  onJump?: ((row: PrereqRow) => void) | undefined;
  ask: AskRungProps;
}

/** 입력 칸 안에서는 `1~4` 가 단축키가 아니라 글자다. */
function isTyping(el: Element | null): boolean {
  if (el === null) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || (el as HTMLElement).isContentEditable;
}

/**
 * `.reprint` — 「모르겠어요 = 다시 찍기」 4단 사다리 (05 §5 · 정본 §3-1).
 *
 * 목업의 세션 `.ladder` 를 `.reprint` 로 개명했다 — 홈의 잉크 겹 척도 `.ladder`(→ `.inkscale`)와
 * 이름이 겹쳤다 (05 §5 첫 문단).
 *
 * 벌이 아니라 공정이다. 열면 한 겹 내려가고 다시 찍는 시점이 오늘로 당겨지는데, 머리말은 그것을
 * **이득으로** 적는다. 단 이동은 tablist 관례를 따른다: `←→`·`Home`/`End` 로 포커스만 옮기고
 * `Enter`/`Space` 로 연다. `1~4` 는 **포커스가 사다리 안일 때만** 단 선택이다 (D11).
 */
export function ReprintLadder({
  rung,
  onRung,
  lyFrom,
  lyTo,
  card,
  prereqDone,
  nextWas,
  onJump,
  ask,
}: ReprintLadderProps) {
  const ref = useRef<HTMLElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // 매 렌더 새 함수로 오는 콜백을 리스너에 굳히지 않는다 — 다시 걸면 포커스를 또 뺏는다.
  const onRungRef = useRef(onRung);
  useEffect(() => {
    onRungRef.current = onRung;
  }, [onRung]);

  const focusTab = (n: RungNo) => {
    tabsRef.current?.querySelector<HTMLButtonElement>(`.rung[data-r="${n}"]`)?.focus();
  };

  // 사다리를 열면 현재 단으로 포커스가 온다 (05 §7). 단이 바뀔 때는 다시 옮기지 않는다 —
  // 그때 포커스는 이미 그 단추 위에 있다.
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLButtonElement>('.rung[aria-selected="true"]')?.focus();
  }, []);

  // `1~4` 는 사다리 안에서만 단 선택이다. 네이티브 리스너로 거는 이유는 `region` 에
  // JSX 핸들러를 달면 jsx-a11y 가 막기 때문이다 — 마우스 사용자는 단추로 이미 닿는다.
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(document.activeElement)) return;
      const i = DIGITS.indexOf(e.code as (typeof DIGITS)[number]);
      const j = NUMPADS.indexOf(e.code as (typeof NUMPADS)[number]);
      const n = i >= 0 ? i + 1 : j >= 0 ? j + 1 : 0;
      if (n === 0) return;
      e.preventDefault();
      // 세션의 `1~4`(보기 고르기)까지 가지 않게 여기서 멈춘다 (D11).
      e.stopPropagation();
      onRungRef.current(n as RungNo);
      focusTab(n as RungNo);
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, n: RungNo) => {
    if (e.nativeEvent.isComposing) return;
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      const delta = e.code === 'ArrowRight' ? 1 : -1;
      focusTab((((n - 1 + delta + RUNGS.length) % RUNGS.length) + 1) as RungNo);
      return;
    }
    if (e.code === 'Home') {
      e.preventDefault();
      focusTab(1);
      return;
    }
    if (e.code === 'End') {
      e.preventDefault();
      focusTab(RUNGS.length as RungNo);
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
      e.preventDefault();
      onRung(n);
    }
  };

  const panelId = 'reprint-panel';
  const tabId = (n: RungNo) => `reprint-tab-${n}`;

  return (
    <section ref={ref} className="reprint" aria-label={t('ladder.label')}>
      <div className="ld-head">
        <div>
          <h3>{t('ladder.heading')}</h3>
          <RichText as="p" html={t('ladder.note')} />
        </div>
        <div className="ld-gain">
          {t('ladder.ink')} <b>{t('plate.layerN', { n: String(lyFrom) })}</b>{' '}
          <span className="arr">→</span> <b>{t('plate.layerN', { n: String(lyTo) })}</b>
          {nextWas === undefined ? null : (
            <>
              {' '}
              · {t('session.roleRetry')} <b>{nextWas}</b> <span className="arr">→</span>{' '}
              <b>{t('ladder.today')}</b>
            </>
          )}
        </div>
      </div>

      <div ref={tabsRef} className="rungs" role="tablist" aria-label={t('ladder.tabs')}>
        {RUNGS.map((r, i) => {
          const n = (i + 1) as RungNo;
          const on = rung === n;
          return (
            <button
              key={n}
              type="button"
              className={cx('rung', on && 'on', r.llm && 'llm')}
              data-r={n}
              role="tab"
              id={tabId(n)}
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => onRung(n)}
              onKeyDown={(e) => onTabKey(e, n)}
            >
              <b>{t('ladder.rungNo', { n: String(n) })}</b>
              <span>{t(r.h)}</span>
              <small>{t(r.s)}</small>
            </button>
          );
        })}
      </div>

      <div className="rung-body" id={panelId} role="tabpanel" aria-labelledby={tabId(rung)} tabIndex={0}>
        {rung === 1 ? <DictRung layers={card.dict} /> : null}
        {rung === 2 ? <PrereqRung rows={card.prereq} done={prereqDone} onJump={onJump} /> : null}
        {rung === 3 ? <UsesRung uses={card.uses} /> : null}
        {rung === 4 ? <AskRung {...ask} /> : null}
      </div>
    </section>
  );
}
