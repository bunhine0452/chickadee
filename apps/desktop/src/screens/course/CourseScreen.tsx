/**
 * 코스 화면 (D171). 홈을 대신하는 화면이고, 그 위에 단 오버레이가 걸린다.
 *
 * 규칙은 하나도 여기 없다 — 데이터는 `data.ts`, 판정은 `@chickadee/concepts`, 계획은
 * `@chickadee/scheduler`. 이 파일은 상태를 들고 단추를 잇는다.
 *
 * 세 진입: 목차의 챕터를 눌러 패널에서 「관문/판정/시작」, 「오늘 15분」의 첫 칸, 재검.
 * 관문은 **기존 교정쇄**를 연다 — 세션이 열리면 이 화면은 뒤에 `inert` 로 남고, 닫히면
 * 다시 읽는다(겹이 올랐으니).
 */
import { ensureChapterBaked } from '@chickadee/course';
import { t } from '@chickadee/i18n';
import type { ConceptId, StageNo } from '@chickadee/store-sql';
import { FlatButton, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TimeQueue, type QueueItem } from '../../components/shell/TimeQueue.js';
import { loadSettings } from '../../data/settings.js';
import { report, todayKey } from '../../flow.js';
import { useUi } from '../../store.js';
import { ChapterPanel } from './ChapterPanel.js';
import { ChapterToc, GRAD_ID } from './ChapterToc.js';
import {
  dictNow, judgeReading, loadCourse, loadPaths, loadRanges, loadRecheckCards, loadStageCards,
  openCourseSession, openGate, type ChapterView, type CourseData, type PathRow, type RangeRow,
} from './data.js';
import { stageKey, type RunSpec } from './run.js';
import { StageOverlay } from './StageOverlay.js';
import { useCourse } from './store.js';
import './CourseScreen.css';

export interface CourseScreenProps {
  repoId: number;
  repoName: string;
  rootPath: string;
  onBack: () => void;
}

/** 이 실행에서 굽기를 시도한 챕터 — 판이 하나도 안 나온 챕터를 고를 때마다 다시 굽지 않는다. */
const bakeTried = new Set<number>();

const DEAD_KEY = {
  'unreached-call': 'chapter.deadUnreached',
  'uncalled-route': 'chapter.deadUncalledRoute',
  'uncalled-export': 'chapter.deadUncalledExport',
  'orphan-file': 'chapter.deadOrphan',
} as const;

