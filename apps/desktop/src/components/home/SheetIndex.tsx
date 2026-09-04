import { useRef } from 'react';
import { t } from '@chickadee/i18n';
import { cx } from '@chickadee/ui';

import { sheetNo, type HomeSheet } from '../../screens/home/data';
import './SheetIndex.css';

export interface SheetIndexProps {
  sheets: readonly HomeSheet[];
  /** 지금 걸린 대지. 목록에 없으면 아무것도 고르지 않은 것으로 그린다. */
  selected: number | null;
  onSelect: (unitId: number) => void;
}

/** 다 찍은 노드 / 전체. 칩이 드는 유일한 수치다. */
function progressOf(sheet: HomeSheet): { done: number; all: number } {
  return { done: sheet.nodes.filter((n) => n.state === 'done').length, all: sheet.nodes.length };
}

/**
 * `.sheet-index` — 대지 색인 띠 (05 §5 · D133).
 *
 * **대지 더미를 세로로 쌓지 않는다.** 대지가 몇 장이든 이 띠는 한 줄이고, 아래에는 고른
 * 한 장만 걸린다 — 그래서 홈의 높이가 리포 크기와 무관해진다. 인쇄기에 한 번에 한 장을
 * 거는 것과 같은 모양이다.
 *
 * 탭이다: `← →` 로 옮기면 그 자리에서 걸리고(자동 활성), `Home`·`End` 가 양 끝이다.
 * 포커스는 고른 칩 하나만 탭 순서에 둔다(roving tabindex).
 */
export function SheetIndex({ sheets, selected, onSelect }: SheetIndexProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  if (sheets.length === 0) return null;

  const at = sheets.findIndex((s) => s.unitId === selected);

  /** 그 자리로 옮기고 고른다. 포커스도 같이 간다 — 탭은 포커스가 곧 선택이다. */
  const move = (to: number): void => {
    const sheet = sheets[to];
    if (sheet === undefined) return;
    onSelect(sheet.unitId);
    ref.current?.querySelectorAll<HTMLButtonElement>('button.sx')[to]?.focus();
  };

  const onKey = (e: React.KeyboardEvent): void => {
    const last = sheets.length - 1;
    if (e.code === 'ArrowRight') { e.preventDefault(); move(at >= last ? 0 : at + 1); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); move(at <= 0 ? last : at - 1); }
    else if (e.code === 'Home') { e.preventDefault(); move(0); }
    else if (e.code === 'End') { e.preventDefault(); move(last); }
  };

  return (
    <div
      ref={ref}
      className="sheet-index"
      role="tablist"
      aria-label={t('home.sheetIndex')}
    >
      {sheets.map((sheet, i) => {
        const { done, all } = progressOf(sheet);
        const on = sheet.unitId === selected;
        // 0장은 리포의 기능이 아니라 프롤로그다 — 「N대」 판번호를 붙이지 않는다 (D136).
        const no = sheetNo(sheets, i);
        const sig = sheet.zero ? t('home.zeroChapterSig') : t('home.sheetSig', { n: String(no) });
        return (
          <button
            key={sheet.unitId}
            type="button"
            role="tab"
            id={`sx-${sheet.unitId}`}
            className={cx('sx', on && 'on', sheet.zero && 'sx-zero')}
            data-state={sheet.state}
            aria-selected={on}
            aria-controls={`sheet-panel-${sheet.unitId}`}
            tabIndex={on ? 0 : -1}
            // 칩 안의 글자는 잘릴 수 있다 — 읽히는 이름은 언제나 온전한 한 줄이다.
            aria-label={sheet.zero
              ? `${sheet.name} · ${t('home.zeroChapterMeta', { n: String(all) })}`
              : t('home.sheetChip', {
                no: String(no), name: sheet.name, done: String(done), all: String(all),
              })}
            onClick={() => onSelect(sheet.unitId)}
            onKeyDown={onKey}
          >
            <span className="sx-no" aria-hidden="true">{sig}</span>
            <span className="sx-name" aria-hidden="true">{sheet.name}</span>
            <span className="sx-count" aria-hidden="true">{done} / {all}</span>
            <span
              className="sx-bar"
              aria-hidden="true"
              style={{ '--fill': `${all === 0 ? 0 : Math.round(100 * done / all)}%` } as React.CSSProperties}
            />
          </button>
        );
      })}
    </div>
  );
}
