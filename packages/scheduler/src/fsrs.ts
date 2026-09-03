/**
 * FSRS 어댑터 (02 §3.1·§3.2·§3.5·§3.6). **언제** 다시 인쇄할지만 정한다 —
 * 겹(`layer`)은 `reducer.ts` 가 정하고 이 파일은 겹을 모른다.
 *
 * 라이브러리는 `ts-fsrs@5.4.2` 이고 구성은 D73 이 못박았다:
 * `enable_short_term: true` + 학습 단계 **빈 목록** + `enable_fuzz: false`.
 * 기본값(`1m`·`10m` 학습 단계)을 그대로 쓰면 하루 한 세션인 이 앱이 판을 6분 뒤에 다시 걸고,
 * 반대로 `enable_short_term: false` 로 끄면 같은 날 공식이 통째로 빠져 02 §4 의
 * 「다시 찍기 정답 ×1.41 · 오답 ×0.5」가 사라진다(실측: S 가 한 자리도 안 움직인다).
 * 단계 목록만 비우면 둘 다 얻는다.
 */
import type { Grade, Layer, Mastery, Track } from '@chickadee/store-sql';
import {
  FSRS5_DEFAULT_DECAY, Rating, State, createEmptyCard, fsrs, generatorParameters,
  type Card as FsrsCard, type Grade as FsrsGrade,
} from 'ts-fsrs';

const MS_PER_DAY = 86_400_000;

/** 02 §3.6 초기 파라미터. `scheduler_params` 에 `source='default'` 로 1행 들어간다. */
export const FSRS5_DEFAULT_W: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
  1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];

export const DEFAULT_RETENTION = 0.9;

/** 02 §3.6 은 19개를 저장한다. 라이브러리는 21개를 받으므로 경계에서만 늘린다. */
export const FSRS5_PARAM_COUNT = 19;

/**
 * 19 → 21. 꼬리 둘은 `migrateParameters` 가 내놓는 것과 같은 값이고,
 * `w[20] = 0.5` 가 FSRS-5 의 decay 다 — 이 값이 아니면 망각 곡선이 FSRS-6 것이 되어
 * 같은 S 에 간격이 두 배가 된다.
 */
export function toLibraryParams(w: readonly number[]): number[] {
  if (w.length === FSRS5_PARAM_COUNT) return [...w, 0, FSRS5_DEFAULT_DECAY];
  return [...w];
}

/** 02 §3.2 는 Easy 를 쓰지 않는다 — 등급은 1~3 만 나온다. */
export type UsedGrade = 1 | 2 | 3;

export interface FsrsResult {
  state: 0 | 1 | 2 | 3;
  stability: number;
  difficulty: number;
  dueAt: number;
  lastReviewAt: number;
  reps: number;
  lapses: number;
  /** 직전 복습부터 (첫 복습 0). 원장 열 `elapsed_days`. */
  elapsedDays: number;
  scheduledDays: number;
  /** 복습 시점 retrievability. 첫 복습이면 `null`. */
  rAtReview: number | null;
}

export interface Scheduler {
  readonly paramsId: number;
  review(m: Pick<Mastery, 'state' | 'stability' | 'difficulty' | 'dueAt' | 'lastReviewAt' | 'reps' | 'lapses'>,
         grade: UsedGrade, now: number): FsrsResult;
  retrievability(m: Pick<Mastery, 'state' | 'stability' | 'difficulty' | 'dueAt' | 'lastReviewAt' | 'reps' | 'lapses'>,
                 now: number): number;
}

export interface SchedulerConfig {
  /** `scheduler_params.id` — 모든 원장 행이 이것을 들고 있어야 재생이 결정적이다 (02 §3.6). */
  paramsId: number;
  w?: readonly number[];
  requestRetention?: number;
}

function toFsrsCard(
  m: Pick<Mastery, 'state' | 'stability' | 'difficulty' | 'dueAt' | 'lastReviewAt' | 'reps' | 'lapses'>,
  now: number,
): FsrsCard {
  if (m.state === 0 || m.stability === null || m.difficulty === null) {
    return createEmptyCard(new Date(m.lastReviewAt ?? now));
  }
  const last = new Date(m.lastReviewAt ?? now);
  return {
    due: new Date(m.dueAt ?? now),
    stability: m.stability,
    difficulty: m.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: m.reps,
    lapses: m.lapses,
    state: m.state as State,
    last_review: last,
  };
}

/** 02 §3.2 매핑의 결과값(1·2·3)을 라이브러리 등급으로. Easy(4)는 만들지 않는다. */
const RATING: Record<UsedGrade, FsrsGrade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
};

