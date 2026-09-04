/**
 * T2 교정지 한 장 (05 §5·§7 · 04 §7~§8). 두 화면이 한 판 안에 있다:
 * **고르기 → 채점 결과**. 목업 `t2.js` 의 `render`·`resultHTML` 이다.
 *
 * 고르기 화면은 **종마다 다르다**(04 §8.3 · D107) — 파일을 고르는 두 종(책임 배치·영향
 * 반경)은 지도에서 상자를 고르고, 흐름 추적은 카드 덱의 순서를 세우고, 의존성 방향은
 * 5문항 4지선다를 푼다. 지도와 결과 화면은 **네 종이 같이 쓴다**: 04 §8.3 의 힌트가
 * 흐름 추적·의존성 방향에서도 「화살표가 이어지는지 보세요」·「두 상자에 마우스를
 * 올리면」이라 지도가 문제의 일부다.
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
import { t, type MessageKey } from '@chickadee/i18n';

import { Acts } from '../../components/plate/Acts.js';
import { Ask } from '../../components/plate/Ask.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { CommitSource } from '../../components/t2/CommitSource.js';
import { DependencyMap, type MapEdge } from '../../components/t2/DependencyMap.js';
import { DirectionQuiz, type DirectionPick } from '../../components/t2/DirectionQuiz.js';
import { FlowDeck } from '../../components/t2/FlowDeck.js';
import { HintBox } from '../../components/t2/HintBox.js';
import { MapStatus } from '../../components/t2/MapStatus.js';
import { PickedChips } from '../../components/t2/PickedChips.js';
import { ResultGroups, type ResultRow } from '../../components/t2/ResultGroups.js';
import { Verdict } from '../../components/t2/Verdict.js';
import type { Plate } from '../../data/session.js';
import type { PlateResult } from '../../store.js';
import {
  appealDone, appealIdle, appealNote, directionDone, flowNote, hintNote,
  kindName, kindSub, mapHint, directionLeft, verdictTitle,
} from './t2Copy.js';

/** 힌트는 3단까지다 (04 §8.1 · 목업). */
export const MAX_HINTS = 3;

const ROLE_KEY = {
  review: 'session.roleReview', new: 'session.roleNew', retry: 'session.roleRetry',
  prereq: 'session.rolePrereq', manual: 'session.roleManual', gap: 'session.roleGap',
} as const satisfies Record<string, MessageKey>;

/** 판 머리의 역할 이름. 세 판이 같은 표를 쓴다. */
const roleName = (role: keyof typeof ROLE_KEY): string => t(ROLE_KEY[role]);

/**
 * 흐름 추적·의존성 방향에서 지도는 **읽는 자리**다 (04 §8.3). 답은 덱과 문항에만 들어가므로
 * 상자를 골라도 아무 일이 없다 — 두 곳에서 답을 받으면 어느 쪽이 답인지가 흐려진다.
 * `DependencyMap` 이 `memo` 라 참조가 안 바뀌게 모듈 상수로 둔다.
 */
const NO_PICK: ReadonlySet<string> = new Set();
const noop = (): void => undefined;

/**
 * 동작 줄 가운데 안내. 종마다 「지금 무엇을 하면 되는가」가 다르다 — 힌트가 감점이 아니라는
 * 말은 파일을 고르는 두 종에서만 그 자리를 차지할 이유가 있고(채점 뒤 지도가 깜빡인다),
 * 나머지 둘은 자물쇠가 왜 걸렸는지·덱을 다 쓸 필요가 없는지를 먼저 말해야 한다.
 */
