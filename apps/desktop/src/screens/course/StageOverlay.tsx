/**
 * 단 오버레이 — 챕터 하나의 단 하나를 전체화면으로 (D171 ④). 세션 오버레이의 껍데기
 * (`SessionOverlay`·`JobBand`)를 그대로 쓴다: Esc 네 겹 · 포커스 트랩 · 낭독 지점.
 *
 * **상태는 여기 있고 규칙은 없다.** 판정은 `gradeStage`, 원장은 `recordStageResult`
 * (`data.ts` 의 `finishStage`·`finishRecheck`), 막힘의 처방은 `stuckAction` 이다.
 *
 * 진행 중인 단의 답은 저장하지 않는다 — 나가면 그 단을 처음부터. 판정된 단은 원장에 있다.
 * 세션의 「이어 찍기」와 다른 선택인데, 단 하나는 판 3~5장·몇 분이라 잃는 것이 작고
 * 저장 지점을 늘리면 `stage_log` 의 「판정한 순간」이라는 뜻이 흐려진다.
 */
import { stuckAction, type Advance, type RecheckGrade } from '@chickadee/concepts';
import {
  buildHandoffPrompt, gradeStage, mergeRun, needsRun, type StageAnswer, type StageVerdict,
} from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import { ipc } from '@chickadee/ipc-client';
import { labelFor } from '@chickadee/scheduler';
import type { ConceptId, Layer, StageNo } from '@chickadee/store-sql';
import { announce, FlatButton } from '@chickadee/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { JobBand } from '../../components/session/JobBand.js';
import { SessionOverlay } from '../../components/session/SessionOverlay.js';
import type { QueueItem } from '../../components/shell/TimeQueue.js';
import { loadMastery } from '../../data/session.js';
import { report } from '../../flow.js';
import { useUi } from '../../store.js';
import { CallerPlate } from './CallerPlate.js';
import { ChoicePlate } from './ChoicePlate.js';
import {
  conceptName, conceptOneLiner, dictNow, finishRecheck, finishStage, foldChapter, openCourseSession,
  queueConceptPlate, runStageAnswer, type JudgeDeps,
} from './data.js';
import { HopPlate } from './HopPlate.js';
import { OrderPlate } from './OrderPlate.js';
import { ReimplPlate } from './ReimplPlate.js';
import { RepairPlate } from './RepairPlate.js';
import { TraceTablePlate } from './TraceTablePlate.js';
import {
  foldFlow, plannedMin, queueKindOf, stageKey, tally, typeKey,
  type RunPhase, type RunSpec, type StageCardView,
} from './run.js';
import { StageDone } from './StageDone.js';
import { StuckPanel, type StuckView } from './StuckPanel.js';
import { useCourse } from './store.js';

export interface StageOverlayProps {
  repoId: number;
  rootPath: string;
  repoName: string;
  spec: RunSpec;
  dayKey: string;
  tz: string;
  rolloverHour: number;
  theme: 'light' | 'dark';
  /** 다음 단에 판이 있나 — 판정 카드의 「다음 단으로」가 이것을 본다. */
  hasNext: (stage: StageNo) => boolean;
  onNextStage: (stage: StageNo) => void;
  onExit: () => void;
}

interface Done {
  advance: Advance;
  grade: RecheckGrade | null;
  asked: number;
  correct: number;
}

const toQueueItem = (c: StageCardView): QueueItem => ({
  kind: queueKindOf(c.type), label: t(typeKey(c.type)), mins: c.estMin,
});

/** 4단 프롬프트 — 앞뒤 4줄(`promptLines`)과 물음. 파일은 이름만 (정본 §3-1 ④). */
function repairPrompt(card: StageCardView): string {
  const p = card.payload;
  if (p.track !== 't3' || p.kind !== 'repair') return '';
  const file = p.file.slice(p.file.lastIndexOf('/') + 1);
  return [
    t('grading.handoffOriginal', { file, from: String(Math.max(1, p.from - 4)) }),
    ...p.promptLines,
    '',
    p.q.replace(/<[^>]+>/g, ''),
    t('chapter.repairGoal', { goal: p.goal }),
    t('stage.handoffAsk'),
  ].join('\n');
}

