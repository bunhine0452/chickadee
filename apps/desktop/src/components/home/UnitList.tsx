import { t } from '@chickadee/i18n';
import { useId, useState } from 'react';

import { sheetNo, type HomeNode, type HomeSheet } from '../../screens/home/data';
import { dueLabel, layerLabel, trackName } from './labels';
import './UnitList.css';

export interface UnitListProps {
  sheets: readonly HomeSheet[];
  /** 인제스트된 파일 수. 단원이 하나도 없을 때 왜 없는지를 가른다 (D170 ⑥). */
  files: number;
  /** 원장 전체의 개념 수 · 배운 개념 수. */
  concepts: number;
  learned: number;
  /** 「이 문제 풀기」 — 그 개념을 오늘 목록에 건다. */
  onPick?: ((conceptId: string) => void) | undefined;
  /** 「이 단원 통째로 필사」 (D120). */
  onCourse?: ((unitId: number) => void) | undefined;
  /** 만기 문구의 기준 시각. 시험은 고정값을 넣는다. */
  now?: number | undefined;
}

const STATE_KEY = {
  done: 'home.stateDone',
  current: 'home.stateCurrent',
  locked: 'home.stateLocked',
  open: 'home.stateOpen',
} as const;

/** 코드에 실제로 적히는 글자. 이름 옆에 곁들이고, 없으면 안 그린다. */
function tokenOf(node: HomeNode): string | null {
  const token = node.token === null ? '' : node.token.trim();
  return token !== '' && token.length <= 20 ? token : null;
}

/**
 * `.units` — 단원 목록 (05 §2.1).
 *
 * **개념 스티커 격자를 목록 한 줄로 갈았다.** 스티커는 개념 하나에 90px 카드와 지터와
 * 도장을 썼고, 무엇을 익혔는지 읽으려면 색면과 겹 수를 해석해야 했다. 같은 정보를 이름 ·
 * 숙련도 · 상태 세 칸이 글자로 나른다 (정본 §6 「색은 뜻에만」·「장식 0」).
 *
 * 함께 뺀 것 — 노드 상세 팝오버(그 자리에서 열던 창을 줄 안에 폈다) · 대지 판번호 어긋남 ·
 * 「미조판 예고」 두 종(「아직 없다」를 두 문단으로 말했다. 빈 상태 한 줄로 충분하다).
 *
 * 한 번에 한 단원만 펴 둔다 — 화면에 한 가지 일이다 (정본 §3-9).
 */
export function UnitList({
  sheets, files, concepts, learned, onPick, onCourse, now,
}: UnitListProps) {
  const uid = useId();
  const first = sheets.find((s) => s.state === 'current')?.unitId ?? sheets[0]?.unitId ?? null;
  const [open, setOpen] = useState<number | null>(first);

  return (
    <section className="units" aria-labelledby={`${uid}-h`}>
      <div className="units-head">
        <h2 id={`${uid}-h`}>{t('home.unitsTitle')}</h2>
        {sheets.length === 0 ? null : (
          <p className="units-sum">
            {t('home.unitsSummary', { concepts: String(concepts), learned: String(learned) })}
          </p>
        )}
      </div>

      {sheets.length === 0 ? (
        <p className="note units-empty">
          {files > 0 ? t('home.noSheetsRead', { n: String(files) }) : t('home.noSheets')}
        </p>
      ) : (
        <ul className="unit-list">
          {sheets.map((sheet, i) => {
            const done = sheet.nodes.filter((n) => n.state === 'done').length;
            const all = sheet.nodes.length;
            const no = sheetNo(sheets, i);
            const shown = open === sheet.unitId;
            const bodyId = `${uid}-u${String(sheet.unitId)}`;
            const fill = all === 0 ? 0 : Math.round((100 * done) / all);
            return (
              <li key={sheet.unitId} className="unit" data-state={sheet.state}>
                <button
                  type="button"
                  className="unit-h"
                  aria-expanded={shown}
                  aria-controls={bodyId}
                  onClick={() => setOpen(shown ? null : sheet.unitId)}
                >
                  <span className="unit-no">
                    {sheet.zero ? t('home.zeroChapterSig') : t('home.sheetSig', { n: String(no) })}
                  </span>
                  <span className="unit-name">{sheet.name}</span>
                  <span className="unit-count">{done} / {all}</span>
                  <span
                    className="unit-bar"
                    aria-hidden="true"
                    style={{ '--fill': `${String(fill)}%` } as React.CSSProperties}
                  />
                </button>

                <div id={bodyId} className="unit-body" hidden={!shown}>
                  {/* 0장은 리포의 기능이 아니라 **끝이 있는 프롤로그**다 — 그 약속을
                      장수로 적는 것이 D136 이 정한 것이다. */}
                  {sheet.zero ? (
                    <>
                      <p className="unit-lead">
                        {sheet.state === 'done'
                          ? t('home.zeroChapterDone')
                          : t('home.zeroChapterLead', { n: String(all) })}
                      </p>
                      <p className="unit-meta">{t('home.zeroChapterMeta', { n: String(all) })}</p>
                    </>
                  ) : (
                    <p className="unit-meta">
                      {t('home.sheetMeta', {
                        where: sheet.rootPath ?? t('home.sheetNoPath'),
                        files: String(sheet.files),
                        concepts: String(all),
                      })}
                    </p>
                  )}

                  <ul className="concepts">
                    {sheet.nodes.map((node) => (
                      <li key={node.conceptId} className="cpt" data-state={node.state}>
                        <span className="cpt-name">
                          {node.nameKo}
                          {tokenOf(node) === null
                            ? null
                            : <code className="cpt-tok">{tokenOf(node)}</code>}
                        </span>
                        <span className="cpt-track">{trackName(node.track)}</span>
                        <span className="cpt-layer">{layerLabel(node.shownLayer)}</span>
                        <span className="cpt-state">
                          {node.state === 'done' && node.dueAt !== null
                            ? dueLabel(node.dueAt, now ?? Date.now())
                            : t(STATE_KEY[node.state])}
                        </span>
                        {onPick !== undefined && node.state !== 'locked' ? (
                          <button
                            type="button"
                            className="cpt-go"
                            onClick={() => onPick(node.conceptId)}
                          >
                            {t('home.detailGo')}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {onCourse === undefined ? null : (
                    <button
                      type="button"
                      className="unit-course"
                      onClick={() => onCourse(sheet.unitId)}
                    >
                      {t('home.sheetCourse')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
