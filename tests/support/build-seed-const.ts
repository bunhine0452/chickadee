/**
 * 굽는 쪽과 여는 쪽이 나눠 갖는 상수만. `build-seed.ts` 는 Vite 전용 코드를 끌고 오므로
 * Playwright 쪽에서 import 할 수 없다 — 그래서 상수만 여기로 뺐다 (D108).
 */
/** 고정 시각 — 큐와 시각 회귀가 날짜에 흔들리지 않게 (06 §1.9-4). */
export const NOW = 1_772_755_200_000;
export const TZ = 'Asia/Seoul';
/** 구운 시드가 놓이는 자리. 생성물이라 커밋하지 않는다. */
export const SEED_PATH = '.seed/ui.sqlite';
