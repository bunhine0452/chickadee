/** 트랙 = 판의 종류. 00 §3 용어집의 확정 코드 이름. */
export type Track = 't0' | 't1' | 't2';

/** 잉크 겹 0~4 = 숙련도(`mastery.layer`). 0 빈 판 · 1 회색 스크린 · 2 먹판 · 3 +청판 · 4 +진홍·황판. */
export type InkLayer = 0 | 1 | 2 | 3 | 4;

/** 판정 색 — 트랙 색과 독립 (05 §4.2 · 00 D11). */
export type Verdict = 'exact' | 'equiv' | 'differ';
