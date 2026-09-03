/**
 * T2 교정지 한 장 (05 §5·§7 · 04 §7~§8). 두 화면이 한 판 안에 있다:
 * **고르기 → 채점 결과**. 목업 `t2.js` 의 `render`·`resultHTML` 이다.
 *
 * T1 의 왜 게이트에 해당하는 자리가 T2 에는 없다 — 04 §6 은 필사 뒤의 걸음이고, T2 의
 * 같은 자리는 결과 화면의 「이것도 맞다」(04 §8.4)다.
 *
 * 규칙은 하나도 여기 없다: 판정은 `session-flow.gradeT2Plate`, 원장은 `finishT2Plate` 가
 * 한다. 이 파일이 하는 일은 두 화면을 잇고 키를 받는 것뿐이다.
 */
import { FlatButton, Kbd, PressButton } from '@chickadee/ui';
import type { T2Result } from '@chickadee/grading';
import { useEffect, useMemo, useState } from 'react';

import { Acts } from '../../components/plate/Acts.js';
import { Ask } from '../../components/plate/Ask.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { CommitSource } from '../../components/t2/CommitSource.js';
import { DependencyMap, type MapEdge } from '../../components/t2/DependencyMap.js';
import { HintBox } from '../../components/t2/HintBox.js';
import { MapStatus } from '../../components/t2/MapStatus.js';
import { PickedChips } from '../../components/t2/PickedChips.js';
import { ResultGroups, type ResultRow } from '../../components/t2/ResultGroups.js';
import { Verdict } from '../../components/t2/Verdict.js';
import type { Plate } from '../../data/session.js';
import type { PlateResult } from '../../store.js';
import {
  APPEAL_DONE, APPEAL_IDLE, APPEAL_NOTE, HINT_NOTE, KIND_NAME, KIND_SUB, MAP_HINT, verdictTitle,
} from './t2Copy.js';

/** 힌트는 3단까지다 (04 §8.1 · 목업). */
export const MAX_HINTS = 3;

const ROLE_NAME = {
  review: '복습', new: '새 판', retry: '다시 찍기', prereq: '아래층',
  manual: '이 판 찍기', gap: '판 만들기',
} as const;

/** 지금 보고 있는 화면. 한 판 안에서만 움직인다. */
export type T2View = 'pick' | 'result';

export interface T2PlateProps {
  plate: Plate;
  no: number;
  result: PlateResult | null;
  /** 채점 결과. 아직 채점 전이면 `null`. */
  graded: T2Result | null;
  view: T2View;
  onView: (view: T2View) => void;
  selected: readonly string[];
  onToggle: (path: string) => void;
  hints: number;
  onHint: () => void;
  onGrade: () => void;
  /** 「이것도 맞다」로 접수한 파일. 점수는 변하지 않는다 (04 §8.4). */
  appealed: readonly string[];
  onAppeal: (path: string) => void;
  onFinish: () => void;
}

