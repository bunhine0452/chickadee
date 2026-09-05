/**
 * `trace-table` 생성 (D187 ⑱). 재는 것 — 이름 훑기가 **같은 이름의 두 번째 대입**을 잡나 ·
 * 시간 칸이 「직전 읽기」를 남기나 · 예측 모드가 **바뀐 칸만** 가리나.
 *
 * 표본 줄은 `MonggleMonggle` 의 `AuthService.login` 을 실제로 열어 옮긴 것이다
 * (`java-learning.md` §12.5 의 표와 같은 줄). 리포를 읽지 않고 글자만 본다.
 */
import { describe, expect, test } from 'vitest';

import { boundName, buildLadderTrace, pickRows, scanNames } from './trace-table.js';

/** `AuthService.login` 의 창 (`:76`~`:96`). 줄 번호는 표본 리포 그대로다. */
const LOGIN = [
  { n: 76, t: '    public LoginResponse login(LoginRequest request) {' },
  { n: 78, t: '        User user = userDao.findByLoginId(request.getLoginId())' },
  { n: 79, t: '                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));' },
  { n: 82, t: '        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {' },
  { n: 87, t: '        resetDailyCoinIfNeeded(user.getUserId());' },
  { n: 90, t: '        user = userDao.findById(user.getUserId())' },
  { n: 94, t: '        String role = user.getRole() != null ? user.getRole() : "USER";' },
  { n: 95, t: '        String token = jwtUtil.generateToken(user.getUserId(), user.getLoginId(), role);' },
  { n: 106, t: '                .coin(user.getCoin())' },
];

describe('글자로만 보는 선언·대입', () => {
  test('타입이 앞에 오는 선언 · 키워드 선언 · 맨 대입을 다 잡는다', () => {
    expect(boundName('        User user = userDao.findByLoginId(x)')).toBe('user');
    expect(boundName('  const total = a + b;')).toBe('total');
    expect(boundName('        user = userDao.findById(id)')).toBe('user');
    expect(boundName('let xs: number[] = []')).toBe('xs');
  });

  test('비교·호출·반환은 묶는 줄이 아니다', () => {
    expect(boundName('        if (a == b) {')).toBeNull();
    expect(boundName('        resetDailyCoinIfNeeded(user.getUserId());')).toBeNull();
    expect(boundName('        return LoginResponse.of(token);')).toBeNull();
    expect(boundName('    public LoginResponse login(LoginRequest request) {')).toBeNull();
  });
});

describe('이름 훑기 — 같은 이름의 두 번째 대입이 이 형식의 조건이다', () => {
  const names = scanNames(LOGIN);
  const find = (n: string) => names.find((x) => x.name === n);

  test('user 는 두 번 묶인다 — 78 에서 선언, 90 에서 재대입', () => {
    expect(find('user')?.binds).toEqual([
      { line: 78, kind: 'decl' }, { line: 90, kind: 'assign' },
    ]);
  });

  test('role · token 은 한 번 묶이고 뒤에서 읽힌다', () => {
    expect(find('role')?.binds).toHaveLength(1);
    expect(find('role')?.reads).toContain(95);
    expect(find('token')?.binds).toHaveLength(1);
  });

  test('읽는 줄이 이름마다 갈린다 — 87 은 user 를 읽고 값은 안 바꾼다', () => {
    expect(find('user')?.reads).toContain(87);
    expect(find('user')?.reads).toContain(82);
    expect(find('user')?.reads).toContain(106);
  });
});

describe('시간 칸 — 직전 읽기가 이 형식의 요점이다', () => {
  const names = scanNames(LOGIN);
  const cols = ['user', 'role', 'token'].map((n) => names.find((x) => x.name === n)).filter((x) => x !== undefined);

  test('묶는 줄 전부 + 각 묶임의 직전·직후 읽기가 든다', () => {
    const rows = pickRows(cols);
    // 78 선언 · 82 첫 읽기 · **87 직전 읽기** · 90 재대입 · 94·95 선언 · 106 마지막 읽기.
    expect(rows).toContain(78);
    expect(rows).toContain(87);
    expect(rows).toContain(90);
    expect(rows).toContain(94);
    expect(rows).toContain(95);
    expect(rows).toContain(106);
    expect(rows).toEqual([...rows].sort((a, b) => a - b));
  });

  test('여덟 칸을 넘지 않는다 — 한 판이 2분을 넘으면 예산 밖이다', () => {
    expect(pickRows(cols).length).toBeLessThanOrEqual(8);
  });
});

describe('0부 사다리를 시간축으로', () => {
  const cards = buildLadderTrace('java');

  test('걸음마다 한 행이고 열은 값과 타입 둘이다', () => {
    expect(cards.length).toBeGreaterThan(0);
    const first = cards[0];
    expect(first?.kind).toBe('trace');
    expect(first?.stage).toBe(2);
    expect(first?.cols.map((c) => c.k)).toEqual(['c_v', 'c_ty']);
    expect(first?.rows.length).toBeGreaterThanOrEqual(2);
    expect(first?.cells).toHaveLength((first?.rows.length ?? 0) * 2);
  });

  test('예측 모드는 **바뀐 칸만** 가린다 — 안 바뀐 칸은 재료로 남는다', () => {
    for (const card of cards) {
      const carried = card.cells.filter((c) => c.carry !== null);
      const changed = card.cells.filter((c) => c.carry === null);
      expect(new Set(card.hidden)).toEqual(new Set(changed.map((c) => `${c.r}|${c.c}`)));
      for (const cell of carried) expect(card.hidden).not.toContain(`${cell.r}|${cell.c}`);
    }
  });

  test('순수 함수다 — 두 번 부르면 같은 것이 나온다', () => {
    expect(buildLadderTrace('py')).toEqual(buildLadderTrace('py'));
  });
});