function pickHint(kind: string, left: number): string {
  if (kind === 'flow') return flowNote();
  if (kind === 'direction') return left > 0 ? directionLeft(left) : directionDone();
  return hintNote();
}

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
  /** 흐름 추적 — 세운 경로. 그대로 `gradeFlow` 의 `ordered` 다 (04 §8.3). */
  ordered?: readonly string[] | undefined;
  onOrder?: ((next: readonly string[]) => void) | undefined;
  /** 의존성 방향 — 문항별 답. 안 푼 문항은 구멍이다 (`gradeDirection` 이 그렇게 읽는다). */
  picks?: readonly (DirectionPick | undefined)[] | undefined;
  onPick?: ((index: number, choice: DirectionPick) => void) | undefined;
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

  /** 파일을 고르는 두 종인가 (04 §8.2 가 한 식으로 묶는 그 둘). */
  const picking = payload !== null && (payload.kind === 'placement' || payload.kind === 'radius');
  const ordered = props.ordered ?? [];
  const picks = props.picks ?? [];
  const pairs = payload?.pairs ?? [];
  /** 아직 안 푼 문항 — 의존성 방향의 채점 잠금이 이 수를 본다. */
  const left = pairs.filter((_, i) => picks[i] === undefined).length;

  /**
   * 채점을 걸 수 있는가. 종마다 「무엇이 답인가」가 다르므로 자물쇠도 다르다.
   *
   * 의존성 방향만 **다 풀어야** 열린다: 안 푼 문항은 `gradeDirection` 이 조용히 오답으로
   * 세므로(`pick === undefined` → missed) 하나 빠뜨린 채 채점하면 점수만 깎이고 이유가
   * 화면에 남지 않는다. 남은 문항 수는 동작 줄에 적는다.
   */
  const canGrade = payload === null
    ? false
    : picking
      ? props.selected.length > 0
      : payload.kind === 'flow'
        ? ordered.length > 0
        : pairs.length > 0 && left === 0;

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
      // 답을 받는 조작 자리에 포커스가 있으면 Enter·Space 는 그 자리의 것이다 (05 §5·§7).
      // 지도 노드(고르기) · 4지 보기(의존성 방향) · 덱 버튼(흐름 추적) 셋 다 같은 이유다 —
      // 판이 Enter 를 먹으면 답을 넣기도 전에 채점이 걸린다.
      const onNode = target?.closest('.map .nd, .choices, .fdeck') != null;

      if (props.view === 'pick') {
        if (e.code === 'Enter' && !onNode && canGrade) {
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
  }, [props, canGrade]);

  if (payload === null) return null;

  const edges = payload.edges as readonly MapEdge[];
  const ly = props.result === null ? [plate.layer, plate.layer] as const : props.result.layer;
  /**
   * 점수의 분모. 네 종이 다르므로(파일 수 · 경로 길이 · 문항 수) `payload.core` 가 아니라
   * 채점 결과에서 센다 — 파일을 고르는 두 종에서는 `found ∪ missed = core` 라 값이 같고,
   * 흐름 추적·의존성 방향은 `core` 가 비어 있어 0 이 나오던 자리다 (04 §8.2·§8.3).
   */
  const coreN = graded === null
    ? Object.keys(payload.core).length
    : graded.found.length + graded.missed.length;
  const label = t('map.plateLabel', { name: plate.token ?? plate.nameKo });

  return (
    <ProofSheet
      no={t('session.plateNo', { n: String(props.no) })}
      track="t2"
      concept={plate.nameKo}
      code={plate.token ?? ''}
      kind={t('session.kindAndRole', {
        kind: kindName(payload.kind),
        role: roleName(plate.role),
      })}
      source={t('map.sourceT2', {
        sub: kindSub(payload.kind),
        files: String(payload.files.length),
        edges: String(edges.length),
        bands: String(payload.bands.length),
      })}
      ly={ly}
      width="xwide"
    >
      <Ask q={payload.q} hint={`${payload.hint} ${mapHint()}`} />

      <DependencyMap
        bands={payload.bands}
        files={payload.files}
        edges={edges}
        selected={picking ? selected : NO_PICK}
        onToggle={picking ? props.onToggle : noop}
        graded={nodeStates}
        hints={props.hints}
        onHover={setHovered}
        label={label}
      />
      <MapStatus edges={edges} hovered={hovered} graded={graded !== null} />

      {props.view === 'pick' ? (
        <>
          {picking ? <PickedChips picked={props.selected} /> : null}
          {payload.kind === 'flow' ? (
            <FlowDeck
              deck={payload.flow?.deck ?? []}
              ordered={ordered}
              {...(props.onOrder === undefined ? {} : { onOrder: props.onOrder })}
            />
          ) : null}
          {payload.kind === 'direction' ? (
            <DirectionQuiz
              pairs={pairs}
              picks={picks}
              {...(props.onPick === undefined ? {} : { onPick: props.onPick })}
            />
          ) : null}
          {props.hints > 0 ? <HintBox hints={payload.hints.slice(0, props.hints)} /> : null}
          <div className="slot" style={{ minHeight: 0 }} />
          <Acts
            left={(
              <FlatButton
                variant="dunno"
                disabled={props.hints >= MAX_HINTS}
                onClick={props.onHint}
              >
                {t('map.dunnoHint', {
                  n: String(Math.min(MAX_HINTS, props.hints + 1)),
                  max: String(MAX_HINTS),
                })}{' '}
                <Kbd keys="H" />
              </FlatButton>
            )}
            hint={pickHint(payload.kind, left)}
            right={(
              <PressButton tone="blue" disabled={!canGrade} onClick={props.onGrade}>
                {t('session.grade')} <Kbd keys="Enter" />
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
                {props.appealed.length > 0 ? appealDone() : appealIdle()}
              </FlatButton>
            )}
            hint={props.appealed.length > 0 ? appealNote() : ''}
            right={(
              <PressButton tone="blue" onClick={props.onFinish}>
                {t('session.next')} <Kbd keys="Space" />
              </PressButton>
            )}
          />
        </>
      ) : null}
    </ProofSheet>
  );
}
