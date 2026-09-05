/**
 * 줄기 행 → 문항의 `Hop` (D172 ②). 저장이 버린 `calledAt.path` 가 깊이로 되살아나는지,
 * 등뼈의 줄이 「다음 칸을 부른 줄」인지 본다.
 */
import { describe, expect, test } from 'vitest';

import { hopRanges, mergeRanges, toMethodHops, trunkHops, type HopRow } from './hops.js';

const V = 'FRONT/src/views/LandingView.vue';
const S = 'FRONT/src/services/authService.js';
const C = 'BACK/src/main/java/x/controller/AuthController.java';
const A = 'BACK/src/main/java/x/service/AuthService.java';
const D = 'BACK/src/main/java/x/dao/UserDao.java';
const M = 'BACK/src/main/resources/mapper/UserMapper.xml';
const J = 'BACK/src/main/java/x/security/JwtUtil.java';

/** 실측 로그인 줄기를 줄인 것 — 서비스가 DAO 를 부른 뒤 곁가지로 JwtUtil 을 부른다. */
const ROWS: HopRow[] = [
  { ord: 0, path: V, name: 'handleSubmit', line_start: 467, line_end: 515, called_line: null, depth: 0, kind: null },
  { ord: 1, path: S, name: 'login', line_start: 20, line_end: 30, called_line: 504, depth: 1, kind: 'call' },
  { ord: 2, path: C, name: 'login', line_start: 56, line_end: 60, called_line: 21, depth: 2, kind: 'http' },
  { ord: 3, path: A, name: 'login', line_start: 76, line_end: 96, called_line: 58, depth: 3, kind: 'call' },
  { ord: 4, path: D, name: 'findByLoginId', line_start: 17, line_end: 17, called_line: 78, depth: 4, kind: 'call' },
  { ord: 5, path: M, name: 'findByLoginId', line_start: 31, line_end: 35, called_line: 17, depth: 5, kind: 'mapper' },
  { ord: 6, path: J, name: 'generateToken', line_start: 32, line_end: 39, called_line: 95, depth: 4, kind: 'call' },
];

describe('toMethodHops', () => {
  test('부른 칸은 직전의 한 단계 얕은 칸이다 — 곁가지 뒤에서도', () => {
    const hops = toMethodHops(ROWS);
    expect(hops[1]?.calledAt).toEqual({ path: V, line: 504 });
    expect(hops[5]?.calledAt).toEqual({ path: D, line: 17 });
    // JwtUtil 은 DAO 가 아니라 **서비스**가 불렀다(깊이 4 의 앞 칸 중 깊이 3).
    expect(hops[6]?.calledAt).toEqual({ path: A, line: 95 });
    expect(hops[0]?.calledAt).toBeNull();
  });

  test('ord 순서가 흐트러져도 같다', () => {
    const shuffled = [ROWS[3], ROWS[0], ROWS[6], ROWS[1], ROWS[5], ROWS[2], ROWS[4]] as HopRow[];
    expect(toMethodHops(shuffled)).toEqual(toMethodHops(ROWS));
  });
});

describe('trunkHops', () => {
  test('등뼈 = 화면에서 매퍼까지, 줄은 다음 칸을 부른 줄, 마지막은 null', () => {
    const hops = trunkHops(toMethodHops(ROWS));
    expect(hops.map((h) => h.path)).toEqual([V, S, C, A, D, M]);
    expect(hops.map((h) => h.line)).toEqual([504, 21, 58, 78, 17, null]);
    expect(hops.map((h) => h.kind)).toEqual(['static', 'http', 'static', 'static', 'dynamic', null]);
  });

  test('곁가지(JwtUtil)는 등뼈에 없다', () => {
    expect(trunkHops(toMethodHops(ROWS)).some((h) => h.path === J)).toBe(false);
  });

  test('같은 파일이 연달아 오면 한 칸이다', () => {
    const rows: HopRow[] = [
      { ord: 0, path: C, name: 'login', line_start: 56, line_end: 60, called_line: null, depth: 0, kind: null },
      { ord: 1, path: A, name: 'login', line_start: 76, line_end: 96, called_line: 58, depth: 1, kind: 'http' },
      { ord: 2, path: A, name: 'resetCoin', line_start: 100, line_end: 110, called_line: 87, depth: 2, kind: 'call' },
      { ord: 3, path: M, name: 'resetCoin', line_start: 40, line_end: 44, called_line: 105, depth: 3, kind: 'mapper' },
    ];
    const hops = trunkHops(toMethodHops(rows));
    expect(hops.map((h) => h.path)).toEqual([C, A, M]);
    expect(hops[1]?.line).toBe(105);
  });

  test('두 칸이 안 되면 빈 등뼈다', () => {
    expect(trunkHops([])).toEqual([]);
  });
});

describe('hopRanges', () => {
  test('칸의 정의 범위와 부른 줄에 pad 를 더하고, 같은 파일의 겹침을 합친다', () => {
    const ranges = hopRanges([toMethodHops(ROWS)], 2);
    const a = ranges.filter((r) => r.path === A);
    // 76~96 (정의) 와 95(부른 줄)·58 은 컨트롤러의 것. 78·95 는 정의 안이라 합쳐진다.
    expect(a).toEqual([{ path: A, from: 74, to: 98 }]);
    expect(ranges.find((r) => r.path === V)).toEqual({ path: V, from: 465, to: 517 });
  });

  test('mergeRanges 는 맞닿은 범위도 합친다', () => {
    expect(mergeRanges([{ path: 'a', from: 1, to: 3 }, { path: 'a', from: 4, to: 6 }, { path: 'a', from: 9, to: 9 }]))
      .toEqual([{ path: 'a', from: 1, to: 6 }, { path: 'a', from: 9, to: 9 }]);
  });
});
