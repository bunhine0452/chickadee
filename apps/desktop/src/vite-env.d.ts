/// <reference types="vite/client" />

/**
 * WKWebView 실측 하네스 스위치 (`vite.config.ts` 의 `define`). 리터럴이라 빌드 때 접힌다 —
 * 켜지 않으면 하네스 코드가 번들에 들어가지 않는다.
 */
declare const __PERF__: boolean;
