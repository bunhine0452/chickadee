/**
 * 05 §11 의 15 시나리오가 나눠 쓰는 장치. **하네스가 아니다** — 하네스(`fixture`·`app-db`·
 * `internals`)는 상위 세션이 세웠고 여기서는 그 위에 시나리오 쪽 편의만 얹는다.
 *
 * 여기 있는 것은 넷이다.
 *   ① `test` — `app` 다리를 늘 세운다. 안 세우면 `__TAURI_INTERNALS__` 가 없어 첫 invoke 가 죽는다.
 *   ② `stubCommands` — 하네스가 모르는 명령(`repo_probe`·`ingest_*`·`plugin:dialog|open`)에
 *      테스트가 대신 답한다. `app-db.ts` 의 `default:` 는 던지므로 덧씌우지 않으면 화면이 선다.
 *   ③ `stubClipboard` — 사다리 4단의 「복사」. 앱은 `@tauri-apps/plugin-clipboard-manager`
 *      를 거치므로(D111) IPC 를 가로챈다.
 *   ④ `keyboardOnly` — 시나리오 15 의 「마우스 0회」를 실제 장치로 만든다.
 */
import type { Locator, Page } from '@playwright/test';

import { test as base, expect } from './fixture.js';
import { NOW } from './build-seed-const.js';

export { expect, NOW };

/**
 * 다리를 늘 세운 `test`. `app` 픽스처가 `page.exposeFunction`·`addInitScript` 를 심으므로
 * 그것을 요구하지 않은 테스트는 빈 `__TAURI_INTERNALS__` 로 떠서 첫 명령에 죽는다.
 */
export const test = base.extend<{ bridge: void }>({
  bridge: [
    async ({ app }, use) => {
      void app;
      await use();
    },
    { auto: true },
  ],
});

/**
 * 앱 한 판. 시각은 하네스가 시드를 구운 값(`NOW`)에 **고정**한다 (06 §1.9-4).
 *
 * `install()` 이 아니라 `setFixedTime()` 인 이유: `install()` 은 타이머까지 가짜로 만들어
 * `useSessionClock` 의 1초 tick 과 토스트가 서지 않는다. 우리가 없애고 싶은 흔들림은
 * **날짜**뿐이다 — 큐와 요약의 `day_key` 가 자정에 갈리는 것.
 */
export async function openApp(page: Page, search = ''): Promise<void> {
  await page.clock.setFixedTime(NOW);
  await page.goto(`/${search}`);
  await page.locator('main.shell:not([aria-busy="true"]), .masthead, .firstrun').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** 홈까지. 첫 실행 화면이 뜨면 그것은 시드가 깨진 것이다. */
export async function openHome(page: Page, search = ''): Promise<void> {
  await openApp(page, search);
  await page.locator('.masthead').waitFor();
}

/**
 * 하네스에 없는 명령에 테스트가 답한다. `addInitScript` 라 **페이지가 뜨기 전에** 걸리고,
 * `installInternals` 뒤에 얹히므로 그것이 세운 `invoke` 를 감싼다.
 *
 * 답을 주지 않은 명령은 그대로 하네스로 내려간다 — `store_*` 는 여전히 진짜 SQLite 다.
 */
export async function stubCommands(page: Page, responses: Record<string, unknown>): Promise<void> {
  await page.addInitScript((canned: Record<string, unknown>) => {
    const win = window as unknown as {
      __TAURI_INTERNALS__: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      };
      __calls: { cmd: string; args: unknown }[];
    };
    win.__calls = [];
    const inner = win.__TAURI_INTERNALS__.invoke.bind(win.__TAURI_INTERNALS__);
    win.__TAURI_INTERNALS__.invoke = async (cmd, args) => {
      win.__calls.push({ cmd, args: args ?? null });
      if (Object.prototype.hasOwnProperty.call(canned, cmd)) {
        return JSON.parse(JSON.stringify(canned[cmd])) as unknown;
      }
      return inner(cmd, args);
    };
  }, responses);
}

/** 지금까지 페이지가 부른 명령. `stubCommands` 를 걸어야 쌓인다. */
export const invokedCommands = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as { __calls: { cmd: string }[] }).__calls.map((c) => c.cmd));

