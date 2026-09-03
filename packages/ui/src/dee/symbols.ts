/** 심볼 3종. `#logo` 는 브랜드 마크라 `Dee` 가 아니라 `DeeLogo` 가 그린다. */
export type DeeSymbol = 'badge' | 'bird' | 'head';

/** 심볼 이름 → 스프라이트의 `<symbol id>`. */
export const SYMBOL_ID: Readonly<Record<DeeSymbol, string>> = {
  badge: 'dee',
  bird: 'deeBird',
  head: 'deeHead',
};
