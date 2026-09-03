/**
 * WebdriverIO · Mocha 전역을 **타입이 있는 문 하나로** 받는다.
 *
 * 왜 이렇게 하나: `webdriverio`·`@wdio/globals` 는 아직 이 리포의 의존이 아니다(상위 세션이
 * `tests/package.json` 에 넣는다). 전역을 `declare global` 로 흉내 내면 나중에 진짜 타입이
 * 들어올 때 「중복 선언」으로 부딪힌다 — 그래서 **모듈 안에서 `globalThis` 를 캐스팅**한다.
 * 진짜 타입이 들어와도 이 파일은 그대로 컴파일되고, 그때 스펙을 `@wdio/globals` import 로
 * 바꾸면 이 파일만 지우면 된다.
 *
 * 단언은 `node:assert/strict` 로 한다(`expect-webdriverio` 를 안 쓴다) — 의존이 하나 줄고,
 * 실패 메시지를 우리가 쓴다. E2E 의 실패 메시지는 「무엇이 왜 틀렸나」를 담아야 CI 로그만 보고
 * 고칠 수 있다.
 */

export interface WdioElement {
  waitForDisplayed: (opts?: { timeout?: number; reverse?: boolean; timeoutMsg?: string }) => Promise<void>;
  waitForExist: (opts?: { timeout?: number; reverse?: boolean; timeoutMsg?: string }) => Promise<void>;
  isExisting: () => Promise<boolean>;
  isDisplayed: () => Promise<boolean>;
  isEnabled: () => Promise<boolean>;
  getText: () => Promise<string>;
  getAttribute: (name: string) => Promise<string | null>;
  setValue: (value: string) => Promise<void>;
  click: () => Promise<void>;
  $: (selector: string) => WdioElement;
  $$: (selector: string) => Promise<WdioElement[]>;
}

export interface WdioBrowser {
  $: (selector: string) => WdioElement;
  $$: (selector: string) => Promise<WdioElement[]>;
  execute: <R, A extends unknown[]>(script: (...args: A) => R, ...args: A) => Promise<R>;
  waitUntil: (
    condition: () => Promise<boolean>,
    opts?: { timeout?: number; interval?: number; timeoutMsg?: string },
  ) => Promise<void>;
  pause: (ms: number) => Promise<void>;
  keys: (value: string | string[]) => Promise<void>;
  reloadSession: () => Promise<void>;
  getPageSource: () => Promise<string>;
}

type Hook = (fn: () => Promise<void> | void) => void;
type Case = (title: string, fn: () => Promise<void> | void) => void;

interface Globals {
  browser: WdioBrowser;
  describe: (title: string, fn: () => void) => void;
  it: Case & { skip: Case };
  before: Hook;
  after: Hook;
}

const globals = (): Globals => {
  const g = globalThis as unknown as Partial<Globals>;
  if (!g.describe || !g.it || !g.before || !g.after) {
    throw new Error('Mocha 전역이 없다 — 이 파일은 wdio 스펙 안에서만 쓴다.');
  }
  return g as Globals;
};

/** 세션이 서기 전에는 없다. 그래서 **부를 때** 찾는다. */
export const wd = (): WdioBrowser => {
  const g = globalThis as unknown as { browser?: WdioBrowser };
  if (!g.browser) throw new Error('WebdriverIO 세션이 없다 — `wdio run` 밖에서 부르지 마라.');
  return g.browser;
};

export const describe = (title: string, fn: () => void): void => globals().describe(title, fn);
export const it: Case = (title, fn) => globals().it(title, fn);
export const before: Hook = (fn) => globals().before(fn);
export const after: Hook = (fn) => globals().after(fn);

/**
 * **만들지 않은 것은 통과시키지 않는다.** 못 만든 시나리오는 지우지도 통과시키지도 않고
 * 사유를 제목에 달아 pending 으로 남긴다 — 리포트에 그대로 뜬다(06 §1.5 는 시나리오를
 * 8개로 상한 고정했으므로 번호는 비우지 않는다).
 */
export const pending = (title: string, why: string): void =>
  globals().it.skip(`${title} — 아직 못 만듦: ${why}`, () => undefined);

/** 기본 대기 상한. WebKitGTK 는 첫 페인트가 느리다(xvfb + 소프트웨어 렌더). */
export const WAIT = 30_000;