export function CourseScreen(props: CourseScreenProps): React.JSX.Element {
  const { repoId, rootPath } = props;
  const version = useCourse((s) => s.version);
  const selected = useCourse((s) => s.selected);
  const run = useCourse((s) => s.run);
  const inSession = useUi((s) => s.session !== null);
  const [data, setData] = useState<CourseData | null>(null);
  const [paths, setPaths] = useState<PathRow[]>([]);
  const [ranges, setRanges] = useState<RangeRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [env, setEnv] = useState({ tz: 'UTC', rolloverHour: 4, theme: 'light' as 'light' | 'dark' });
  const dict = useMemo(() => dictNow(), []);
  const dayKey = todayKey();

  useEffect(() => {
    void loadSettings().then((s) => setEnv({ tz: s.tz, rolloverHour: s.rolloverHour, theme: s.theme })).catch(() => undefined);
  }, []);

  // 코스 한 벌. 세션이 닫힐 때도 다시 읽는다 — 관문이 올린 겹이 어휘 줄에 닿아야 한다.
  useEffect(() => {
    if (inSession) return undefined;
    let alive = true;
    void loadCourse(repoId, dayKey, Date.now()).then((d) => {
      if (!alive) return;
      setData(d);
      const s = useCourse.getState();
      if (s.selected === null || (s.selected !== GRAD_ID && !d.chapters.some((c) => c.unitId === s.selected))) {
        s.select(d.todayUnitId ?? d.chapters[0]?.unitId ?? null);
      }
    }).catch((e: unknown) => report(e, '코스 읽기'));
    return () => { alive = false; };
  }, [repoId, dayKey, version, inSession]);

  useEffect(() => {
    if (selected === null || selected === GRAD_ID) {
      setPaths([]);
      setRanges([]);
      return undefined;
    }
    let alive = true;
    void Promise.all([loadPaths(selected), loadRanges(selected)]).then(([p, r]) => {
      if (!alive) return;
      setPaths(p);
      setRanges(r);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [selected, version]);

  // 판이 한 장도 없는 챕터는 여는 순간 굽는다 (D172 `ensureChapterBaked`). 인제스트가 이미
  // 구웠으면 `null` 이라 아무 일도 없다. 새로 구워졌을 때만 다시 읽는다 — 0장이 나온 챕터를
  // 고를 때마다 다시 구우면 재료 읽기가 헛돈다.
  useEffect(() => {
    if (selected === null || selected === GRAD_ID || bakeTried.has(selected)) return undefined;
    bakeTried.add(selected);
    let alive = true;
    void ensureChapterBaked({ repoId, rootPath, dict, now: Date.now() }, selected).then((bake) => {
      if (!alive || bake === null) return;
      const n = bake.stages.reduce((s, st) => s + st.baked, 0);
      if (n > 0) useCourse.getState().bump();
    }).catch((e: unknown) => report(e, '코스 판 굽기'));
    return () => { alive = false; };
  }, [selected, repoId, rootPath, dict]);

  const chapter = data?.chapters.find((c) => c.unitId === selected) ?? null;
  const dueSet = useMemo(() => new Set(data?.due.map((d) => d.unitId) ?? []), [data]);

  const gate = useCallback(async (c: ChapterView) => {
    const g = data?.gates.get(c.unitId) ?? null;
    if (g === null || g.concepts.length === 0) return;
    setBusy(true);
    try {
      const r = await openGate(repoId, rootPath, g.concepts as ConceptId[]);
      const { say } = useUi.getState();
      say(r.placed === 0 ? t('chapter.gateFailed') : t('chapter.gateOpened', { n: String(r.placed) }));
    } catch (e) {
      report(e, '어휘 관문');
    } finally {
      setBusy(false);
    }
  }, [data, repoId, rootPath]);

  const judge = useCallback(async (c: ChapterView) => {
    setBusy(true);
    try {
      const now = Date.now();
      const s = useCourse.getState();
      let sessionId = s.sessionId;
      if (sessionId === null || s.sessionDay !== dayKey) {
        sessionId = await openCourseSession(repoId, dayKey, now);
        useCourse.getState().setSession(sessionId, dayKey);
      }
      const moved = await judgeReading({ sessionId, dayKey, now }, c);
      useUi.getState().say(moved.passed
        ? t('chapter.readingPassed')
        : t('chapter.readingFailed', { n: String(c.vocab.zero.length) }));
      useCourse.getState().bump();
    } catch (e) {
      report(e, '읽기 단 판정');
    } finally {
      setBusy(false);
    }
  }, [repoId, dayKey]);

  const start = useCallback(async (c: ChapterView, stage: StageNo) => {
    setBusy(true);
    try {
      const cards = await loadStageCards(c.unitId, stage);
      if (cards.length === 0) {
        useUi.getState().say(t('chapter.noCards'));
        return;
      }
      const spec: RunSpec = { unitId: c.unitId, unitName: c.name, stage, kind: 'first', hasRepair: c.hasRepair, row: c.row, cards };
      useCourse.getState().startRun(spec);
    } catch (e) {
      report(e, '단 열기');
    } finally {
      setBusy(false);
    }
  }, []);

  const recheck = useCallback(async (c: ChapterView) => {
    setBusy(true);
    try {
      const cards = await loadRecheckCards(c);
      if (cards.length < 2) {
        useUi.getState().say(t('chapter.noCards'));
        return;
      }
      const spec: RunSpec = { unitId: c.unitId, unitName: c.name, stage: 2, kind: 'recheck', hasRepair: c.hasRepair, row: c.row, cards };
      useCourse.getState().startRun(spec);
    } catch (e) {
      report(e, '재검 열기');
    } finally {
      setBusy(false);
    }
  }, []);

  /** 「오늘 시작」 — 계획의 첫 칸이 무엇이든 그것을 연다. */
  const startToday = useCallback(() => {
    if (data === null) return;
    const first = data.plan[0];
    if (first === undefined) return;
    const c = data.chapters.find((x) => x.unitId === first.unitId);
    if (c === undefined) return;
    useCourse.getState().select(c.unitId);
    if (first.kind === 'recheck') {
      void recheck(c);
      return;
    }
    if (first.stage === 1) {
      void gate(c);
      return;
    }
    void start(c, first.stage);
  }, [data, recheck, gate, start]);

  const hasNext = useCallback((stage: StageNo): boolean =>
    (chapter?.counts[stage] ?? 0) > 0, [chapter]);

  const todayItems: QueueItem[] = (data?.plan ?? []).map((i) => (i.kind === 'recheck'
    ? { kind: 't2', label: t('chapter.qRecheck'), mins: i.estMin, review: true }
    : { kind: i.stage === 1 ? 't0' : i.stage >= 4 ? 't1' : 't2', label: t(stageKey(i.stage)), mins: i.estMin }));
  const todayMin = Math.round((data?.plan ?? []).reduce((s, i) => s + i.estMin, 0));

  return (
    <>
      <div inert={run !== null ? true : undefined}>
        <main className="cc chapters" tabIndex={-1}>
          <header className="cc-head">
            <h1>{t('chapter.title')}<span className="pl">{t('chapter.plain')}</span></h1>
            <p className="cc-repo">{props.repoName}</p>
            <div className="cc-head-act">
              <FlatButton ghost onClick={props.onBack}>{t('chapter.back')}</FlatButton>
            </div>
          </header>

          {data === null ? (
            <div className="cc-wait" aria-busy="true" />
          ) : data.chapters.length === 0 ? (
            <section className="cc-empty">
              <p><b>{t('chapter.empty')}</b></p>
              <p className="note">{t('chapter.emptyPlain')}</p>
            </section>
          ) : (
            <div className="cc-body">
              <ChapterToc
                chapters={data.chapters}
                selected={selected}
                todayUnitId={data.todayUnitId}
                due={dueSet}
                dead={data.dead}
                onSelect={(id) => useCourse.getState().select(id)}
              />

              <section className="cc-work">
                <section className="cc-today" aria-label={t('chapter.today')}>
                  <h2>{t('chapter.today')}<span className="pl">{t('chapter.todayPlain')}</span></h2>
                  {data.plan.length === 0 ? (
                    <p className="note">{t('chapter.todayNone')}</p>
                  ) : (
                    <>
                      <TimeQueue items={todayItems} pos={0} labels />
                      <p className="note">
                        {t('chapter.todayMin', { n: String(data.plan.length), min: String(todayMin) })}
                        {data.plan.every((i) => i.kind === 'recheck') ? ` — ${t('chapter.todayRecheckOnly')}` : ''}
                      </p>
                      <PressButton tone="pink" disabled={busy} onClick={startToday}>{t('chapter.startToday')}</PressButton>
                    </>
                  )}
                </section>

                {selected === GRAD_ID ? (
                  <section className="cc-panel cc-grad" aria-label={t('chapter.grad')}>
                    <header className="cc-panel-head"><h2>{t('chapter.grad')}</h2></header>
                    <p className="note">{t('chapter.gradPlain')}</p>
                    {data.dead.length === 0 ? <p className="note">{t('chapter.gradNone')}</p> : (
                      <ul className="cc-dead">
                        {data.dead.map((d) => (
                          <li key={d.id}>
                            <b>{t(DEAD_KEY[d.kind])}</b>
                            {' — '}
                            <code>{d.label}</code>
                            <small> · {d.path}{d.line === null ? '' : `:${String(d.line)}`}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : chapter === null ? null : (
                  <ChapterPanel
                    chapter={chapter}
                    gate={data.gates.get(chapter.unitId) ?? null}
                    paths={paths}
                    ranges={ranges}
                    dict={dict}
                    isDue={dueSet.has(chapter.unitId)}
                    busy={busy}
                    dayKey={dayKey}
                    onGate={() => void gate(chapter)}
                    onJudgeReading={() => void judge(chapter)}
                    onStart={(stage) => void start(chapter, stage)}
                    onRecheck={() => void recheck(chapter)}
                  />
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {run === null ? null : (
        <StageOverlay
          repoId={repoId}
          rootPath={rootPath}
          repoName={props.repoName}
          spec={run}
          dayKey={dayKey}
          tz={env.tz}
          rolloverHour={env.rolloverHour}
          theme={env.theme}
          hasNext={hasNext}
          onNextStage={(stage) => {
            const c = data?.chapters.find((x) => x.unitId === run.unitId);
            useCourse.getState().endRun();
            if (c !== undefined) void start({ ...c, row: { ...c.row, stageReached: Math.max(c.row.stageReached, stage - 1) } }, stage);
          }}
          onExit={() => useCourse.getState().endRun()}
        />
      )}
    </>
  );
}
