/**
 * 브라우저 쪽 IPC 다리 (D108). 페이지가 뜨기 **전에** 심는 초기화 스크립트다 —
 * `@tauri-apps/api/core` 의 `invoke` 가 `window.__TAURI_INTERNALS__` 를 읽으므로
 * 앱 번들이 실행되기 전에 그 자리에 있어야 한다.
 *
 * 여기서 SQL 을 돌리지 않는다. 모든 명령은 `page.exposeFunction` 이 심은
 * `window.__ipc` 로 넘어가 **Node 쪽 `better-sqlite3`** 가 답한다(`app-db.ts`).
 * 왜 브라우저에 SQLite 를 안 넣었는지는 D108 에 적혀 있다 — 요약하면 `sql.js` 는
 * CSP 에 `wasm-unsafe-eval` 을 열어야 하고, 그러면 게이트가 재는 CSP 가 실물과 달라진다.
 *
 * `addInitScript` 는 **문자열로 건너간다** — 이 파일의 스코프를 참조할 수 없어
 * 함수 하나를 통째로 넘긴다.
 */
export function installInternals(): void {
  const callbacks = new Map<number, (data: unknown) => void>();
  let next = 1;
  const listeners = new Map<string, number[]>();

  const win = window as unknown as {
    __ipc: (cmd: string, args: unknown) => Promise<unknown>;
    __TAURI_INTERNALS__: unknown;
    __TAURI_EVENT_PLUGIN_INTERNALS__: unknown;
  };

  // 이벤트 플러그인은 다리를 건너지 않는다 — Rust 가 없으니 보낼 쪽도 없다.
  // `ingest_*` 이벤트는 테스트가 `page.evaluate` 로 직접 `emit` 해 흉내 낸다.
  const emit = (name: string, payload: unknown): void => {
    for (const id of listeners.get(name) ?? []) callbacks.get(id)?.({ event: name, id, payload });
  };

  win.__TAURI_INTERNALS__ = {
    transformCallback(cb: (data: unknown) => void, once: boolean) {
      const id = next++;
      callbacks.set(id, (data) => {
        if (once) callbacks.delete(id);
        cb(data);
      });
      return id;
    },
    unregisterCallback(id: number) {
      callbacks.delete(id);
    },
    convertFileSrc: (path: string) => path,
    metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main' } },
    async invoke(cmd: string, args: Record<string, unknown> | undefined) {
      if (cmd === 'plugin:event|listen') {
        const a = args as { event: string; handler: number };
        listeners.set(a.event, [...(listeners.get(a.event) ?? []), a.handler]);
        return a.handler;
      }
      if (cmd === 'plugin:event|unlisten') return null;
      if (cmd === 'plugin:event|emit') {
        const a = args as { event: string; payload: unknown };
        emit(a.event, a.payload);
        return null;
      }
      // 창 제어는 브라우저에 대응물이 없다. `ipc.win.show()` 가 여기로 온다.
      if (cmd.startsWith('plugin:window|')) return null;
      return win.__ipc(cmd, args ?? {});
    },
  };
  win.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => undefined };
}
