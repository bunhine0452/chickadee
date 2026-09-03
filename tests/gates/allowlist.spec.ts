/**
 * 06 §2 — allowlist 항목은 **만료일 필수**(최대 90일). 「만료 없는 예외 목록은 6개월 뒤
 * 규칙 자체를 무력화한다」가 그 이유다.
 *
 * 만료를 강제하는 것이 이 파일이다. 브라우저를 쓰지 않지만 게이트 묶음 안에 둔다 —
 * 예외 목록은 게이트의 일부지 별도 잡이 아니고, 따로 두면 아무도 안 돌린다.
 */
import { test, expect } from '@playwright/test';

import {
  ALLOW_MAX_DAYS, expired, expiryMs, loadAllow, overlong, type AllowEntry,
} from '../support/gates.js';

const FILES = ['contrast.allow.json', 'measure.allow.json', 'axe.allow.json'] as const;

for (const file of FILES) {
  const { $why, entries } = loadAllow(file);

  test(`${file} — 파일이 스스로 무엇인지 말한다`, () => {
    expect($why.length, '`$why` 가 비어 있으면 다음 사람이 규격을 못 읽는다').toBeGreaterThan(20);
  });

  test(`${file} — 항목마다 선택자(또는 규칙 id) · 사유 · 만료일이 있다`, () => {
    const broken = entries.filter((e) => (e.sel === undefined && e.rule === undefined)
      || (e.why ?? '').trim().length < 10
      || !/^\d{4}-\d{2}-\d{2}$/.test(e.expires ?? ''));
    expect(broken, JSON.stringify(broken, null, 1)).toEqual([]);
  });

  test(`${file} — 만료된 항목이 없다`, () => {
    // 06 §1.9-4 의 고정 날짜를 여기 쓰면 예외가 영원히 살아 있다 — 실제 시계로 잰다.
    const dead = expired(entries).map((e) => `${e.sel ?? e.rule ?? '?'} (만료 ${e.expires})`);
    expect(dead, `만료된 예외는 되살리거나 화면을 고쳐야 한다:\n${dead.join('\n')}`).toEqual([]);
  });

  test(`${file} — 만료일이 ${ALLOW_MAX_DAYS}일보다 멀지 않다`, () => {
    const far = overlong(entries).map((e) => `${e.sel ?? e.rule ?? '?'} (만료 ${e.expires})`);
    expect(far, `상한이 없으면 「2099-12-31」로 규칙을 끌 수 있다:\n${far.join('\n')}`).toEqual([]);
  });
}

/**
 * 검사기 자체. 예외가 만료돼도 게이트가 통과한다면 만료일은 장식이다 —
 * 그것을 여기서 못박는다.
 */
test('만료 검사기 — 어제 만료된 항목은 잡히고 내일 만료는 살아 있다', () => {
  const now = Date.parse('2026-09-03T09:00:00Z');
  const at = (iso: string): AllowEntry => ({ sel: '.x', why: '검사기 시험용 항목이다', expires: iso });

  expect(expired([at('2026-09-02')], now)).toHaveLength(1);
  // 만료일 당일은 아직 살아 있다 — 그날 아침에 CI 가 갑자기 빨개지지 않게.
  expect(expired([at('2026-09-03')], now)).toHaveLength(0);
  expect(expired([at('2026-09-04')], now)).toHaveLength(0);

  expect(overlong([at('2026-12-02')], now)).toHaveLength(0);
  expect(overlong([at('2027-01-01')], now)).toHaveLength(1);
  // 만료는 그날 끝(UTC)이다 — 시간대에 따라 반나절이 흔들리지 않게 한 곳에서만 정한다.
  expect(expiryMs(at('2026-09-03'))).toBe(Date.parse('2026-09-03T23:59:59Z'));
});

test('만료 검사기 — 날짜 모양이 틀리면 조용히 넘어가지 않는다', () => {
  expect(() => expiryMs({ sel: '.x', why: '검사기 시험용 항목이다', expires: '2026/09/03' }))
    .toThrow(/YYYY-MM-DD/);
});
