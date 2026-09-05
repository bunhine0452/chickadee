/**
 * 클론 코스 화면 (D120 · `clone-screen`).
 *
 * **세션 오버레이가 아니라 별도 화면이다.** 코스는 일일 큐 밖의 모드라(D120) 홈 위에
 * 얹히지 않고 홈을 대신한다. 그래서 Esc 도 세션의 4단(입력 → 베일 → 사다리 → 나가기)이
 * 아니라 **한 겹**이다: 지금 친 것을 저장하고 홈으로 간다. 코스에는 벗길 겹이 없고
 * 확인 모달도 두지 않는다 — 나가도 잃는 것이 없다는 것이 자동 저장의 약속이다.
 *
 * 규칙은 하나도 여기 없다. 순서·조각·판정·원장은 `data.ts` 너머에 있고 이 파일은
 * 상태를 들고 키를 받는다.
 */
import { buildProt, evalLine, type T1Result, type Tick } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import { log } from '@chickadee/ipc-client';
import { TICK_MS } from '@chickadee/scheduler';
import type { Layer } from '@chickadee/store-sql';
import { FlatButton, Kbd, RichText } from '@chickadee/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Page, Split } from '../../components/shell/Page.js';
import { loadSettings } from '../../data/settings.js';
import { report } from '../../flow.js';
import { useUi } from '../../store.js';
import { CourseDone, CoursePlateView, type CourseView } from './CoursePlateView.js';
import { CourseToc } from './CourseToc.js';
import {
  canReadSource, closeCourse, conceptName, courseDeps, enterCourse, gradeStep, layerOf, loadToc,
  loadUnitNames, nextPlate, saveDraft,
  type CloneDeps, type CloneRun, type CloneScope, type CoursePlate, type Toc,
} from './data.js';
import './CloneScreen.css';

/** 04 §4.6 — 6줄 미만은 한 번 경고하고 두 번째 누름에 채점한다. 세션과 같은 문턱이다. */
const MIN_GRADE_LINES = 6;
const SECOND = 1_000;

/**
 * 코스가 설 수 없는 세 갈래 (`clone-screen-empty`). 셋을 한 문장으로 뭉치지 않는 이유는
 * 사용자가 할 일이 서로 다르기 때문이다 — 리포를 읽거나, 코드를 더 쓰거나, 폴더를 찾는다.
 */
const EMPTY_KEY = {
  files: 'course.emptyFiles',
  steps: 'course.emptySteps',
  read: 'course.emptyRead',
} as const;

type Empty = keyof typeof EMPTY_KEY;

/** 파일 확장자 → tree-sitter 문법 키. 거터의 PROT 집합이 이것으로 표를 고른다. */
function grammarKeyOf(path: string): string {
  const ext = path.slice(path.lastIndexOf('.'));
  if (ext === '.tsx' || ext === '.jsx') return 'tsx';
  if (ext === '.py') return 'python';
  if (ext === '.go') return 'go';
  if (ext === '.rs') return 'rust';
  return 'typescript';
}

export interface CloneScreenProps {
  repoId: number;
  repoName: string;
  rootPath: string;
  /** 어느 코스인가. **참조가 매 렌더 바뀌면 안 된다** — 아래 진입 효과의 의존이다. */
  scope: CloneScope;
  onBack: () => void;
}

