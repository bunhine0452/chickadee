/**
 * 교정쇄 화면 (05 §2.3 · §3 · §5). 오버레이 · 작업 띠 · 지금 판 · 요약을 잇는다.
 *
 * **상태는 여기 있고 규칙은 없다.** 무엇을 쓸지는 `session-flow` 가, 무엇이 맞는지는
 * `@chickadee/grading` 이, 겹이 얼마나 오를지는 `@chickadee/scheduler` 가 정한다.
 */
import { ipc, log } from '@chickadee/ipc-client';
import { announce, FlatButton } from '@chickadee/ui';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { t } from '@chickadee/i18n';

import { JobBand } from '../../components/session/JobBand.js';
import { SessionOverlay } from '../../components/session/SessionOverlay.js';
import { Summary } from '../../components/session/Summary.js';
import type { RungNo } from '../../components/session/ReprintLadder.js';
import type { QueueItem } from '../../components/shell/TimeQueue.js';
import { closeMark, markLiferOpen } from '../../devtools/audit.js';
import {
  buildProt, evalLine, type AssistCount, type Question, type T1Result, type T2Result, type Tick,
} from '@chickadee/grading';
import { baseName, loadLadder, rebuildPrompt, type LadderData } from '../../data/ladder.js';
import { loadMastery, type Plate } from '../../data/session.js';
import type { Track } from '@chickadee/store-sql';
import { loadSettings, saveSetting } from '../../data/settings.js';
import { loadSummary, markLifersShown, type SummaryData } from '../../data/summary.js';
import {
  answerPlate, backFromPrereq, completeSession, finishT1Plate, finishT2Plate, gradeT1Plate,
  gradeT2Plate, jumpPrereq, openRung,
  pauseSession, pressDunno, returnToParent, savePlate, type T2Answer,
} from '../../session-flow.js';
import { currentPlate, useUi } from '../../store.js';
import { loadFirstMeetingConcepts, readFirstText } from '../../data/read-first.js';
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
/** 판정란 안에 놓이는 첫 기록 (D131). `LiferNote` 가 그대로 받는 모양이다. */
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

