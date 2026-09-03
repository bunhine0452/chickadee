/**
 * 교정쇄 화면 (05 §2.3 · §3 · §5). 오버레이 · 작업 띠 · 지금 판 · 요약을 잇는다.
 *
 * **상태는 여기 있고 규칙은 없다.** 무엇을 쓸지는 `session-flow` 가, 무엇이 맞는지는
 * `@chickadee/grading` 이, 겹이 얼마나 오를지는 `@chickadee/scheduler` 가 정한다.
 */
import { FlatButton } from '@chickadee/ui';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { JobBand } from '../../components/session/JobBand.js';
import { SessionOverlay } from '../../components/session/SessionOverlay.js';
import { LiferVeil } from '../../components/session/LiferVeil.js';
import { Summary } from '../../components/session/Summary.js';
import type { RungNo } from '../../components/session/ReprintLadder.js';
import type { QueueItem } from '../../components/shell/TimeQueue.js';
import { closeMark, markLiferOpen } from '../../devtools/audit.js';
import {
  buildProt, evalLine, type Question, type T1Result, type T2Result, type Tick,
} from '@chickadee/grading';
import { baseName, loadLadder, type LadderData } from '../../data/ladder.js';
import type { Plate } from '../../data/session.js';
import type { Track } from '@chickadee/store-sql';
import { loadSettings } from '../../data/settings.js';
import { loadSummary, markLifersShown, type SummaryData } from '../../data/summary.js';
import {
  answerPlate, backFromPrereq, completeSession, finishT1Plate, finishT2Plate, gradeT1Plate,
  gradeT2Plate, jumpPrereq, openRung,
  pauseSession, pressDunno, returnToParent, savePlate,
} from '../../session-flow.js';
import { currentPlate, useUi } from '../../store.js';
import { T0Plate } from './T0Plate.js';
import { T1Plate, type T1View } from './T1Plate.js';
import { MAX_HINTS, T2Plate, type T2View } from './T2Plate.js';
import { liveAfter } from './t2Copy.js';
import { useSessionClock } from './useSessionClock.js';
import './SessionScreen.css';

const TRACK_LABEL = { t0: 'T0', t1: 'T1', t2: 'T2', t3: 'T3' } as const;

/** 04 §4.6 — 6줄 미만은 한 번 경고하고 두 번째 누름에 채점한다. */
const MIN_GRADE_LINES = 6;

/** 경로 확장자 → tree-sitter 문법 키. 거터의 PROT 집합이 이것으로 내장 표를 고른다. */
function grammarKeyOf(path: string): string {
  const ext = path.slice(path.lastIndexOf('.'));
  if (ext === '.tsx' || ext === '.jsx') return 'tsx';
  if (ext === '.py') return 'python';
  if (ext === '.go') return 'go';
  if (ext === '.rs') return 'rust';
  return 'typescript';
}

/**
 * 화면의 `Track`(`packages/ui`)은 t0~t2 뿐이고 스키마의 `Track`(02 §8.2)은 t3 를 포함한다 —
 * T3 은 「스키마 자리만」이라 그릴 것이 없다(정본 §2). 요약에 t3 행이 올 일은 없지만
 * 타입은 그것을 모르므로 여기서 한 번 좁힌다.
 */
const asViewTrack = (t: Track): 't0' | 't1' | 't2' => (t === 't3' ? 't0' : t);

/** LIFER 베일에 넘길 것. 시각은 부르는 쪽이 굳힌다 — 컴포넌트는 시계를 읽지 않는다. */
interface LiferView { concept: string; code: string; where: string; serial: string }

const toQueueItem = (p: Plate): QueueItem => ({
  kind: p.track,
  label: p.nameKo,
  mins: p.estMin,
  sub: p.token ?? TRACK_LABEL[p.track],
  review: p.role === 'review' || p.role === 'retry',
});

export interface SessionScreenProps {
  repoId: number;
  repoName: string;
}

