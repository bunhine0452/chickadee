/**
 * 06 §2 디자인 품질 게이트 — 활자 하한 · 대비 · 본문 행 길이 · 16px 실루엣 · 모션 상한.
 *
 * 재는 코드는 앱 안(`devtools/gates.ts`)에 있고 여기서는 **화면을 열어 부르기만** 한다.
 * 06 §2 가 정한 순회는 홈 · T0 · T1 · T2 · 요약 · 야간반 여섯이다. `fixtures/ipc/tiny` 로
 * 열리지 않는 둘(T1 · T2)은 사유를 이름에 달아 건너뛴다 — 없는 커버리지를 만들지 않는다.
 */
import { test, expect } from '../support/fixture.js';
import type { Page } from '@playwright/test';

import {
  T1_SKIP, T2_SKIP, allowedBySel, closeLifer, deeSilhouette, gotoDev, loadAllow, motionOver,
  runGates, startSession, submit, toNight, toSummary, answerKey,
} from '../support/gates.js';
import type { AppDb } from '../support/app-db.js';

const contrastAllow = loadAllow('contrast.allow.json').entries;
const measureAllow = loadAllow('measure.allow.json').entries;

/** 06 §2 여섯 화면 중 tiny 시드로 실제로 서는 넷. 여는 손은 전부 키보드다. */
const SCREENS: Array<{ name: string; open: (page: Page, app: AppDb) => Promise<void> }> = [
  { name: '홈', open: async (page) => { await gotoDev(page); } },
  {
    name: 'T0 교정지',
    open: async (page) => {
      await gotoDev(page);
      await startSession(page);
    },
  },
  {
    name: '요약',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      await submit(page, answerKey(app));
      await closeLifer(page);
      await toSummary(page, app);
    },
  },
  {
    name: '야간반',
    open: async (page) => {
      await gotoDev(page);
      await toNight(page);
    },
  },
];

for (const screen of SCREENS) {
  test(`${screen.name} — 활자 하한 13px`, async ({ page, app }) => {
    await screen.open(page, app);
    const report = await runGates(page);
    // 「검사 0건」은 통과가 아니다 — 화면이 안 그려진 것이다.
    expect(report.fonts.checked).toBeGreaterThan(10);
    expect(report.fonts.below13, JSON.stringify(report.fonts.below13, null, 1)).toEqual([]);
  });

  test(`${screen.name} — 대비 종이 7:1 · 잉크 배지 4.5:1`, async ({ page, app }) => {
    await screen.open(page, app);
    const { contrast } = await runGates(page);
    expect(contrast.checked).toBeGreaterThan(10);

    const paper = contrast.paper.below7.filter((r) => !allowedBySel(contrastAllow, r.sel));
    const ink = contrast.onInk.below45.filter((r) => !allowedBySel(contrastAllow, r.sel));
    expect(paper, JSON.stringify(paper, null, 1)).toEqual([]);
    expect(ink, JSON.stringify(ink, null, 1)).toEqual([]);
  });

  test(`${screen.name} — 본문 행 길이 ko 30~45 (.note 는 하한 22)`, async ({ page, app }) => {
    await screen.open(page, app);
    const report = await runGates(page);
    // 잰 것이 0건이면 위반도 0건이라 게이트가 소리 없이 통과한다 — 로케일이 어긋나
    // 본문 판정 기준(`hasBody`)에 아무것도 안 걸릴 때가 그 자리다.
    expect(report.measure.length, '행 길이를 잰 요소가 0건이다 — 로케일을 확인하라')
      .toBeGreaterThan(0);
    const bad = report.measureViolations.filter((r) => !allowedBySel(measureAllow, r.sel));
    expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
  });
}

test.skip(`T1 클론 코딩 — 건너뜀: ${T1_SKIP}`, () => {});
test.skip(`T2 구조 — 건너뜀: ${T2_SKIP}`, () => {});

test('16px 실루엣 — 캡–뺨–턱받이 3단 열 ≥ 2 · 뺨 띠 ≥ 2px', async ({ page, app: _app }) => {
  await gotoDev(page);
  const r = await deeSilhouette(page, 16, 4);
  // 실패했을 때 사람이 보는 것은 숫자가 아니라 래스터다.
  expect(r.pass, `3단 열 ${r.bandCols} · 뺨 ${r.cheekPx}px\n${r.ascii}`).toBe(true);
  expect(r.bandCols).toBeGreaterThanOrEqual(2);
  expect(r.cheekPx).toBeGreaterThanOrEqual(2);
});

/**
 * 06 §2 가 고정한 4건 — `#deeHead` 와 배지 24 · 32px. 16px 만 보면 큰 크기에서 판이
 * 뭉개지는 것을 놓친다.
 */
test('실루엣 — 24 · 32px 배지도 3단이 산다', async ({ page, app: _app }) => {
  await gotoDev(page);
  for (const size of [24, 32]) {
    const r = await deeSilhouette(page, size, 4);
    expect(r.pass, `${size}px · 3단 열 ${r.bandCols} · 뺨 ${r.cheekPx}px\n${r.ascii}`).toBe(true);
  }
});

/**
 * 모션 상한 720ms (06 §2). **정적 전수는 `scripts/check-motion.mjs` 가 이미 본다** —
 * 여기서 보는 것은 그 파서가 볼 수 없는 것이다: 계산된 값, 인라인 스타일, 단축 속성의 조합.
 * LIFER(1.36s)와 `peek`(1.6s × 2, D11)는 문서가 올린 예외라 선택자로 뺀다.
 */
const MOTION_EXEMPT = ['.dee.lifer', '.dee.peek', '.lifer-veil', '.lifer-veil *'];

for (const screen of SCREENS) {
  test(`${screen.name} — 모션 상한 720ms`, async ({ page, app }) => {
    await screen.open(page, app);
    const over = await motionOver(page, 720, MOTION_EXEMPT);
    expect(over, JSON.stringify(over, null, 1)).toEqual([]);
  });
}