/** 참조가 매 렌더 바뀌면 훅 의존성이 흔들린다 — 빈 집합은 하나만 만든다. */
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

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
  /**
   * 4단이 내놓은 프롬프트. **빈 채로 시작한다** — 목업의 `promptOut` 이 그렇고, 「프롬프트
   * 만들기」를 누른 순간 그때의 「막힌 지점」으로 조립된다. 사다리를 열 때 미리 구우면
   * 사용자가 적은 문장이 영영 안 담긴다.
   */
  const [prompt, setPrompt] = useState('');
  const [ladder, setLadder] = useState<LadderData | null>(null);
  const [dunnoId, setDunnoId] = useState(0);
  const [lifer, setLifer] = useState<LiferView | null>(null);
  /** 첫 판을 함께 걷나 (D134). 설정을 읽기 전에는 띠를 내지 않는다 — 깜빡이면 안내가 아니다. */
  const [coach, setCoach] = useState(false);
  /** 0장에 담긴 개념들 (D138). 세션을 열 때 한 번 긷고 「먼저 읽기」가 이것만 본다. */
  const [firstMeeting, setFirstMeeting] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  /** Monaco 는 CSS 변수를 못 받아 테마를 hex 로 받는다 (05 §8) — 설정에서 한 번 읽는다. */
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // ── T1 판 하나가 들고 있는 것 (05 §5 · 04 §4~§6). 판이 바뀌면 아래 효과가 비운다.
  const [t1View, setT1View] = useState<T1View>('edit');
  const [t1Stage, setT1Stage] = useState<1 | 2 | 3>(1);
  const [t1Draft, setT1Draft] = useState('');
  const [t1Ticks, setT1Ticks] = useState<Record<number, Tick>>({});
  const [t1Peeks, setT1Peeks] = useState(0);
  /** 이 판의 글자가 어디서 왔나 (D143). 감점 없음 — 원장에 기록만 한다. */
  const [t1Assist, setT1Assist] = useState<AssistCount | undefined>(undefined);
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
  // 흐름 추적은 세운 순서, 의존성 방향은 문항별 고른 보기 (D107). 파일을 고르는 두 종은
  // `t2Sel` 을 쓰므로 셋이 서로 겹치지 않는다 — 판 하나는 그중 하나만 채운다.
  const [t2Ordered, setT2Ordered] = useState<readonly string[]>([]);
  const [t2Picks, setT2Picks] = useState<readonly (0 | 1 | 2 | 3 | undefined)[]>([]);

  const result = results[pos] ?? null;
  const elapsed = useUi((s) => s.elapsed[pos] ?? 0);

  /**
   * 오버레이가 읽을 한 줄 (05 §7 문구 규약 · D114). 형식은 `[상태]. [수치]. [다음 행동]` 이고
   * 60자는 `announce()` 가 지킨다. 판정란을 통째로 읽히지 않는 이유는 D114 에 있다.
   */
  const live = result === null
    ? ''
    : announce(
      result.correct ? t('session.liveRight') : t('session.liveWrong'),
      result.gain,
      t('session.liveNext'),
    );

  useSessionClock(pos, plate?.elapsedS ?? 0, () => void savePlate());

  // 05 §10 `session:mount` — 「인쇄 시작」을 누른 뒤 첫 교정지가 실제로 놓일 때까지.
  // 레이아웃 효과라 브라우저가 그리기 직전에 찍힌다.
  useLayoutEffect(() => {
    closeMark('session:mount');
  }, []);

  useEffect(() => {
    void loadSettings().then((s) => {
      setTheme(s.theme);
      setCoach(!s.tutorialSeen);
    });
  }, []);

  // 아직 한 겹도 안 올린 개념 (D138 · D150). 세션 한 번에 한 번만 긷고 그 값을 세션 내내
  // 쓴다 — 겹은 하루 최대 +1 이라(D3) 도중에 바뀌어도 그 판은 이미 첫 만남이었다.
  // 실패해도 세션은 그대로 돈다: 「먼저 읽기」가 안 열릴 뿐이다.
  useEffect(() => {
    let alive = true;
    void loadFirstMeetingConcepts()
      .then((set) => { if (alive) setFirstMeeting(set); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [repoId]);

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
    setT2Ordered([]);
    setT2Picks([]);
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

    // 새로 여는 사다리는 앞 판의 프롬프트를 물려받지 않는다.
    setPrompt('');
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
      mastery: (await loadMastery([plate.conceptId])).get(plate.conceptId) ?? null,
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
    setLifer(null);
  }, [session, plate, pos, plates.length, dunnoId]);

  const submit = useCallback(async (sel: number) => {
    const answered = await answerPlate({
      sel,
      elapsedMs: elapsed * 1000,
      dunno: ladderOpen,
      rungsOpened: ladderOpen ? [rung] : [],
    });
    if (answered === null || plate === null) return;
    // 첫 판을 한 번 걸어 봤으면 다음부터는 띠가 안 뜬다. 띠 자체는 이 판이 끝날 때까지
    // 남는다 — 3걸음(판정 읽기)이 아직 남았다 (D134).
    if (coach) {
      void saveSetting('tutorialSeen', true, Date.now())
        .catch(() => log.warn('첫 판 안내 표시를 저장하지 못했다'));
    }
    const shown = useUi.getState().liferShown;
    // 연출은 첫 성공이고 다시 찍기·아래층이 아닐 때만 (D76).
    if (answered.correct && answered.layer[1] > answered.layer[0] && answered.layer[0] === 0
      && plate.role !== 'retry' && plate.role !== 'prereq' && shown <= 3) {
      const payload = plate.payload.track === 't0' ? plate.payload : null;
      markLiferOpen();
      setLifer({
        concept: plate.nameKo,
        code: plate.token ?? '',
        where: t('session.liferWhereT0', {
          file: baseName(payload?.file ?? ''),
          focus: String(payload?.focus ?? 0),
        }),
        serial: `#${String(shown).padStart(3, '0')}`,
      });
    }
  }, [elapsed, ladderOpen, rung, plate, coach]);

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
    useUi.getState().patchState(pos, {
      t1Draft: draft, t1Stage, peeks: t1Peeks,
      ...(t1Assist === undefined ? {} : { assist: t1Assist }),
    });
  }, [pos, t1Stage, t1Peeks, t1Assist]);

  const t1Grade = useCallback(async () => {
    const nonEmpty = t1Draft.split('\n').filter((l) => l.trim() !== '').length;
    // 6줄 미만은 한 번 경고하고 두 번째 누름에 채점한다 (04 §4.6 · 목업).
    if (nonEmpty < MIN_GRADE_LINES && !t1Short) {
      setT1Short(true);
      useUi.getState().say(t('clone.tooShort', { n: String(nonEmpty) }));
      return;
    }
    setT1Peeking(false);
    const graded = await gradeT1Plate({
      draft: t1Draft, stage: t1Stage, peeks: t1Peeks, downgraded: t1Downgraded,
      ...(t1Assist === undefined ? {} : { assist: t1Assist }),
    });
    if (graded === null) return;
    setT1Graded(graded);
    setT1View('result');
  }, [t1Draft, t1Stage, t1Peeks, t1Assist, t1Downgraded, t1Short]);

  const t1Downgrade = useCallback(() => {
    if (t1Stage <= 1) return;
    setT1Downgraded(true);
    setT1Stage((prev) => (prev - 1) as 1 | 2 | 3);
    useUi.getState().say(t('clone.downgraded'));
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
      ...(t1Assist === undefined ? {} : { assist: t1Assist }),
      downgraded: t1Downgraded,
      elapsedMs: elapsed * 1000,
      appealed: t1Appealed,
      why: t1Why,
    });
    if (finished === null) return;
    // T1 은 마치는 즉시 다음 판으로 가므로 기록을 놓을 판정란이 없다 — 첫 기록은
    // 인쇄 완료의 「처음 기록한 문법」 칸이 나른다 (D131).
    await goNext();
  }, [t1Graded, plate, t1Draft, t1Stage, t1Peeks, t1Assist, t1Downgraded, elapsed, t1Appealed,
      t1Why, goNext]);

  // ── T2 (04 §7~§8). 고르기 → 채점 → 마치기. T1 과 같은 두 걸음이다.
  const t2Toggle = useCallback((path: string) => {
    setT2Sel((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  }, []);

  const t2Hint = useCallback(() => {
    setT2Hints((prev) => {
      if (prev >= MAX_HINTS) return prev;
      useUi.getState().say(prev + 1 === MAX_HINTS ? t('map.hintLast') : t('map.hintFree'));
      return prev + 1;
    });
  }, []);

  const t2Grade = useCallback(() => {
    const payload = plate?.payload.track === 't2' ? plate.payload : null;
    if (payload === null) return;
    // 여섯 종이 서로 다른 것을 낸다 (D107·D142). 「덜 골랐다」는 여기서 막지 않는다 —
    // 채점 단추의 자물쇠가 종마다 이미 그것을 안다(`T2Plate`).
    // 폴더의 역할은 문항이 하나라 `t2Picks` 의 첫 칸을 쓴다 — 판 하나는 그중 하나만 채운다.
    const answer: T2Answer = payload.kind === 'flow'
      ? { kind: 'flow', ordered: t2Ordered }
      : payload.kind === 'direction'
        ? { kind: 'direction', picks: t2Picks as readonly (0 | 1 | 2 | 3)[] }
        : payload.kind === 'role'
          ? { kind: 'role', pick: t2Picks[0] ?? null }
          : { kind: payload.kind, selected: t2Sel };
    const graded = gradeT2Plate(answer, t2Hints);
    if (graded === null) return;
    setT2Graded(graded);
    setT2View('result');
    useUi.getState().say(liveAfter(graded));
  }, [plate, t2Sel, t2Ordered, t2Picks, t2Hints]);

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
      runNo={t('band.runNo', { n: String(session.seqInDay) })}
      repo={repoName}
      queue={plates.map(toQueueItem)}
      pos={done ? plates.length : pos}
      elapsed={elapsed}
      totalElapsed={session.elapsedS}
    >
      <FlatButton ghost onClick={() => void pauseSession()}>{t('session.leave')}</FlatButton>
    </JobBand>
  );

  return (
    <div className="session-screen">
      <SessionShell
        band={band}
        ladderOpen={ladderOpen}
        onCloseLadder={() => setLadderOpen(false)}
        live={live}
      >
        {done && summary !== null ? (
          <Summary
            runNo={t('band.runNo', { n: String(session.seqInDay) })}
            repo={repoName}
            date={session.dayKey}
            day={session.dayKey.slice(-2)}
            results={summary.shifts.map((s) => ({
              conceptId: s.conceptId, concept: s.nameKo, code: s.token ?? '',
              track: asViewTrack(s.track),
              lyFrom: s.from, lyTo: s.to, next: s.nextLabel,
              ...(s.lastRole === 'prereq' ? { extra: t('session.rolePrereq') } : {}),
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
                    where: t('summary.liferWhere', {
                      serial: String(summary.lifers[0].serial).padStart(3, '0'),
                      file: baseName(summary.lifers[0].filePath),
                      line: String(summary.lifers[0].lineNo ?? 0),
                    }),
                  },
                }
              : {})}
            tomorrow={t('summary.tomorrow', { n: String(summary.shifts.length) })}
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
            ordered={t2Ordered}
            onOrder={setT2Ordered}
            picks={t2Picks}
            onPick={(i, choice) => setT2Picks((prev) => {
              const next = [...prev];
              next[i] = choice;
              return next;
            })}
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
            {...(t1Assist === undefined ? {} : { assist: t1Assist })}
            onAssist={setT1Assist}
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
            lifer={lifer}
            coach={coach && pos === 0}
            readFirst={plate.payload.track !== 't0'
              ? null
              : readFirstText(plate.payload, plate.conceptId, firstMeeting)}
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
            prompt={prompt}
            onBuildPrompt={() => {
              if (plate.payload.track !== 't0') return;
              setPrompt(rebuildPrompt({
                payload: plate.payload,
                concept: { name: plate.nameKo, token: plate.token ?? '' },
                sel: result?.sel ?? null,
                stuck,
              }));
            }}
            onCopyPrompt={() => {
              // 복사가 실패하면 말한다 — `void` 로 삼키면 WKWebView 에서 아무 일도 안 일어난
              // 것처럼 보인다(거절이 조용하다).
              if (prompt !== '') {
                void ipc.clip.write(prompt).catch(() => {
                  useUi.getState().say(t('session.copyFailed'));
                });
              }
            }}
            onDunno={() => void openLadder()}
            onJumpPrereq={(conceptId, previewSiteId) =>
              void jumpPrereq(dunnoId, conceptId as Plate['conceptId'], previewSiteId)}
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

function SessionShell(props: {
  band: React.ReactNode;
  ladderOpen: boolean;
  onCloseLadder: () => void;
  live: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SessionOverlay
      band={props.band}
      ladderOpen={props.ladderOpen}
      onCloseLadder={props.onCloseLadder}
      live={props.live}
      onExit={() => void pauseSession()}
    >
      {props.children}
    </SessionOverlay>
  );
}