/**
 * Rust 이벤트 흉내 (`internals.ts` 가 `plugin:event|emit` 을 받는다).
 * 인제스트 진행이 이 문으로만 들어온다 — 하네스에는 Rust 가 없다.
 */
export async function emitIpcEvent(page: Page, event: string, payload: unknown): Promise<void> {
  await page.evaluate(
    ([name, body]) =>
      (
        window as unknown as {
          __TAURI_INTERNALS__: { invoke: (c: string, a: unknown) => Promise<unknown> };
        }
      ).__TAURI_INTERNALS__.invoke('plugin:event|emit', { event: name, payload: body }),
    [event, payload] as [string, unknown],
  );
}

/**
 * 클립보드를 가로챈다. 값은 `copiedText` 로 읽는다 — 화면 밖으로 나간 글이 곧 단언이다.
 *
 * 앱은 `@tauri-apps/plugin-clipboard-manager` 를 거친다(D111) — `navigator.clipboard` 는
 * 패키징된 WKWebView 에서 조용히 거절하기 때문이다. 그래서 가로채는 자리도 IPC 다.
 * `navigator.clipboard` 도 같이 덮어 둔다: 어느 쪽으로 새도 테스트가 본다.
 */
export async function stubClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const win = window as unknown as {
      __clipboard: string[];
      __TAURI_INTERNALS__: { invoke: (c: string, a: unknown) => Promise<unknown> };
    };
    win.__clipboard = [];
    const real = win.__TAURI_INTERNALS__.invoke.bind(win.__TAURI_INTERNALS__);
    win.__TAURI_INTERNALS__.invoke = (cmd: string, args: unknown) => {
      if (cmd === 'plugin:clipboard-manager|write_text') {
        // 플러그인의 인자 모양(`{ data: { plainText: { text } } }`)은 판본에 따라 바뀐다 —
        // 모양을 박아 두면 의존성을 올릴 때 조용히 빈 문자열을 담는다. `text` 를 찾아 쓴다.
        const findText = (node: unknown): string | null => {
          if (typeof node !== 'object' || node === null) return null;
          for (const [key, value] of Object.entries(node)) {
            if (key === 'text' && typeof value === 'string') return value;
            const deeper = findText(value);
            if (deeper !== null) return deeper;
          }
          return null;
        };
        win.__clipboard.push(findText(args) ?? JSON.stringify(args));
        return Promise.resolve(null);
      }
      return real(cmd, args);
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      get: () => ({
        writeText: (text: string): Promise<void> => {
          win.__clipboard.push(text);
          return Promise.resolve();
        },
        readText: (): Promise<string> => Promise.resolve(win.__clipboard.at(-1) ?? ''),
      }),
    });
  });
}

export const copiedText = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as { __clipboard: string[] }).__clipboard);

/**
 * `.ask` 가 교정지 안에서 앉은 자리(px).
 *
 * 05 §9 는 「제출 전후 `.ask` 의 `boundingBox().y` 동일」이라 적었지만 뷰포트 y 는
 * 채점 뒤 포커스가 옮겨 가며 `.bench` 가 스크롤되는 만큼 함께 움직인다. 게이트가 지키려는
 * 것은 **판정란이 위쪽 글을 밀지 않는다**이므로 교정지 기준 오프셋을 잰다.
 */
export const askOffset = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const ask = document.querySelector('.ask');
    const sheet = document.querySelector('article.ps');
    if (ask === null || sheet === null) return -1;
    return Math.round((ask.getBoundingClientRect().top - sheet.getBoundingClientRect().top) * 100) / 100;
  });

/** `TimeQueue` 의 `role=img` 문장 — 「N칸 중 M번째 「…」, 전체의 P%」. */
export async function queueSpeech(queue: Locator): Promise<{ cells: number; at: number; share: number }> {
  const label = (await queue.getAttribute('aria-label')) ?? '';
  const m = /^(\d+)칸 중 (\d+)번째 .*, 전체의 (\d+)%$/.exec(label);
  if (m === null) return { cells: 0, at: 0, share: -1 };
  return { cells: Number(m[1]), at: Number(m[2]), share: Number(m[3]) };
}

/** 지금 포커스가 어디인가. 「포커스 유실」(05 §9)을 재는 자다. */
export const focusPath = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (el === null) return 'null';
    const cls = typeof el.className === 'string' && el.className !== '' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
    return `${el.tagName.toLowerCase()}${cls}`;
  });

