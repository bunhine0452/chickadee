/**
 * 성능 계측 (05 §10). Tauri 릴리스엔 DevTools 가 없다 — 재는 자를 앱이 스스로 들고 있어야 한다.
 *
 * `?dev=1` 일 때만 `window.__audit` 이 붙는다. `performance.mark` 6종은 항상 찍히고,
 * 값은 개발자 패널과 `perf_sample` 로 간다.
 *
 * **기준 엔진은 WKWebView 다.** Chromium 수치는 참고값일 뿐이라, 이 파일이 재는 값은
 * macOS 앱 안에서 잰 것만 뜻이 있다. 절차는 아래 `HOW` 에 적어 둔다.
 */

/** 05 §10 이 정한 6종. 이름을 바꾸면 예산 표와 어긋난다. */
export const MARKS = [
  'home:paint',
  'session:mount',
  't0:grade',
  't1:monaco',
  'theme:switch',
  'lifer:open',
] as const;
export type Mark = (typeof MARKS)[number];

/** 05 §10 예산(p95, ms). 넘으면 규칙을 강화하지 목표를 낮추지 않는다. */
export const BUDGET: Record<Mark, number> = {
  'home:paint': 400,
  'session:mount': 50,
  't0:grade': 30,
  't1:monaco': 250,
  'theme:switch': 100,
  'lifer:open': 50,
};

/** 홈 스크롤+hover 교대의 p95 예산 (05 §10). */
export const FRAME_BUDGET_MS = 12;

export interface Sample {
  avg: number;
  p95: number;
  max: number;
  over16: number;
  frames: number;
}

/** 구간 하나를 재고 `performance.measure` 로 남긴다. 실패해도 앱을 멈추지 않는다. */
export function measure<T>(mark: Mark, run: () => T): T {
  const started = performance.now();
  try {
    return run();
  } finally {
    const ms = performance.now() - started;
    try {
      performance.measure(mark, { start: started, duration: ms });
    } catch {
      // 측정이 앱을 방해하지 않는다 — 브라우저가 거부하면 그냥 넘어간다.
    }
  }
}

/**
 * 시작 시각을 이미 아는 구간을 남긴다 — 마운트처럼 **끝나는 자리가 시작한 자리와 다른** 것.
 * React 는 상태를 동기로 반영하지 않으므로 `measure(mark, run)` 으로는 잡을 수 없다.
 */
export function measureSince(mark: Mark, startedAt: number): void {
  try {
    performance.measure(mark, { start: startedAt, duration: performance.now() - startedAt });
  } catch {
    // 측정이 앱을 방해하지 않는다.
  }
}

/**
 * 마운트 구간의 시작 시각. 세션과 LIFER 는 상태를 세운 자리와 화면에 놓이는 자리가 달라서
 * 시작을 여기 적어 두고 컴포넌트가 끝을 찍는다.
 */
const pending: Partial<Record<Mark, number>> = {};

export const markSessionOpen = (): void => { pending['session:mount'] = performance.now(); };
export const markLiferOpen = (): void => { pending['lifer:open'] = performance.now(); };

/** 시작이 적혀 있으면 지금까지를 남기고 지운다. 없으면 아무 일도 하지 않는다. */
export function closeMark(mark: Mark): void {
  const started = pending[mark];
  if (started === undefined) return;
  delete pending[mark];
  measureSince(mark, started);
}

/** 이미 찍힌 `measure` 들을 이름별로 모은다. */
export function collected(): Partial<Record<Mark, Sample>> {
  const out: Partial<Record<Mark, Sample>> = {};
  for (const mark of MARKS) {
    const entries = performance.getEntriesByName(mark, 'measure');
    if (entries.length === 0) continue;
    out[mark] = summarise(entries.map((e) => e.duration));
  }
  return out;
}

