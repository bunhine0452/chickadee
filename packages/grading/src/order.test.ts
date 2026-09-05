/**
 * `order` 채점 (D187 ⑱). 재는 것 셋 — **인접 쌍 비율** · **부분 점수** · **계산된 진단**.
 *
 * 진단이 이 형식의 값이다. 「틀렸습니다」가 아니라 「B 가 A 보다 먼저다 — 그 줄이 B 를 부른다」가
 * 나와야 하고, 그 문장이 **카드가 든 사실**에서 나왔지 사람이 적은 것이 아니어야 한다.
 */
import { describe, expect, test } from 'vitest';

import { gradeOrder, type OrderGradeInput } from './order.js';

const piece = (id: string, fact: string) => ({ id, t: id, fact });

/** 로그인 줄기 다섯 칸 — `chapter-login.md` 2-1 의 반쪽. */
const item: OrderGradeInput = {
  pieces: [
    piece('authService.js:21', 'authService.js:21 이 AuthController.java 를 HTTP 요청으로 부릅니다'),
    piece('AuthController.java:56', 'AuthController.java:56 이 AuthService.java 를 직접 호출로 부릅니다'),
    piece('AuthService.java:78', 'AuthService.java:78 이 UserDao.java 를 직접 호출로 부릅니다'),
    piece('UserDao.java:17', 'UserDao.java:17 이 UserMapper.xml 을 이름으로 묶인 호출로 부릅니다'),
    piece('UserMapper.xml', '여기서 더 부르는 곳이 없습니다 — 줄기의 끝입니다'),
  ],
  answer: [
    'authService.js:21', 'AuthController.java:56', 'AuthService.java:78', 'UserDao.java:17', 'UserMapper.xml',
  ],
  ok: '순서가 맞습니다.',
  rule: '규칙 — 순서는 부르는 자리에서 읽습니다.',
};

describe('인접 쌍 비율 (hop 채점 재사용)', () => {
  test('그대로 세우면 100 이고 통과다', () => {
    const v = gradeOrder(item, item.answer);
    expect(v).toMatchObject({ ok: true, pct: 100, hit: 4, total: 4 });
    expect(v.misses).toEqual([]);
    expect(v.okText).toBe(item.ok);
    expect(v.diagnosis).toBeNull();
  });

  test('한 쌍만 뒤집으면 부분 점수다 — 0 이 아니다', () => {
    // 마지막 둘을 바꾸면 붙은 쌍 넷 중 셋이 남는다(…:78→xml · xml→:17 이 깨진다).
    const v = gradeOrder(item, [
      'authService.js:21', 'AuthController.java:56', 'AuthService.java:78', 'UserMapper.xml', 'UserDao.java:17',
    ]);
    expect(v.ok).toBe(false);
    expect(v.hit).toBe(2);
    expect(v.pct).toBe(50);
  });

  test('완전히 뒤집으면 0 이다', () => {
    const v = gradeOrder(item, [...item.answer].reverse());
    expect(v.pct).toBe(0);
    expect(v.misses).toHaveLength(4);
  });

  test('결정론 — 같은 답이면 언제나 같은 값이다', () => {
    const a = gradeOrder(item, ['AuthController.java:56', 'authService.js:21', 'AuthService.java:78']);
    const b = gradeOrder(item, ['AuthController.java:56', 'authService.js:21', 'AuthService.java:78']);
    expect(a).toEqual(b);
  });

  test('조각이 둘 미만이면 셀 쌍이 없어 0 이고 통과가 아니다', () => {
    const v = gradeOrder({ ...item, answer: ['x'], pieces: [piece('x', 'f')] }, ['x']);
    expect(v).toMatchObject({ ok: false, pct: 0, total: 0 });
  });
});

describe('진단은 재료의 사실에서 계산된다 (정본 §3-2)', () => {
  test('틀린 쌍마다 「먼저인 쪽의 사실」이 실린다', () => {
    const v = gradeOrder(item, [
      'AuthController.java:56', 'authService.js:21', 'AuthService.java:78', 'UserDao.java:17', 'UserMapper.xml',
    ]);
    const first = v.misses[0];
    expect(first?.first).toBe('authService.js:21');
    // 사람이 적은 해설이 아니라 조각의 `fact` 가 그대로 문장에 든다.
    expect(first?.text).toContain('HTTP 요청으로 부릅니다');
    expect(first?.text).toContain('authService.js:21');
    expect(v.diagnosis).toBe(first?.text);
  });

  test('정답에 없는 조각이 섞이면 자리만 말한다 — 사실이 없으므로', () => {
    const v = gradeOrder(item, ['authService.js:21', 'WebConfig.java:22']);
    expect(v.misses[0]?.first).toBeNull();
    expect(v.misses[0]?.text).toContain('WebConfig.java:22');
  });

  test('세운 것이 없으면 진단이 그 사실을 말한다', () => {
    const v = gradeOrder(item, []);
    expect(v.ok).toBe(false);
    expect(v.diagnosis).not.toBeNull();
  });
});