/** 포커스가 이 선택자 안에 있나. */
export const focusWithin = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((sel) => document.activeElement?.closest(sel) !== null && document.activeElement !== null, selector);

/**
 * 시나리오 15 — 마우스 0회 (05 §11 「`page.mouse` 금지 픽스처」).
 *
 * 두 겹으로 막는다. ① `page.mouse`·`page.click` 류를 손대면 그 자리에서 던진다.
 * ② 페이지 안에서 **실제로 온 포인터 이벤트**를 센다 — `locator.click()` 은 `page.mouse`
 * 를 거치지 않지만 CDP 가 보낸 이벤트는 `isTrusted` 라 여기 걸린다. 끝에 0 이 아니면 실패다.
 *
 * `click` 은 세지 않는다. 단추 위에서 `Enter` 를 누르면 브라우저가 **신뢰된** `click` 을
 * 스스로 만들어 내므로(키보드 활성화) 그것까지 세면 키보드 주행이 마우스로 잡힌다.
 * 포인터가 실제로 움직였는지는 `pointerdown`·`mousedown`·`mousemove` 가 말한다.
 */
export const keyboardOnly = test.extend<{ mouseFree: void }>({
  mouseFree: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        const win = window as unknown as { __mouse: number };
        win.__mouse = 0;
        for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'mousemove']) {
          window.addEventListener(
            type,
            (e) => {
              if (e.isTrusted) win.__mouse += 1;
            },
            true,
          );
        }
      });

      const bomb = (): never => {
        throw new Error('시나리오 15 는 마우스를 쓰지 않는다 (05 §11 — `page.mouse` 금지 픽스처)');
      };
      Object.defineProperty(page, 'mouse', { configurable: true, get: bomb });
      for (const name of ['click', 'dblclick', 'hover', 'tap', 'dragAndDrop']) {
        Object.defineProperty(page, name, { configurable: true, value: bomb });
      }

      await use();

      const used = await page.evaluate(() => (window as unknown as { __mouse: number }).__mouse);
      expect(used, '포인터 이벤트가 한 번도 없어야 한다 (05 §11 시나리오 15)').toBe(0);
    },
    { auto: true },
  ],
});

/**
 * 이 엔진에서 「다음 요소로」인 키.
 *
 * WebKit 은 macOS Safari 의 기본값을 그대로 따른다 — 「모든 항목에 Tab 으로 이동」이 꺼져
 * 있으면 `Tab` 은 폼 필드만 돌고 단추·링크는 건너뛴다(실측: 홈에서 `Tab` 12번에 포커스가
 * `body` 에서 움직이지 않는다). 그 상태에서 모든 요소를 도는 키가 `Option+Tab` 이다.
 * 브라우저 기본 설정이지 앱의 결함이 아니지만, 기준 엔진이 WKWebView 라는 점에서
 * 실사용에 남는 문제다(보고 참조).
 */
const tabKey = (page: Page): string =>
  page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';

/**
 * 포커스를 원하는 자리로 **탭으로만** 옮긴다. 시나리오 15 의 유일한 이동 수단이다.
 * 못 닿으면 던진다 — 「닿을 수 없는 조작」이 곧 키보드 완결성의 실패다.
 */
export async function tabTo(page: Page, selector: string, limit = 40): Promise<void> {
  const key = tabKey(page);
  for (let i = 0; i < limit; i += 1) {
    if (await page.evaluate((sel) => document.activeElement?.matches(sel) === true, selector)) return;
    await page.keyboard.press(key);
  }
  throw new Error(`${key} 로 ${selector} 에 닿지 못했다 (${limit}번 눌렀다)`);
}

/** 리포를 0개로 만든다 — 첫 실행 화면(빈 상태)에서 시작해야 하는 시나리오가 쓴다. */
export function wipeRepos(db: import('better-sqlite3').Database): void {
  db.pragma('foreign_keys = OFF');
  for (const table of [
    'gap', 'lifer', 'review_log', 'session_item', 'session', 'card_state', 'card_concept', 'card',
    'block', 'import_edge', 'concept_site', 'unit_node', 'unit_file', 'unit', 'capture', 'file',
    'commit_file', 'git_commit', 'ingest_run', 'repo',
  ]) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
  db.pragma('foreign_keys = ON');
}