export function makeScheduler(config: SchedulerConfig): Scheduler {
  const params = generatorParameters({
    w: toLibraryParams(config.w ?? FSRS5_DEFAULT_W),
    request_retention: config.requestRetention ?? DEFAULT_RETENTION,
    // 06 §1.3 결정성 — 같은 입력이면 같은 due 가 나와야 골든이 성립한다.
    enable_fuzz: false,
    enable_short_term: true,
    learning_steps: [],
    relearning_steps: [],
  });
  const engine = fsrs(params);

  const retrievability: Scheduler['retrievability'] = (m, now) => {
    if (m.state === 0 || m.stability === null) return 0;
    return engine.get_retrievability(toFsrsCard(m, now), new Date(now), false);
  };

  return {
    paramsId: config.paramsId,
    retrievability,
    review(m, grade, now) {
      const fresh = m.state === 0 || m.lastReviewAt === null;
      const before = toFsrsCard(m, now);
      const r = fresh ? null : retrievability(m, now);
      const { card, log } = engine.next(before, new Date(now), RATING[grade]);
      return {
        state: card.state as 0 | 1 | 2 | 3,
        stability: card.stability,
        difficulty: card.difficulty,
        dueAt: card.due.getTime(),
        lastReviewAt: now,
        reps: card.reps,
        lapses: card.lapses,
        elapsedDays: fresh ? 0 : (now - (m.lastReviewAt ?? now)) / MS_PER_DAY,
        scheduledDays: log.scheduled_days,
        rAtReview: r,
      };
    },
  };
}

// ───────── 02 §3.2 등급 매핑 ─────────

export interface GradeInput {
  track: Track;
  /** 답의 정오. 「모르겠어요」와 무관하다 (02 §4 — `ok` 는 원래 값). */
  ok: boolean;
  /** 「모르겠어요」를 눌렀나. 눌렀으면 답과 무관하게 Again 이다. */
  dunno: boolean;
  /** 개념 첫 성공(아직 `first_ok_at` 이 없음). */
  fresh: boolean;
  /** 전이로 첫 겹을 받은 개념 (§6.3) — 첫 정답이 Hard 가 아니라 Good 이다. */
  transfer: boolean;
  /** 다시 찍기 판. */
  retry: boolean;
  /** T1 의미 일치율 · T2 핵심 점수 (0~100). T0 은 쓰지 않는다. */
  pct?: number;
  /** T1 원본 잠깐 보기 · T2 힌트 횟수 — 임계를 넘으면 Good 이 Hard 로 내려간다. */
  assists?: number;
  /** T1 「한 단계 쉽게」를 썼나. */
  downgraded?: boolean;
  /**
   * 합격 문턱(백분율). 없으면 `PASS_PCT`(85)다. T1 은 소블록 완충값을 넘긴다 —
   * `advanceThreshold(total) = min(85, 100 − 200/total)` (04 §4.6 · D83).
   */
  passPct?: number;
  /** T1 이름 맞바꿈이 한 줄이라도 있나 — 백분율과 무관하게 불합격이다 (04 §4.6). */
  swap?: boolean;
}

/**
 * T1 합격 문턱 (04 §4.6 · 정본 §5). `100 − 200/total` 은 「두 줄까지 놓쳐도 된다」와 같은
 * 값이다 — 20줄 미만 소블록에서 한 줄이 15 점을 넘게 잡아먹는 것을 완충한다.
 * `total` 은 원본의 **비공백** 줄 수다. 12줄 블록은 83, 14줄부터는 85 다.
 *
 * **정수로 반올림한다**(D83). 04 §4.6 은 `pct` 를 `round(100·meaning/total)` 로 정하고
 * 문턱은 실수로 두는데, 12줄 블록의 10/12 는 정확히 83.333…이라 `pct` 83 이 문턱 83.333 을
 * **못 넘는다** — 공식이 허락한 「두 줄」이 반올림에서 사라진다. 양쪽을 정수로 맞추면 그
 * 부류의 오차가 통째로 없어진다.
 *
 * 하한이 `RETRY_PCT`(65)인 이유: 완충 공식만 쓰면 3줄 블록의 문턱이 33 이 되어 **40 %가
 * 합격이면서 동시에 「같은 단계를 한 번 더」**(04 §4.6 의 65 규칙)가 된다. 블록은 12~40줄
 * 이지만(04 §3.1) 빈 줄을 뺀 `total` 은 그보다 작아질 수 있어 실제로 닿는 자리다.
 */
export function advanceThreshold(total: number): number {
  if (total <= 0) return PASS_PCT;
  return Math.max(RETRY_PCT, Math.min(PASS_PCT, Math.round(100 - 200 / total)));
}

