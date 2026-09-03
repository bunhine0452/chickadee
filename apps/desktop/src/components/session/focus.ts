/**
 * 포커스를 옮기고 **실제로 옮겨졌는지 확인한다** (05 §9 「포커스 유실」).
 *
 * WKWebView 는 macOS 의 「모든 항목에 Tab 이동」이 꺼져 있으면 `<button>` 을 포커스 대상으로
 * 보지 않는다 — `el.focus()` 가 조용히 아무 일도 하지 않고 `activeElement` 가 `<body>` 로
 * 남는다. 기준 엔진이 WKWebView 이므로(05 §11) 그 자리에서 게이트가 깨진다.
 *
 * 그래서 두 걸음이다: 원하는 자리로 옮겨 보고, 안 먹으면 `tabindex="-1"` 을 가진 문맥
 * (교정쇄 오버레이·홈 뿌리)으로 물러선다. `tabindex="-1"` 요소는 세 엔진 모두에서
 * 프로그램 포커스를 받는다.
 */
export function focusOrFallback(target: Element | null, fallbackSelector: string): void {
  if (target instanceof HTMLElement) target.focus();
  if (document.activeElement !== null && document.activeElement !== document.body) return;
  document.querySelector<HTMLElement>(fallbackSelector)?.focus();
}
