/**
 * Playwright 하네스 (D108 · 06 §2). `test` 를 확장해 앱 한 판을 띄운다.
 *
 * 다리: 페이지의 `window.__ipc` → `page.exposeFunction` → Node 의 `better-sqlite3`.
 * 시드는 워커마다 하나이고 테스트마다 새로 만든다 — 한 테스트가 큐를 소모하면
 * 다음 테스트의 홈이 달라진다.
 */
import { test as base, expect } from '@playwright/test';

import { makeAppDb, type AppDb } from './app-db.js';
import { installInternals } from './internals.js';

export interface AppFixture {
  /** 시드된 DB. 화면 밖 사실을 확인할 때만 쓴다. */
  app: AppDb;
}

export const test = base.extend<AppFixture>({
  app: async ({ page }, use) => {
    const app = makeAppDb();
    await page.exposeFunction('__ipc', (cmd: string, args: Record<string, unknown>) => {
      try {
        return { ok: app.handle(cmd, args) };
      } catch (e) {
        // 오류는 `IpcError` 모양으로 건너간다 (01 §6) — 그래야 `toIpcError` 가 읽는다.
        const code = (e as { code?: string }).code ?? 'UNKNOWN';
        return { err: { code, message: String((e as Error).message), detail: null, retryable: false } };
      }
    });
    await page.addInitScript(installInternals);
    // `exposeFunction` 이 준 것은 `{ok}|{err}` 를 감싼 값이다 — 다리에서 풀어 준다.
    await page.addInitScript(() => {
      type Wrapped = { ok?: unknown; err?: unknown };
      const win = window as unknown as { __ipc: (cmd: string, args: unknown) => Promise<unknown> };
      const raw = win.__ipc.bind(win);
      win.__ipc = async (cmd: string, args: unknown) => {
        const r = (await raw(cmd, args)) as Wrapped;
        if (r.err !== undefined) throw r.err;
        return r.ok;
      };
    });
    await use(app);
    app.close();
  },
});

export { expect };

/** 홈이 그려질 때까지. 첫 프레임에는 아무것도 없다 (`aria-busy`). */
export async function waitForHome(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.locator('main.shell:not([aria-busy="true"]), .masthead').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}