/** 원본 잠깐 보기 3회 이상이면 Good → Hard (02 §3.2). */
export const T1_PEEK_LIMIT = 3;
/** 힌트 2회 이상이면 Good → Hard. */
export const T2_HINT_LIMIT = 2;
export const PASS_PCT = 85;
export const RETRY_PCT = 65;

/**
 * 02 §3.2 표를 그대로 옮긴 것. **Easy 는 쓰지 않는다** — 객관식에 Easy 를 주면
 * 「인식」을 「회상」으로 세어 간격이 튄다.
 */
export function gradeFor(v: GradeInput): UsedGrade {
  if (v.dunno) return 1; // 「오늘 다시 보고 싶다」는 신호이지 벌이 아니다
  if (v.track === 't0') {
    if (!v.ok) return 1;
    if (v.retry) return 3; // 다시 찍기 판 정답은 복습 정답과 같은 등급
    if (v.fresh) return v.transfer ? 3 : 2; // 객관식 첫 정답은 인식이지 회상이 아니다
    return 3;
  }
  const pct = v.pct ?? 0;
  const pass = v.passPct ?? PASS_PCT;
  if (pct < RETRY_PCT) return 1;
  if (v.track === 't1') {
    if (pct < pass || v.downgraded === true || v.swap === true) return 2;
    return (v.assists ?? 0) >= T1_PEEK_LIMIT ? 2 : 3;
  }
  if (pct < pass) return 2;
  return (v.assists ?? 0) >= T2_HINT_LIMIT ? 2 : 3;
}

/**
 * 02 §3.2 의 `ok` 열 — T0 은 정오 그대로, T1·T2 는 백분율이 문턱을 넘었나다.
 *
 * 문턱은 기본 85 이고 T1 은 소블록 완충값(`advanceThreshold`, 04 §4.6)을 넘겨 준다 (D83).
 * 이름 맞바꿈(`swap`)은 백분율과 무관하게 불합격이다 — 인자 순서가 바뀐 코드는 뜻이 바뀐
 * 코드이고, 그것이 겹을 올려 주면 04 §4.6 의 그 문장이 거짓이 된다.
 */
export function okFor(v: Pick<GradeInput, 'track' | 'ok' | 'pct' | 'passPct' | 'swap'>): boolean {
  if (v.track === 't0') return v.ok;
  if (v.swap === true) return false;
  return (v.pct ?? 0) >= (v.passPct ?? PASS_PCT);
}

// ───────── 02 §3.4 흐려짐 ─────────

/** `R ≥ 0.8` 이면 0겹, `≥ 0.6` 이면 1겹, 그 아래는 2겹 흐려진다. */
export const FADE_STEPS: readonly [number, number][] = [
  [0.8, 0],
  [0.6, 1],
];

/**
 * 표시 전용 흐려짐 (02 §3.4). 「4겹 = 완성」이 영구 배지가 되면 홈이 거짓말한다 —
 * 새가 흐려져야 다시 찍을 이유가 보인다.
 */
export function fadeOf(r: number): 0 | 1 | 2 {
  for (const [threshold, fade] of FADE_STEPS) if (r >= threshold) return fade as 0 | 1;
  return 2;
}

/** 겹에서 흐려짐을 뺀 **표시 겹** (02 §3.3 R6). 원장에 쓰는 값이 아니다. */
export function shownLayer(layer: Layer, r: number): Layer {
  const shown = layer - fadeOf(r);
  return (shown < 0 ? 0 : shown) as Layer;
}

/**
 * 아직 한 번도 복습하지 않은 개념에는 흐려짐을 적용하지 않는다.
 *
 * 02 §3.4 의 `t` 는 「마지막 복습 후 일수」인데 그런 것이 없는 개념이 둘 있다 — 새 개념(겹 0,
 * 흐려질 것이 없다)과 **전이로 1겹을 받은 개념**(02 §6.3, 로그 없이 겹만 있다). 뒤의 것에
 * `R = 0` 을 먹이면 받자마자 두 겹 흐려져 0겹이 되어 전이가 통째로 사라진다.
 */
export function shownLayerOf(
  m: Pick<Mastery, 'state' | 'stability' | 'difficulty' | 'dueAt' | 'lastReviewAt' | 'reps' | 'lapses' | 'layer'>,
  sched: Scheduler,
  now: number,
): Layer {
  if (m.state === 0 || m.lastReviewAt === null) return m.layer;
  return shownLayer(m.layer, sched.retrievability(m, now));
}

/** 02 §8.2 `Grade` 는 1~4 를 허용한다. 우리가 만드는 것은 1~3 뿐이다. */
export const asGrade = (g: UsedGrade): Grade => g;
