/**
 * 02 §3.3 의 검산. 표의 다섯 줄에 R1(하루 최대 +1)을 더한 여섯이며,
 * 이 여섯이 M2 의 「끝났다는 증거」 중 하나다 (00 §5).
 */
import { describe, expect, test } from 'vitest';

import type { DayKey, Layer } from '@chickadee/store-sql';

import { EARLY_GRACE_MS, applyOutcome, beginDay, step, type LayerState } from './reducer.js';

const DAY = '2026-09-03' as DayKey;
const YESTERDAY = '2026-09-02' as DayKey;
/** 2026-09-03 09:00 UTC. */
const NOW = 1_772_701_200_000;
const DAY_MS = 86_400_000;

function mastery(patch: Partial<LayerState> = {}): LayerState {
  return {
    layer: 0,
    dayKey: null,
    dayStartLayer: 0,
    dayCeiling: 0,
    firstOkAt: null,
    lastOkDay: null,
    dueAt: null,
    ...patch,
  };
}

/** 만기가 지난 2겹 개념 — 「자격 있음」의 표준 모양. */
const due2 = (): LayerState =>
  mastery({ layer: 2, firstOkAt: NOW - 30 * DAY_MS, lastOkDay: YESTERDAY, dueAt: NOW - DAY_MS });

describe('02 §3.3 검산', () => {
  test('① 2겹·만기 → 정답이면 3겹', () => {
    const r = step(due2(), 'ok', NOW, DAY);
    expect([r.before, r.after]).toEqual([2, 3]);
    expect(r.early).toBe(false);
  });

  test('② 오답이면 2겹 그대로, 같은 날 다시 찍기 정답도 2겹', () => {
    const wrong = step(due2(), 'wrong', NOW, DAY);
    expect(wrong.after).toBe(2);
    const retry = step(wrong.next, 'ok', NOW + 60_000, DAY);
    expect(retry.after).toBe(2); // R3 — 천장이 현재 겹으로 내려갔다
  });

  test('③ 모르겠어요면 1겹, 같은 날 다시 찍기 정답은 2겹까지만 (제자리)', () => {
    const dunno = step(due2(), 'dunno', NOW, DAY);
    expect(dunno.after).toBe(1);
    const retry = step(dunno.next, 'ok', NOW + 60_000, DAY);
    expect(retry.after).toBe(2); // R4 — 잃은 겹의 회복만, 3겹으로는 못 간다
  });

  test('④ 0겹 새 판에 모르겠어요면 0겹, 다시 찍기 정답은 1겹 + 첫 성공', () => {
    const dunno = step(mastery(), 'dunno', NOW, DAY);
    expect(dunno.after).toBe(0);
    expect(dunno.firstOk).toBe(false);
    const retry = step(dunno.next, 'ok', NOW + 60_000, DAY);
    expect(retry.after).toBe(1); // R5 — 오답·모르겠어요 뒤에도 첫 겹은 찍힌다
    expect(retry.firstOk).toBe(true); // LIFER
  });

  test('⑤ 3겹을 만기 5일 전에 수동 인쇄해 맞히면 3겹 유지 + early', () => {
    const m = mastery({
      layer: 3,
      firstOkAt: NOW - 90 * DAY_MS,
      lastOkDay: YESTERDAY,
      dueAt: NOW + 5 * DAY_MS,
    });
    const r = step(m, 'ok', NOW, DAY);
    expect(r.after).toBe(3);
    expect(r.early).toBe(true);
  });

  test('⑥ R1 — 한 개념은 하루에 최대 +1', () => {
    const first = step(due2(), 'ok', NOW, DAY);
    expect(first.after).toBe(3);
    const again = step({ ...first.next, lastOkDay: DAY }, 'ok', NOW + 3_600_000, DAY);
    expect(again.after).toBe(3);
    expect(again.early).toBe(false); // 조기가 아니라 하루 상한이다
  });
});

describe('세부 규칙', () => {
  test('만기 12시간 전은 「만기 근처」로 친다 (R2)', () => {
    const base = mastery({ layer: 1, firstOkAt: NOW - DAY_MS, lastOkDay: YESTERDAY });
    const inside = step({ ...base, dueAt: NOW + EARLY_GRACE_MS - 1 }, 'ok', NOW, DAY);
    const outside = step({ ...base, dueAt: NOW + EARLY_GRACE_MS + 1 }, 'ok', NOW, DAY);
    expect(inside.after).toBe(2);
    expect(outside.after).toBe(1);
    expect(outside.early).toBe(true);
  });

  test('그날 첫 접촉에만 천장을 정한다 — 두 번째 호출은 무시된다', () => {
    const started = beginDay(due2(), NOW, DAY);
    expect(started.dayCeiling).toBe(3);
    const lowered = applyOutcome(started, 'wrong');
    expect(lowered.dayCeiling).toBe(2);
    expect(beginDay(lowered, NOW + 60_000, DAY)).toBe(lowered);
  });

  test('흐려짐은 그날 첫 접촉에 저장값으로 물질화된다 (R6)', () => {
    const faded = beginDay(due2(), NOW, DAY, 1 as Layer);
    expect(faded.layer).toBe(1);
    expect(faded.dayStartLayer).toBe(1);
    expect(faded.dayCeiling).toBe(2);
  });

  test('T1 은 3단계를 통과해야 4겹이 된다 (02 §4)', () => {
    const m = beginDay(
      mastery({ layer: 3, firstOkAt: NOW - 90 * DAY_MS, lastOkDay: YESTERDAY, dueAt: NOW - 1 }),
      NOW,
      DAY,
    );
    expect(applyOutcome(m, 'ok', 3).layer).toBe(3);
    expect(applyOutcome(m, 'ok', 4).layer).toBe(4);
  });

  test('겹은 0~4 를 벗어나지 않는다', () => {
    const top = mastery({ layer: 4, firstOkAt: NOW, lastOkDay: YESTERDAY, dueAt: NOW - 1 });
    expect(step(top, 'ok', NOW, DAY).after).toBe(4);
    expect(step(mastery(), 'dunno', NOW, DAY).after).toBe(0);
  });
});