export function summarise(ms: readonly number[]): Sample {
  if (ms.length === 0) return { avg: 0, p95: 0, max: 0, over16: 0, frames: 0 };
  const sorted = [...ms].sort((a, b) => a - b);
  const at = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return {
    avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p95: sorted[at] ?? 0,
    max: sorted.at(-1) ?? 0,
    over16: sorted.filter((v) => v > 16).length,
    frames: sorted.length,
  };
}

/**
 * 목업의 `__audit.perf` 이식 — 스크롤과 hover 를 교대로 걸며 프레임 시간을 모은다.
 * 실제 입력이 아니라 합성이지만, 재는 것은 **스타일 재계산과 합성 비용**이라 충분하다.
 */
export async function perf(ms = 3_000): Promise<Sample> {
  const frames: number[] = [];
  const nodes = [...document.querySelectorAll<HTMLElement>('.node, .sheet')];
  const started = performance.now();
  let last = started;
  let i = 0;

  await new Promise<void>((resolve) => {
    const step = (): void => {
      const now = performance.now();
      frames.push(now - last);
      last = now;
      // 스크롤과 hover 를 교대로 — 목업이 재던 것과 같은 부하다.
      if (i % 2 === 0) window.scrollBy(0, i % 8 === 0 ? 40 : -40);
      else nodes[i % Math.max(1, nodes.length)]?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
      i += 1;
      if (now - started >= ms) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  // 첫 프레임은 준비 비용이라 뺀다.
  return summarise(frames.slice(1));
}

/** WKWebView 에서 실제로 재는 절차 (05 §10). 코드가 아니라 사람이 하는 일이라 글로 둔다. */
export const HOW = [
  '자동 — `VITE_PERF=1 VITE_PERF_REPO=<리포> pnpm --filter @chickadee/desktop exec tauri build --no-bundle`',
  '  뒤 `HOME=<빈 디렉터리> ./target/release/chickadee-app` 로 띄우면 하네스가 혼자 돌고',
  '  결과가 그 HOME 아래 `chickadee.db` 의 `perf_sample` 에 남는다 (devtools/perfRun.ts).',
  '  **창을 앞에 세워 둬야 한다** — 가려진 WKWebView 는 requestAnimationFrame 을 멈춰서',
  '  프레임이 0개로 나온다(실측). `osascript` 로 frontmost 를 계속 세우면 된다.',
  '  `HOME` 을 바꾸는 이유는 Tauri 의 app_data_dir 이 거기 딸려 있어서다 — 실제 프로필을 안 건드린다.',
  '',
  '손으로 — 1. macOS 에서 `pnpm tauri dev` 로 앱을 띄운다.',
  '2. Safari → 설정 → 고급 → 「메뉴 막대에서 개발자용 기능 보기」를 켠다.',
  '3. Safari → 개발 → (기기 이름) → Chickadee 로 Web Inspector 를 붙인다.',
  '4. 주소에 `?dev=1` 을 붙여 다시 연다 (`window.__audit` 이 여기서만 붙는다).',
  '5. 콘솔에서 `await __audit.perf()` 를 부르고 p95 를 05 §10 예산과 비교한다.',
  '6. 예산을 넘으면 Timelines 로 어느 규칙이 깨졌는지 본다 — 목표를 낮추지 않는다.',
  '',
  '개발 서버(`tauri dev`)로 잰 `home:paint` 는 번들되지 않은 ESM 을 세는 것이라 과장된다.',
  '릴리스 빌드로 재라.',
] as const;

export interface Audit {
  perf: typeof perf;
  marks: typeof collected;
  budget: typeof BUDGET;
  how: typeof HOW;
}

/** `?dev=1` 일 때만 붙인다 — 릴리스 번들에 손잡이를 남기지 않는다. */
export function installAudit(search: string): boolean {
  if (!new URLSearchParams(search).has('dev')) return false;
  (globalThis as unknown as { __audit: Audit }).__audit = {
    perf, marks: collected, budget: BUDGET, how: HOW,
  };
  return true;
}