export function StageOverlay(props: StageOverlayProps): React.JSX.Element {
  const { spec, onExit } = props;
  const dict = useMemo(() => dictNow(), []);
  const [cards, setCards] = useState<StageCardView[]>(spec.cards);
  const [pos, setPos] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<number, StageVerdict>>({});
  const [folded, setFolded] = useState<Record<number, true>>({});
  const [dunno, setDunno] = useState(0);
  const [stuck, setStuck] = useState<StuckView | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [layers, setLayers] = useState<ReadonlyMap<ConceptId, Layer>>(new Map());
  const [phases, setPhases] = useState<Record<number, RunPhase>>({});
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(Date.now());
  const cardStartRef = useRef(Date.now());
  const finishingRef = useRef(false);

  const card = cards[pos] ?? null;
  const verdict = verdicts[pos] ?? null;

  // 판이 바뀌면 처음부터. `spec` 참조가 바뀌면 오버레이가 새로 선다.
  useEffect(() => {
    setCards(spec.cards);
    setPos(0);
    setVerdicts({});
    setFolded({});
    setDunno(0);
    setStuck(null);
    setDone(null);
    setPhases({});
    startedRef.current = Date.now();
    cardStartRef.current = Date.now();
    setElapsed(0);
  }, [spec]);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - cardStartRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    cardStartRef.current = Date.now();
    setElapsed(0);
    setStuck(null);
  }, [pos]);

  // 판 머리 레일의 겹 — 오르내리지 않고 보이기만 한다 (D162 ④).
  useEffect(() => {
    let alive = true;
    const ids = [...new Set(spec.cards.map((c) => c.conceptId))];
    if (ids.length === 0) return undefined;
    void loadMastery(ids).then((m) => {
      if (!alive) return;
      setLayers(new Map([...m].map(([k, v]) => [k, v.layer])));
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [spec]);

  const live = verdict === null
    ? ''
    : announce(
      verdict.ok ? t('chapter.liveRight') : t('chapter.liveWrong'),
      verdict.pct === null ? null : t('chapter.pctOf', { n: String(verdict.pct) }),
      t('chapter.liveNext'),
    );

  const deps = useCallback(async (): Promise<JudgeDeps> => {
    const now = Date.now();
    const s = useCourse.getState();
    let sessionId = s.sessionId;
    if (sessionId === null || s.sessionDay !== props.dayKey) {
      sessionId = await openCourseSession(props.repoId, props.dayKey, now);
      useCourse.getState().setSession(sessionId, props.dayKey);
    }
    return { sessionId, dayKey: props.dayKey, now };
  }, [props.repoId, props.dayKey]);

  /**
   * 채점 — 1~3단은 여기서 끝나고, **4·5단은 실행이 최종 판정을 만든다** (D180). 정적 판정을
   * 먼저 세워 판정란을 채우고(빈 화면으로 기다리지 않는다), 러너가 끝나면 `mergeRun` 이
   * 그 위에 얹는다. 러너가 없으면 `no-runner` 로 돌아오고 그 판은 게이트에서 빠진다.
   */
  const grade = useCallback((answer: StageAnswer) => {
    if (card === null || verdict !== null) return;
    const at = pos;
    const v = gradeStage(card.payload, answer);
    setVerdicts((prev) => ({ ...prev, [at]: v }));
    if (!needsRun(card.payload)) return;
    setPhases((prev) => ({ ...prev, [at]: { kind: 'running' } }));
    void runStageAnswer({ repoId: props.repoId, rootPath: props.rootPath, payload: card.payload, answer })
      .then((run) => {
        if (run === null) {
          setPhases((prev) => ({ ...prev, [at]: { kind: 'off' } }));
          return;
        }
        setPhases((prev) => ({ ...prev, [at]: { kind: 'done', run } }));
        setVerdicts((prev) => {
          const base = prev[at];
          return base === undefined ? prev : { ...prev, [at]: mergeRun(base, run) };
        });
      })
      .catch((e: unknown) => {
        report(e, '단 실행');
        setPhases((prev) => ({ ...prev, [at]: { kind: 'off' } }));
      });
  }, [card, verdict, pos, props.repoId, props.rootPath]);

  const finish = useCallback(async (finalVerdicts: Record<number, StageVerdict>) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      const d = await deps();
      const durationMs = Date.now() - startedRef.current;
      if (spec.kind === 'recheck') {
        const traceOk = finalVerdicts[0]?.ok === true;
        const predictOk = finalVerdicts[1]?.ok === true;
        const r = await finishRecheck(d, spec.row, { hasRepair: spec.hasRepair, hasRun: spec.hasRun }, { traceOk, predictOk, durationMs });
        setDone({ advance: r.advance, grade: r.grade, asked: 2, correct: (traceOk ? 1 : 0) + (predictOk ? 1 : 0) });
        return;
      }
      const tl = tally(cards, finalVerdicts);
      const advance = await finishStage(d, spec.row, { hasRepair: spec.hasRepair, hasRun: spec.hasRun }, {
        unitId: spec.unitId, stage: spec.stage, asked: tl.asked, correct: tl.correct, durationMs,
        detail: { cards: cards.map((c, i) => ({ id: c.id, type: c.type, ok: finalVerdicts[i]?.ok ?? null, pct: finalVerdicts[i]?.pct ?? null })) },
      });
      setDone({ advance, grade: null, asked: tl.asked, correct: tl.correct });
    } catch (e) {
      report(e, '단 판정');
      onExit();
    } finally {
      finishingRef.current = false;
    }
  }, [deps, spec, cards, onExit]);

  const next = useCallback(() => {
    if (verdict === null) return;
    // 실행 중이면 기다린다 — 아직 최종 판정이 아니다.
    if (phases[pos]?.kind === 'running') return;
    if (pos + 1 < cards.length) {
      setPos(pos + 1);
      return;
    }
    void finish(verdicts);
  }, [verdict, pos, cards.length, finish, verdicts, phases]);

  const pressDunno = useCallback(() => {
    if (card === null || done !== null) return;
    if (stuck !== null) {
      setStuck(null);
      return;
    }
    const n = dunno + 1;
    setDunno(n);
    const action = stuckAction({ stage: spec.stage, dunnoCount: n });
    switch (action.kind) {
      case 'fold': {
        if (card.payload.track === 't2' && card.payload.flow !== undefined) {
          const foldedPayload = foldFlow(card.payload);
          setCards((prev) => prev.map((c, i) => (i === pos ? { ...c, payload: foldedPayload } : c)));
          setFolded((prev) => ({ ...prev, [pos]: true }));
        }
        setStuck({ kind: 'fold' });
        return;
      }
      case 'concept-front':
      case 'prereq': {
        setStuck({
          kind: 'concept-front', conceptId: card.conceptId,
          name: conceptName(dict, card.conceptId), line: conceptOneLiner(dict, card.conceptId), queued: false,
        });
        return;
      }
      case 'prompt': {
        const p = card.payload;
        const prompt = p.track === 't3' && p.kind === 'reimpl' ? buildHandoffPrompt(p, []) : repairPrompt(card);
        setStuck({ kind: 'prompt', prompt, copied: false });
        return;
      }
      default: {
        void foldChapter(spec.unitId, props.dayKey, Date.now()).catch(() => undefined);
        setStuck({ kind: 'defer' });
      }
    }
  }, [card, done, stuck, dunno, spec, pos, dict, props.dayKey]);

  const queueConcept = useCallback(() => {
    if (stuck === null || stuck.kind !== 'concept-front' || stuck.queued) return;
    const view = stuck;
    void queueConceptPlate(props.repoId, props.rootPath, view.conceptId as ConceptId).then((ok) => {
      if (!ok) return;
      setStuck({ ...view, queued: true });
      useUi.getState().say(t('chapter.stuckConceptQueued', { name: view.name }));
    });
  }, [stuck, props.repoId, props.rootPath]);

  const copyPrompt = useCallback(() => {
    if (stuck === null || stuck.kind !== 'prompt') return;
    const view = stuck;
    void ipc.clip.write(view.prompt)
      .then(() => setStuck({ ...view, copied: true }))
      .catch(() => useUi.getState().say(t('session.copyFailed')));
  }, [stuck]);

  const runLabel = t('chapter.runNo', { name: spec.unitName, stage: spec.kind === 'recheck' ? t('chapter.qRecheck') : t(stageKey(spec.stage)) });
  const band = (
    <JobBand
      runNo={runLabel}
      repo={props.repoName}
      queue={cards.map(toQueueItem)}
      pos={done !== null ? cards.length : pos}
      elapsed={elapsed}
      totalElapsed={Math.floor((Date.now() - startedRef.current) / 1000)}
    >
      <FlatButton ghost onClick={onExit}>{t('chapter.leave')}</FlatButton>
    </JobBand>
  );

  const plateProps = card === null ? null : {
    card, no: pos + 1, unitName: spec.unitName,
    conceptName: conceptName(dict, card.conceptId),
    layer: layers.get(card.conceptId) ?? 0,
    verdict, stuckOpen: stuck !== null,
    onGrade: grade, onNext: next, onDunno: pressDunno,
    ...(stuck === null ? {} : {
      after: (
        <StuckPanel
          view={stuck}
          onQueueConcept={queueConcept}
          onCopyPrompt={copyPrompt}
          onClose={() => setStuck(null)}
          onLeave={onExit}
        />
      ),
    }),
  };

  const nextDue = done?.advance.next.dueAt ?? null;
  /**
   * **정직성** (D186 ④). 2단인데 값 추적 판이 없으면 그 사실을 판 자리에서 말한다 — 판을
   * 숨기면 학습자는 앱이 그것을 재고 있다고 믿는다. 그 챕터는 경로 판만으로 이 단을 통과한다.
   */
  const noTrace = spec.kind === 'first' && spec.stage === 2
    && !cards.some((c) => c.type === 'trace-table');

  return (
    <div className="course-run">
      <SessionOverlay
        band={band}
        ladderOpen={stuck !== null}
        onCloseLadder={() => setStuck(null)}
        live={live}
        onExit={onExit}
      >
        {noTrace ? <p className="note cc-honest">{t('chapter.traceMissing')}</p> : null}
        {done !== null ? (
          <StageDone
            stage={spec.stage}
            kind={spec.kind}
            asked={done.asked}
            correct={done.correct}
            advance={done.advance}
            grade={done.grade}
            nextDue={nextDue === null ? null : labelFor(nextDue, Date.now(), props.tz, props.rolloverHour)}
            canNext={spec.kind === 'first' && done.advance.passed && spec.stage < 5 && props.hasNext((spec.stage + 1) as StageNo)}
            onNext={() => props.onNextStage((spec.stage + 1) as StageNo)}
            onToc={onExit}
          />
        ) : plateProps === null || card === null ? (
          <p className="note cc-empty">{t('chapter.noCards')}</p>
        ) : card.type === 'hop' ? (
          <HopPlate {...plateProps} folded={folded[pos] === true} />
        ) : card.type === 'caller' ? (
          <CallerPlate {...plateProps} />
        ) : card.type === 'trace-table' ? (
          <TraceTablePlate {...plateProps} />
        ) : card.type === 'order' ? (
          <OrderPlate {...plateProps} />
        ) : card.stageNo === 4 ? (
          <RepairPlate {...plateProps} phase={phases[pos] ?? { kind: 'off' }} />
        ) : card.stageNo === 5 ? (
          <ReimplPlate {...plateProps} theme={props.theme} phase={phases[pos] ?? { kind: 'off' }} />
        ) : (
          <ChoicePlate {...plateProps} />
        )}
      </SessionOverlay>
      {plannedMin(cards) > 0 ? null : null}
    </div>
  );
}