export function T2Plate(props: T2PlateProps): React.JSX.Element | null {
  const { plate, graded } = props;
  const payload = plate.payload.track === 't2' ? plate.payload : null;
  const [hovered, setHovered] = useState<string | null>(null);

  const selected = useMemo(() => new Set(props.selected), [props.selected]);

  /** 채점 뒤 지도의 노드 상태 (목업 `stateOf`). 04 §8.2 의 네 티어 그대로다. */
  const nodeStates = useMemo(() => {
    if (graded === null) return undefined;
    const out: Record<string, 'ok' | 'missed' | 'wrong' | 'sec'> = {};
    for (const path of graded.found) out[path] = 'ok';
    for (const path of graded.missed) out[path] = 'missed';
    for (const path of graded.wrong) out[path] = 'wrong';
    // sec 는 골랐든 아니든 전부 표시한다 — 「감점 없음」이 보여야 그 말이 성립한다.
    for (const path of Object.keys(payload?.sec ?? {})) out[path] ??= 'sec';
    return out;
  }, [graded, payload]);

  const rows: ResultRow[] = useMemo(
    () => (graded === null ? [] : graded.rows.map((row) => ({
      path: row.path, tier: row.tier, stat: row.stat, note: row.note,
    }))),
    [graded],
  );

  // 05 §7 — 고르기에서 `Enter` 는 채점, `H` 는 힌트. 결과에서 `Enter`·`Space` 는 다음 판.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
      // 판을 걸면 포커스가 `article.ps` 에 있고, 아무것도 잡지 않았으면 `e.target` 이
      // `document` 다 — `Element` 가 아니라 `closest` 가 없다 (M3 지뢰).
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('textarea, input') != null) return;
      // 지도 노드가 포커스를 갖고 있으면 Enter·Space 는 그 노드의 것이다 (05 §5).
      const onNode = target?.closest('.map .nd') != null;

      if (props.view === 'pick') {
        if (e.code === 'Enter' && !onNode && props.selected.length > 0) {
          e.preventDefault();
          props.onGrade();
          return;
        }
        if ((e.key === 'h' || e.key === 'H') && props.hints < MAX_HINTS) {
          e.preventDefault();
          props.onHint();
        }
        return;
      }
      if ((e.code === 'Enter' || e.code === 'Space') && !onNode) {
        e.preventDefault();
        props.onFinish();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [props]);

  if (payload === null) return null;

  const edges = payload.edges as readonly MapEdge[];
  const ly = props.result === null ? [plate.layer, plate.layer] as const : props.result.layer;
  const coreN = Object.keys(payload.core).length;
  const label = `${plate.token ?? plate.nameKo} 의존 지도`;

  return (
    <ProofSheet
      no={`${props.no}판`}
      track="t2"
      concept={plate.nameKo}
      code={plate.token ?? ''}
      kind={`${KIND_NAME[payload.kind]} · ${ROLE_NAME[plate.role]}`}
      source={`${KIND_SUB[payload.kind]} · 파일 ${payload.files.length} · 연결 ${edges.length} · 층 ${payload.bands.length} · 화살표는 언제나 <b>가져다 쓴다(import)</b> 방향`}
      ly={ly}
      width="xwide"
    >
      <Ask q={payload.q} hint={`${payload.hint} ${MAP_HINT}`} />

      <DependencyMap
        bands={payload.bands}
        files={payload.files}
        edges={edges}
        selected={selected}
        onToggle={props.onToggle}
        graded={nodeStates}
        hints={props.hints}
        onHover={setHovered}
        label={label}
      />
      <MapStatus edges={edges} hovered={hovered} graded={graded !== null} />

      {props.view === 'pick' ? (
        <>
          <PickedChips picked={props.selected} />
          {props.hints > 0 ? <HintBox hints={payload.hints.slice(0, props.hints)} /> : null}
          <div className="slot" style={{ minHeight: 0 }} />
          <Acts
            left={(
              <FlatButton
                variant="dunno"
                disabled={props.hints >= MAX_HINTS}
                onClick={props.onHint}
              >
                모르겠어요 · 힌트 {Math.min(MAX_HINTS, props.hints + 1)}/{MAX_HINTS} <Kbd keys="H" />
              </FlatButton>
            )}
            hint={HINT_NOTE}
            right={(
              <PressButton tone="blue" disabled={props.selected.length === 0} onClick={props.onGrade}>
                채점하기 <Kbd keys="Enter" />
              </PressButton>
            )}
          />
        </>
      ) : null}

      {props.view === 'result' && graded !== null ? (
        <>
          <Verdict
            pct={graded.pct}
            core={coreN}
            found={graded.found.length}
            missed={graded.missed.length}
            wrong={graded.wrong.length}
            bonus={graded.bonus.length}
          />
          <h4 className="vh">{verdictTitle(graded)}</h4>
          {graded.capped === null ? null : <p className="note capped">{graded.capped}</p>}
          <ResultGroups rows={rows} />
          <CommitSource commit={payload.commit} />
          <div className="slot" style={{ minHeight: 0 }} />
          <Acts
            left={(
              <FlatButton
                ghost
                on={props.appealed.length > 0}
                aria-pressed={props.appealed.length > 0}
                disabled={graded.wrong.length === 0}
                onClick={() => {
                  // 「이것도 맞다」는 **잘못 골랐다고 판정된 것 전부**에 붙는다 — 파일마다
                  // 한 행이 되고(04 §8.4) 점수는 변하지 않는다.
                  for (const path of graded.wrong) props.onAppeal(path);
                }}
              >
                {props.appealed.length > 0 ? APPEAL_DONE : APPEAL_IDLE}
              </FlatButton>
            )}
            hint={props.appealed.length > 0 ? APPEAL_NOTE : ''}
            right={(
              <PressButton tone="blue" onClick={props.onFinish}>
                다음 <Kbd keys="Space" />
              </PressButton>
            )}
          />
        </>
      ) : null}
    </ProofSheet>
  );
}