/** 셀렉터 하나가 보일 때까지. 실패 메시지에 셀렉터를 담는다. */
export async function shown(selector: string, timeout = WAIT): Promise<WdioElement> {
  const el = wd().$(selector);
  await el.waitForDisplayed({ timeout, timeoutMsg: `${selector} 가 ${timeout}ms 안에 안 보였다` });
  return el;
}

/** 화면 어딘가에 이 문구가 있나 — 조판을 모르는 채로 「표시」만 확인할 때. */
export async function hasText(needle: string): Promise<boolean> {
  const body = await wd().$('body').getText();
  return body.includes(needle);
}

/**
 * 문구가 나타날 때까지 기다린다.
 *
 * **보이는 글자만 읽는다.** `getText` 는 rendered text 라 `.vh#live`(1px·`clip`)에 놓인
 * 낭독 문구는 안 들어온다 — 토스트를 여기서 기다리면 영영 안 온다. 그런 자리는 화면 문구
 * 대신 그 문구가 약속한 **결과**(디스크·DB)를 봐야 한다(E8 의 「전부 지우기」가 그 예다).
 */
export async function waitForText(needle: string, timeout = WAIT): Promise<void> {
  await wd().waitUntil(async () => hasText(needle), {
    timeout,
    interval: 300,
    timeoutMsg: `「${needle}」 가 ${timeout}ms 안에 화면에 안 나왔다`,
  });
}

interface InvokeSlot {
  done: boolean;
  ok?: boolean;
  value?: unknown;
  error?: string;
}

/**
 * Rust 명령을 **앱 안에서** 부른다 — `window.__TAURI_INTERNALS__.invoke` 는
 * `@tauri-apps/api` 의 `invoke` 가 읽는 바로 그 문이다(`packages/ipc-client` 와 같은 길).
 *
 * 왜 필요한가: E8 의 「모의 키」는 화면(`KeyPanel`)이 아직 없어도 **진짜 키체인 경로**를
 * 지나가야 한다. 그리고 `app_paths` 는 격리가 먹었는지 확인하는 유일한 1차 자료다.
 *
 * `browser.execute` 는 Promise 를 직렬화하지 못하므로 **결과를 창에 놓고 폴링**한다.
 */
export async function invoke<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  const slot = `__e2e_${cmd}`;
  await wd().execute(
    (name: string, key: string, payload: Record<string, unknown>) => {
      const w = window as unknown as Record<string, unknown> & {
        __TAURI_INTERNALS__?: { invoke: (c: string, a: unknown) => Promise<unknown> };
      };
      w[key] = { done: false } satisfies { done: boolean };
      const internals = w.__TAURI_INTERNALS__;
      if (!internals) {
        w[key] = { done: true, ok: false, error: 'window.__TAURI_INTERNALS__ 이 없다' };
        return;
      }
      internals.invoke(name, payload).then(
        (value) => { w[key] = { done: true, ok: true, value }; },
        (error: unknown) => { w[key] = { done: true, ok: false, error: JSON.stringify(error) }; },
      );
    },
    cmd, slot, args,
  );

  await wd().waitUntil(
    async () => (await wd().execute((k: string) =>
      ((window as unknown as Record<string, InvokeSlot>)[k]?.done ?? false), slot)),
    { timeout: WAIT, interval: 100, timeoutMsg: `${cmd} 가 ${WAIT}ms 안에 안 끝났다` },
  );

  const out = await wd().execute(
    (k: string) => (window as unknown as Record<string, InvokeSlot>)[k] as InvokeSlot,
    slot,
  );
  if (out.ok !== true) throw new Error(`${cmd} 실패: ${out.error ?? '(사유 없음)'}`);
  return out.value as T;
}

/** 앱이 스스로 말하는 경로 (01 §7). 격리 확인의 1차 자료. */
export const appPaths = (): Promise<{ dataDir: string }> => invoke('app_paths');

/** 앱이 부팅을 끝냈나 — 창이 `visible:false` 로 뜨고 `boot()` 끝에서 열린다(01 §10). */
export async function waitForBoot(timeout = WAIT): Promise<void> {
  await wd().waitUntil(
    async () => wd().execute(() => document.querySelector('#root')?.children.length ?? 0).then((n) => n > 0),
    { timeout, interval: 300, timeoutMsg: `앱이 ${timeout}ms 안에 첫 화면을 안 그렸다` },
  );
}