export function SessionScreen({ repoId, repoName }: SessionScreenProps): React.JSX.Element | null {
  const session = useUi((s) => s.session);
  const plates = useUi((s) => s.plates);
  const pos = useUi((s) => s.pos);
  const results = useUi((s) => s.results);
  const carry = useUi((s) => s.carry);
  const done = useUi((s) => s.done);
  const plate = useUi(currentPlate);

  const [ladderOpen, setLadderOpen] = useState(false);
  const [rung, setRung] = useState<RungNo>(1);
  const [stuck, setStuck] = useState('');
  const [ladder, setLadder] = useState<LadderData | null>(null);
  const [dunnoId, setDunnoId] = useState(0);
  const [lifer, setLifer] = useState<LiferView | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  /** Monaco 는 CSS 변수를 못 받아 테마를 hex 로 받는다 (05 §8) — 설정에서 한 번 읽는다. */
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // ── T1 판 하나가 들고 있는 것 (05 §5 · 04 §4~§6). 판이 바뀌면 아래 효과가 비운다.
  const [t1View, setT1View] = useState<T1View>('edit');
  const [t1Stage, setT1Stage] = useState<1 | 2 | 3>(1);
  const [t1Draft, setT1Draft] = useState('');
  const [t1Ticks, setT1Ticks] = useState<Record<number, Tick>>({});
  const [t1Peeks, setT1Peeks] = useState(0);
  const [t1Peeking, setT1Peeking] = useState(false);
  const [t1Downgraded, setT1Downgraded] = useState(false);
  const [t1SavedAt, setT1SavedAt] = useState<number | null>(null);
  const [t1Graded, setT1Graded] = useState<{ result: T1Result; question: Question } | null>(null);
  const [t1Appealed, setT1Appealed] = useState<number[]>([]);
  const [t1Why, setT1Why] = useState<{ text: string; pick: number | null }>({ text: '', pick: null });
  const [t1Short, setT1Short] = useState(false);

  // ── T2 판 하나가 들고 있는 것 (05 §5 · 04 §7~§8). 판이 바뀌면 아래 효과가 비운다.
  const [t2View, setT2View] = useState<T2View>('pick');
  const [t2Sel, setT2Sel] = useState<string[]>([]);
  const [t2Hints, setT2Hints] = useState(0);
  const [t2Graded, setT2Graded] = useState<T2Result | null>(null);
  const [t2Appealed, setT2Appealed] = useState<string[]>([]);

  const result = results[pos] ?? null;
  const elapsed = useUi((s) => s.elapsed[pos] ?? 0);

  useSessionClock(pos, plate?.elapsedS ?? 0, () => void savePlate());

  // 05 §10 `session:mount` — 「인쇄 시작」을 누른 뒤 첫 교정지가 실제로 놓일 때까지.
  // 레이아웃 효과라 브라우저가 그리기 직전에 찍힌다.
  useLayoutEffect(() => {
    closeMark('session:mount');
  }, []);

  useEffect(() => {
    void loadSettings().then((s) => setTheme(s.theme));
  }, []);

  // 판이 바뀌면 사다리는 접힌다 — 앞 판의 4단 입력이 다음 판에 따라오면 안 된다.
  useEffect(() => {
    setLadderOpen(false);
    setRung(1);
    setStuck('');
    setLadder(null);
    setDunnoId(0);
    // T1 도 같다. 초안은 `session_item.state_json` 에 저장돼 있으므로 그것을 되살린다
    // (02 §5.6 — Esc 로 나갔다 오면 이어 찍는다).
    setT1View('edit');
    setT1Draft(plate?.state?.t1Draft ?? '');
    setT1Stage(plate?.state?.t1Stage ?? (plate?.level ?? 1));
    setT1Ticks({});
    setT1Peeks(plate?.state?.peeks ?? 0);
    setT1Peeking(false);
    setT1Downgraded(false);
    setT1SavedAt(null);
    // T2 도 같다 — 고른 파일과 힌트 단은 `session_item.state_json` 에 남아 있다.
    setT2View('pick');
    setT2Sel(plate?.state?.t2Sel ?? []);
    setT2Hints(plate?.state?.hints ?? 0);
    setT2Graded(null);
    setT2Appealed([]);
    setT1Graded(null);
    setT1Appealed([]);
    setT1Why({ text: '', pick: null });
    setT1Short(false);
  }, [plate?.id, plate?.level, plate?.state?.t1Draft, plate?.state?.t1Stage, plate?.state?.peeks,
    plate?.state?.t2Sel, plate?.state?.hints]);

  // 마지막 판을 마치면 요약을 읽는다 (05 §3 — 요약은 읽기 전용이다).
  useEffect(() => {
    if (!done || session === null) return;
    void (async () => {
      const settings = await loadSettings();
      const data = await loadSummary(repoId, session.id, session.startedAt, Date.now(), settings);
      setSummary(data);
      // 세션 중에 연출을 못 본 LIFER 는 여기서 처음 보인다 (D76).
      await markLifersShown(data.lifers.filter((l) => l.unseen).map((l) => l.serial), Date.now());
    })();
  }, [done, session, repoId]);

  const openLadder = useCallback(async () => {
    if (plate === null || plate.payload.track !== 't0') return;
    const next = !ladderOpen;
    setLadderOpen(next);
    if (!next) return;

    const id = await pressDunno(result !== null, result?.correct ?? null);
    setDunnoId(id);
    await openRung(id, 1);
    const settings = await loadSettings();
    setLadder(await loadLadder({
      repoId,
      payload: plate.payload,
      conceptId: plate.conceptId,
      concept: { name: plate.nameKo, token: plate.token ?? '' },
      siteId: plate.siteId,
      sel: result?.sel ?? null,
      answered: result !== null,
      correct: result?.correct ?? false,
      stuck: '',
      dueAt: null,
      now: Date.now(),
      settings,
    }));
  }, [plate, ladderOpen, result, repoId]);

  const goNext = useCallback(async () => {
    if (session === null || plate === null) return;
    // 아래층을 마쳤으면 부모로 돌아간다 — 「이어보기」가 그때 열린다 (02 §4).
    if (plate.role === 'prereq' && plate.parentItemId !== null) {
      await returnToParent(dunnoId);
      return;
    }
    const next = pos + 1;
    if (next >= plates.length) {
      await completeSession();
      return;
    }
    useUi.getState().setCarry(null);
    useUi.getState().goTo(next);
  }, [session, plate, pos, plates.length, dunnoId]);

  const submit = useCallback(async (sel: number) => {
    const answered = await answerPlate({
      sel,
      elapsedMs: elapsed * 1000,
      dunno: ladderOpen,
      rungsOpened: ladderOpen ? [rung] : [],
    });
    if (answered === null || plate === null) return;
    const shown = useUi.getState().liferShown;
    // 연출은 첫 성공이고 다시 찍기·아래층이 아닐 때만 (D76).
    if (answered.correct && answered.layer[1] > answered.layer[0] && answered.layer[0] === 0
      && plate.role !== 'retry' && plate.role !== 'prereq' && shown <= 3) {
      const payload = plate.payload.track === 't0' ? plate.payload : null;
      markLiferOpen();
      setLifer({
        concept: plate.nameKo,
        code: plate.token ?? '',
        where: `당신의 <b>${baseName(payload?.file ?? '')}:${payload?.focus ?? 0}</b> 에서 채집 · T0 문법`,
        serial: `#${String(shown).padStart(3, '0')}`,
      });
    }
  }, [elapsed, ladderOpen, rung, plate]);

  /** 원본 블록의 PROT 집합. 거터가 줄마다 다시 만들면 0.2 ms 예산을 못 지킨다 (04 §4.5). */
  const t1Prot = useMemo(() => {
    const payload = plate?.payload.track === 't1' ? plate.payload : null;
    if (payload === null) return new Set<string>();
    return buildProt({ original: payload.original, grammar: grammarKeyOf(payload.file) });
  }, [plate]);

  const t1LeaveLine = useCallback((index: number, text: string) => {
    const payload = plate?.payload.track === 't1' ? plate.payload : null;
    if (payload === null) return;
    const tick = evalLine(index, text, payload.original, t1Prot);
    setT1Ticks((prev) => ({ ...prev, [index]: tick }));
  }, [plate, t1Prot]);

  const t1SaveDraft = useCallback((draft: string) => {
    setT1Draft(draft);
    setT1SavedAt(Date.now());
    // 초안은 `session_item.state_json` 으로 내려간다 (05 §3 저장 5시점).
    useUi.getState().patchState(pos, { t1Draft: draft, t1Stage, peeks: t1Peeks });
  }, [pos, t1Stage, t1Peeks]);

  const t1Grade = useCallback(async () => {
    const nonEmpty = t1Draft.split('\n').filter((l) => l.trim() !== '').length;
    // 6줄 미만은 한 번 경고하고 두 번째 누름에 채점한다 (04 §4.6 · 목업).
    if (nonEmpty < MIN_GRADE_LINES && !t1Short) {
      setT1Short(true);
      useUi.getState().say(`아직 너무 짧습니다 (${nonEmpty}줄). 한 번 더 누르면 그대로 채점합니다.`);
      return;
    }
    setT1Peeking(false);
    const graded = await gradeT1Plate({
      draft: t1Draft, stage: t1Stage, peeks: t1Peeks, downgraded: t1Downgraded,
    });
    if (graded === null) return;
    setT1Graded(graded);
    setT1View('result');
  }, [t1Draft, t1Stage, t1Peeks, t1Downgraded, t1Short]);

  const t1Downgrade = useCallback(() => {
    if (t1Stage <= 1) return;
    setT1Downgraded(true);
    setT1Stage((prev) => (prev - 1) as 1 | 2 | 3);
    useUi.getState().say('한 단계 쉽게 — 기록만 남고 감점은 없습니다.');
  }, [t1Stage]);

  const t1Peek = useCallback((on: boolean) => {
    setT1Peeking(on);
    // 첫 홀드에만 센다 (05 §8). 감점이 아니라 「더 자주 보여줄 신호」다.
    if (on) setT1Peeks((prev) => prev + 1);
  }, []);

  const t1Finish = useCallback(async () => {
    if (t1Graded === null || plate === null) return;
    const finished = await finishT1Plate(t1Graded.result, t1Graded.question, {
      draft: t1Draft,
      stage: t1Stage,
      peeks: t1Peeks,
      downgraded: t1Downgraded,
      elapsedMs: elapsed * 1000,
      appealed: t1Appealed,
      why: t1Why,
    });
    if (finished === null) return;
    const shown = useUi.getState().liferShown;
    if (finished.correct && finished.layer[1] > finished.layer[0] && finished.layer[0] === 0
      && plate.role !== 'retry' && plate.role !== 'prereq' && shown <= 3) {
      markLiferOpen();
      const payload = plate.payload.track === 't1' ? plate.payload : null;
      setLifer({
        concept: `${plate.nameKo} 필사`,
        code: payload?.fn ?? '',
        where: `당신의 <b>${baseName(payload?.file ?? '')}</b> 에서 채집 · T1 클론 코딩`,
        serial: `#${String(shown).padStart(3, '0')}`,
      });
    }
    await goNext();
  }, [t1Graded, plate, t1Draft, t1Stage, t1Peeks, t1Downgraded, elapsed, t1Appealed, t1Why, goNext]);

  // ── T2 (04 §7~§8). 고르기 → 채점 → 마치기. T1 과 같은 두 걸음이다.
  const t2Toggle = useCallback((path: string) => {
    setT2Sel((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  }, []);

  const t2Hint = useCallback(() => {
    setT2Hints((prev) => {
      if (prev >= MAX_HINTS) return prev;
      useUi.getState().say(prev + 1 === MAX_HINTS ? '이제 개수까지 알려 드렸어요.' : '힌트는 감점이 아니에요.');
      return prev + 1;
    });
  }, []);

  const t2Grade = useCallback(() => {
    const payload = plate?.payload.track === 't2' ? plate.payload : null;
    if (payload === null || t2Sel.length === 0) return;
    // 파일을 고르는 두 종만 이 화면이 받는다 — 흐름 추적·의존성 방향의 입력 화면은 M5 다.
    if (payload.kind !== 'placement' && payload.kind !== 'radius') return;
    const graded = gradeT2Plate({ kind: payload.kind, selected: t2Sel }, t2Hints);
    if (graded === null) return;
    setT2Graded(graded);
    setT2View('result');
    useUi.getState().say(liveAfter(graded));
  }, [plate, t2Sel, t2Hints]);

  const t2Appeal = useCallback((path: string) => {
    setT2Appealed((prev) => (prev.includes(path) ? prev : [...prev, path]));
  }, []);

  const t2Finish = useCallback(async () => {
    if (t2Graded === null) return;
    const finished = await finishT2Plate(t2Graded, t2Appealed, elapsed * 1000);
    if (finished === null) return;
    await goNext();
  }, [t2Graded, t2Appealed, elapsed, goNext]);

  if (session === null) return null;

  const band = (
    <JobBand
      runNo={`Run ${session.seqInDay}`}
      repo={repoName}
      queue={plates.map(toQueueItem)}
      pos={done ? plates.length : pos}
      elapsed={elapsed}
      totalElapsed={session.elapsedS}
    >
      <FlatButton ghost onClick={() => void pauseSession()}>나가기</FlatButton>
    </JobBand>
  );

  return (
    <div className="session-screen">
      <SessionShell
        band={band}
        lifer={lifer}
        onCloseLifer={() => setLifer(null)}
        ladderOpen={ladderOpen}
        onCloseLadder={() => setLadderOpen(false)}
      >
        {done && summary !== null ? (
          <Summary
            runNo={`Run ${session.seqInDay}`}
            repo={repoName}
            date={session.dayKey}
            day={session.dayKey.slice(-2)}
            results={summary.shifts.map((s) => ({
              conceptId: s.conceptId, concept: s.nameKo, code: s.token ?? '',
              track: asViewTrack(s.track),
              lyFrom: s.from, lyTo: s.to, next: s.nextLabel,
              ...(s.lastRole === 'prereq' ? { extra: '아래층' } : {}),
            }))}
            printed={summary.plates}
            ok={summary.exact}
            mins={summary.minutes}
            streak={0}
            {...(summary.lifers[0]
              ? {
                  lifer: {
                    concept: summary.lifers[0].nameKo,
                    code: summary.lifers[0].token ?? '',
                    where: `#${String(summary.lifers[0].serial).padStart(3, '0')} · 당신의 `
                      + `<b>${baseName(summary.lifers[0].filePath)}`
                      + `:${summary.lifers[0].lineNo ?? 0}</b> 에서 채집`,
                  },
                }
              : {})}
            tomorrow={`내일은 <b>${summary.shifts.length}</b> 개념이 다시 올라옵니다.`}
            onHome={() => {
              useUi.getState().closeSession();
              useUi.getState().go('home');
            }}
          />
        ) : plate === null ? null : plate.track === 't2' ? (
          <T2Plate
            plate={plate}
            no={pos + 1}
            result={result}
            graded={t2Graded}
            view={t2View}
            onView={setT2View}
            selected={t2Sel}
            onToggle={t2Toggle}
            hints={t2Hints}
            onHint={t2Hint}
            onGrade={t2Grade}
            appealed={t2Appealed}
            onAppeal={t2Appeal}
            onFinish={() => void t2Finish()}
          />
        ) : plate.track === 't1' ? (
          <T1Plate
            plate={plate}
            no={pos + 1}
            result={result}
            theme={theme}
            graded={t1Graded}
            view={t1View}
            onView={setT1View}
            stage={t1Stage}
            draft={t1Draft}
            onDraft={t1SaveDraft}
            peeks={t1Peeks}
            onPeek={t1Peek}
            peeking={t1Peeking}
            ticks={t1Ticks}
            onLeaveLine={t1LeaveLine}
            onGrade={() => void t1Grade()}
            onDowngrade={t1Downgrade}
            savedAt={t1SavedAt}
            appealed={t1Appealed}
            onAppeal={(oi) => setT1Appealed((prev) =>
              prev.includes(oi) ? prev.filter((x) => x !== oi) : [...prev, oi])}
            why={t1Why}
            onWhyText={(text) => setT1Why((prev) => ({ ...prev, text }))}
            onWhyPick={(pick) => setT1Why((prev) => ({ ...prev, pick }))}
            onFinish={() => void t1Finish()}
          />
        ) : (
          <T0Plate
            plate={plate}
            no={pos + 1}
            result={result}
            payoff={carry !== null && carry.parentItemId === plate.id ? carry.payoff : null}
            ladder={ladder}
            ladderOpen={ladderOpen}
            rung={rung}
            stuck={stuck}
            onRung={(r) => {
              setRung(r);
              void openRung(dunnoId, r);
            }}
            onStuck={setStuck}
            onCopyPrompt={() => {
              if (ladder !== null) void navigator.clipboard?.writeText(ladder.prompt);
            }}
            onDunno={() => void openLadder()}
            onJumpPrereq={(conceptId) => void jumpPrereq(dunnoId, conceptId as Plate['conceptId'])}
            onBack={() => void backFromPrereq(dunnoId)}
            onSubmit={(sel) => void submit(sel)}
            onNext={() => void goNext()}
            onSelect={(sel) => useUi.getState().patchState(pos, { sel })}
          />
        )}
      </SessionShell>
    </div>
  );
}

/** 오버레이는 자기 밖의 DOM 을 모른다 — LIFER 를 실제 요소로 바꿔 넘기는 것은 여기 몫이다. */
function SessionShell(props: {
  band: React.ReactNode;
  lifer: LiferView | null;
  onCloseLifer: () => void;
  ladderOpen: boolean;
  onCloseLadder: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SessionOverlay
      band={props.band}
      {...(props.lifer
        ? { lifer: <LiferVeil {...props.lifer} onClose={props.onCloseLifer} /> }
        : {})}
      onCloseLifer={props.onCloseLifer}
      ladderOpen={props.ladderOpen}
      onCloseLadder={props.onCloseLadder}
      onExit={() => void pauseSession()}
    >
      {props.children}
    </SessionOverlay>
  );
}
