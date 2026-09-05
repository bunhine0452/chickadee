/**
 * 06 §2 디자인 품질 게이트 — 활자 하한 · 대비 · 본문 행 길이 · 모션 상한.
 * 실루엣 게이트는 D182 로 사라졌다(마스코트가 화면에 없다).
 *
 * 재는 코드는 앱 안(`devtools/gates.ts`)에 있고 여기서는 **화면을 열어 부르기만** 한다.
 * 06 §2 가 정한 순회는 홈 · T0 · T1 · T2 · 요약 · 야간반 여섯이다. `fixtures/ipc/tiny` 로
 * 열리지 않는 둘(T1 · T2)은 사유를 이름에 달아 건너뛴다 — 없는 커버리지를 만들지 않는다.
 */
import { test, expect } from '../support/fixture.js';
import type { Page } from '@playwright/test';

import {
  T1_SKIP, T2_SKIP, allowedBySel, gotoDev, loadAllow, motionOver, settleLifer,
  runGates, startSession, submit, toNight, toShelf, toSummary, answerKey,
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
      await settleLifer(page);
      await toSummary(page, app);
    },
  },
  {
    name: '어둡게',
    open: async (page) => {
      await gotoDev(page);
      await toNight(page);
    },
  },
  // 06 §2 의 여섯에는 없던 화면이다 (D119). 목업이 없어 조판을 설정 화면에서 빌려 왔고,
  // 빌린 조판이 실제로 규칙 안에 있는지는 여기서만 드러난다.
  {
    name: '서가',
    open: async (page) => {
      await gotoDev(page);
      await toShelf(page);
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

/* 마스코트 실루엣 게이트 둘(16px · 24·32px)은 **지웠다** — D182 가 마스코트를 화면에서
   내렸으므로 잴 대상이 없다. 죽은 게이트를 초록으로 두면 다음 사람이 그 그림이 아직
   화면에 있다고 읽는다. `deeSilhouette` 헬퍼와 `__audit.dee` 도 쓰는 이가 없어졌다. */

/**
 * 모션 상한 720ms (06 §2). **정적 전수는 `scripts/check-motion.mjs` 가 이미 본다** —
 * 여기서 보는 것은 그 파서가 볼 수 없는 것이다: 계산된 값, 인라인 스타일, 단축 속성의 조합.
 * 남은 예외는 `.lifer-note` 하나다 — 첫 기록의 등장 글은 §3.9 의 명시 예외(1.36s)다.
 * `.dee.lifer`·`.dee.peek` 는 D179 로 마스코트 동작 클래스가 삭제되어 가리킬 선택자가 없어 뺐다
 * (`scripts/check-motion.mjs` 의 `EXCEPTIONS` 두 줄도 같은 이유로 죽은 항목이다).
 */
const MOTION_EXEMPT = ['.lifer-note', '.lifer-note *'];

for (const screen of SCREENS) {
  test(`${screen.name} — 모션 상한 720ms`, async ({ page, app }) => {
    await screen.open(page, app);
    const over = await motionOver(page, 720, MOTION_EXEMPT);
    expect(over, JSON.stringify(over, null, 1)).toEqual([]);
  });
}