export function CloneScreen(props: CloneScreenProps): React.JSX.Element {
  const { onBack, repoId, rootPath, scope } = props;
  const [deps, setDeps] = useState<CloneDeps | null>(null);
  const [run, setRun] = useState<CloneRun | null>(null);
  const [names, setNames] = useState<Map<number, string>>(() => new Map());
  const [toc, setToc] = useState<Toc | null>(null);
  const [plate, setPlate] = useState<CoursePlate | null>(null);
  const [empty, setEmpty] = useState<Empty | null>(null);
  const [finished, setFinished] = useState(false);
  const [recut, setRecut] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // ── 조각 하나가 들고 있는 것. 조각이 바뀌면 `loadNext` 가 통째로 갈아 끼운다.
  const [view, setView] = useState<CourseView>('edit');
  const [stage, setStage] = useState<2 | 3>(2);
  const [draft, setDraft] = useState('');
  const [ticks, setTicks] = useState<Record<number, Tick>>({});
  const [peeks, setPeeks] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [downgraded, setDowngraded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [graded, setGraded] = useState<T1Result | null>(null);
  const [short, setShort] = useState(false);
  const [ly, setLy] = useState<readonly [Layer, Layer]>([0, 0]);
  const [elapsed, setElapsed] = useState(0);

  /**
   * 자동 저장이 읽는 지금 값. 상태를 그대로 읽으면 5초짜리 효과가 옛 값을 굽는다.
   *
   * `stepId` 는 **편집 중일 때만** 실린다. 채점을 마친 조각은 `done` 인데 `clone.step_save`
   * 는 status 를 `active` 로 되돌리므로, 결과 화면에서 나가면 끝낸 조각이 다시 큐에 선다.
   */
  const liveRef = useRef({ stepId: 0, draft: '', elapsed: 0 });
  liveRef.current = {
    stepId: view === 'edit' ? plate?.step.id ?? 0 : 0,
    draft,
    elapsed,
  };

  useEffect(() => {
    void loadSettings().then((s) => setTheme(s.theme)).catch(() => undefined);
  }, []);

  /** 다음 조각을 걸고 판 상태를 통째로 갈아 끼운다. 초안은 원장에 있던 것으로 되돌린다. */
  const loadNext = useCallback(async (
    d: CloneDeps, r: CloneRun, unitNames: Map<number, string>,
  ): Promise<CoursePlate | null> => {
    const next = await nextPlate(d, r);
    setToc(await loadToc(r, unitNames));
    if (next.at === 'nothing') {
      setPlate(null);
      setEmpty(await canReadSource(d, r) ? 'steps' : 'read');
      return null;
    }
    if (next.at === 'done') {
      setPlate(null);
      setFinished(true);
      await closeCourse(r.id, 'done', Date.now());
      return null;
    }
    const layer = await layerOf(next.plate.conceptId);
    setPlate(next.plate);
    setRecut(next.recut);
    setView('edit');
    setStage(next.plate.stage);
    setDraft(next.plate.step.draft_text ?? '');
    setTicks({});
    setPeeks(0);
    setPeeking(false);
    setDowngraded(false);
    setSavedAt(null);
    setGraded(null);
    setShort(false);
    setLy([layer, layer]);
    setElapsed(next.plate.step.elapsed_s);
    return next.plate;
  }, []);

  // 화면이 열릴 때 한 번. 이어할 코스가 있으면 그것이고 없으면 새로 연다 —
  // 강제 종료 뒤에도 같은 길이다 (`clone-resume-crash`): `clone_run` 이 `active` 로 남고
  // `clone_step.draft_text` 가 마지막 자동 저장을 들고 있다.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const d = await courseDeps(repoId, rootPath, Date.now());
        const entered = await enterCourse(d, scope);
        if (!alive) return;
        if (entered === null) {
          setEmpty('files');
          return;
        }
        const unitNames = await loadUnitNames(d.repoId);
        if (!alive) return;
        setDeps(d);
        setRun(entered.run);
        setNames(unitNames);
        const at = await loadNext(d, entered.run, unitNames);
        if (alive && entered.resumed && at !== null) {
          useUi.getState().say(t('course.resumed', {
            file: at.step.path, part: String(at.step.part + 1),
          }));
        }
      } catch (e) {
        report(e, '클론 코스');
        if (alive) setEmpty('files');
      }
    })();
    return () => {
      alive = false;
    };
  }, [repoId, rootPath, scope, loadNext]);

  /** 초안을 원장에 내린다. 나가기와 5초 tick 이 같은 문을 쓴다. */
  const flush = useCallback(async (): Promise<void> => {
    const now = liveRef.current;
    if (now.stepId === 0) return;
    await saveDraft(now.stepId, now.elapsed, now.draft === '' ? null : now.draft);
    setSavedAt(Date.now());
  }, []);

  // 시계와 자동 저장. 주기는 T1 과 같다 (05 §3 저장 5시점의 (d) — `TICK_MS` 5초).
  // 창이 보이지 않으면 세지 않는다: 커피를 타러 간 20분이 이 조각의 시간이 되면 안 된다.
  useEffect(() => {
    if (plate === null || view !== 'edit') return;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setElapsed((s) => {
        const next = s + 1;
        if (next % (TICK_MS / SECOND) === 0) void flush().catch(() => undefined);
        return next;
      });
    }, SECOND);
    return () => clearInterval(id);
  }, [plate, view, flush]);

  /** 저장하고 나가기 — Esc 와 「나가기」 단추가 같은 것을 부른다. */
  const leave = useCallback((): void => {
    void (async () => {
      try {
        await flush();
        if (run !== null && !finished) await closeCourse(run.id, 'paused', Date.now());
      } catch (e) {
        log.warn('코스를 저장하지 못했다', {
          errorCode: e instanceof Error && 'code' in e ? String(e.code) : 'UNKNOWN',
        });
      }
      useUi.getState().say(t('course.left'));
      onBack();
    })();
  }, [flush, run, finished, onBack]);

  /**
   * Esc 는 **한 겹**이다 (`clone-screen-esc`). 세션의 4단 규칙을 옮기지 않는다.
   *
   * 잡는 자리는 버블 단계다. Monaco 가 자기 위젯(찾기·제안)을 Esc 로 닫을 때는 전파를
   * 멈추므로 그 한 번은 여기까지 오지 않는다 — 캡처 단계에서 잡으면 그 위젯을 못 닫는다.
   */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.isComposing || e.code !== 'Escape') return;
      e.preventDefault();
      leave();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [leave]);

  /** 원본 블록의 PROT 집합. 거터가 줄마다 다시 만들면 0.2 ms 예산을 못 지킨다 (04 §4.5). */
  const prot = useMemo(() => {
    if (plate === null) return new Set<string>();
    return buildProt({
      original: plate.payload.original, grammar: grammarKeyOf(plate.payload.file),
    });
  }, [plate]);

  const onLeaveLine = useCallback((index: number, text: string) => {
    if (plate === null) return;
    setTicks((prev) => ({ ...prev, [index]: evalLine(index, text, plate.payload.original, prot) }));
  }, [plate, prot]);

  const onGrade = useCallback((): void => {
    if (deps === null || run === null || plate === null) return;
    const nonEmpty = draft.split('\n').filter((l) => l.trim() !== '').length;
    if (nonEmpty < MIN_GRADE_LINES && !short) {
      setShort(true);
      useUi.getState().say(t('clone.tooShort', { n: String(nonEmpty) }));
      return;
    }
    setPeeking(false);
    void (async () => {
      try {
        const out = await gradeStep(deps, run, { ...plate, stage }, {
          user: draft.split('\n'),
          peeks,
          downgraded,
          elapsedS: elapsed,
          durationMs: elapsed * SECOND,
        });
        setGraded(out.result);
        setView('result');
        const after = out.finish?.mastery.layer;
        if (after !== undefined) setLy(([before]) => [before, after]);
        setToc(await loadToc(run, names));
      } catch (e) {
        report(e, '코스 채점');
      }
    })();
  }, [deps, run, plate, draft, short, stage, peeks, downgraded, elapsed, names]);

  const onNext = useCallback((): void => {
    if (deps === null || run === null) return;
    void loadNext(deps, run, names).catch((e: unknown) => report(e, '다음 조각'));
  }, [deps, run, names, loadNext]);

  // 05 §7 — 결과 화면에서 `Enter` 는 다음 조각으로. 편집 중의 `⌘↵` 는 에디터가 받는다.
  useEffect(() => {
    if (view !== 'result') return;
    const onKey = (e: globalThis.KeyboardEvent): void => {
      const target = e.target instanceof Element ? e.target : null;
      if (e.isComposing || e.code !== 'Enter') return;
      if (target?.closest('textarea, input, .monaco-editor') != null) return;
      e.preventDefault();
      onNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, onNext]);

  return (
    <Page className="course" head={(
      <header className="course-head l-row">
        <h1>
          {t('course.title')}
          <span className="pl">{t('course.plain')}</span>
        </h1>
        <p className="course-scope">
          {props.repoName}
          {' · '}
          {scope.kind === 'repo'
            ? t('course.scopeRepo')
            : t('course.scopeUnit', { name: names.get(scope.unitId) ?? '' })}
          {run === null
            ? ''
            : ` · ${run.mode === 'commit' ? t('course.modeCommit') : t('course.modeDep')}`}
        </p>
        <div className="course-head-act l-push">
          <FlatButton onClick={leave} ghost>
            {t('course.leave')} <Kbd keys="Esc" />
          </FlatButton>
        </div>
      </header>
    )}
    >
      {empty !== null ? (
        <section className="course-empty">
          <h2>{t('course.emptyTitle')}</h2>
          <RichText as="p" html={t(EMPTY_KEY[empty])} />
          <FlatButton onClick={onBack}>{t('course.emptyBack')}</FlatButton>
        </section>
      ) : (
        <Split
          sticky
          sideLabel={t('course.tocLabel')}
          side={toc === null
            // 아직 못 읽은 한 프레임. 스피너를 두지 않는다 (정본 §3-7).
            ? <div className="ctoc" aria-busy="true" />
            : (
              <CourseToc
                units={toc.units}
                files={toc.files}
                filesDone={toc.filesDone}
                cut={toc.cut}
                cutDone={toc.cutDone}
                curId={plate?.step.id ?? null}
                curSeq={plate?.step.seq ?? null}
              />
            )}
        >
          <div className="course-work">
            {finished ? (
              <CourseDone n={toc?.cutDone ?? 0} onBack={onBack} />
            ) : plate === null ? (
              <div className="course-wait" aria-busy="true" />
            ) : (
              <CoursePlateView
                plate={plate}
                conceptName={deps === null ? null : conceptName(deps, plate.conceptId)}
                ly={ly}
                theme={theme}
                view={view}
                onView={setView}
                graded={graded}
                draft={draft}
                onDraft={(next) => {
                  setDraft(next);
                  setSavedAt(Date.now());
                }}
                ticks={ticks}
                onLeaveLine={onLeaveLine}
                peeks={peeks}
                peeking={peeking}
                onPeek={(on) => {
                  setPeeking(on);
                  // 첫 홀드에만 센다 (05 §8). 감점이 아니라 「더 자주 보여줄 신호」다.
                  if (on) setPeeks((n) => n + 1);
                }}
                savedAt={savedAt}
                onGrade={onGrade}
                onDowngrade={() => {
                  // 코스에 1단계는 없다 (`clone-fading.ts` — 목차가 순서를 이미 주므로
                  // 「보고 치기」는 타자 연습이 된다). 내려갈 수 있는 것은 3 → 2 뿐이다.
                  if (stage !== 3) return;
                  setDowngraded(true);
                  setStage(2);
                  useUi.getState().say(t('clone.downgraded'));
                }}
                last={run !== null && isLastPart(plate, run, toc)}
                onNext={onNext}
                recut={recut}
              />
            )}
          </div>
        </Split>
      )}
    </Page>
  );
}

/** 목차의 마지막 파일의 마지막 살아 있는 조각인가. 오른쪽 단추의 낱말이 이것으로 갈린다. */
function isLastPart(plate: CoursePlate, run: CloneRun, toc: Toc | null): boolean {
  if (toc === null || plate.step.seq !== run.steps.length - 1) return false;
  const file = toc.units.at(-1)?.files.at(-1);
  if (file === undefined || file.seq !== plate.step.seq) return false;
  return file.parts.filter((p) => p.status !== 'stale').at(-1)?.id === plate.step.id;
}
