// 건네는 값이 없다 — 부른 쪽은 아무것도 받지 못한다.
export function trackView(store: { views: number }) {
  store.views = 0;
}
