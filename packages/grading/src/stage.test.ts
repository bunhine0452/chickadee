/**
 * 코스 문항 채점 (D164). 판 모양마다 하나씩 — 선택형·요청 줄기·부르는 자리·한 줄 수정·자리 넣기·
 * 되돌리기·재구현·연결 검사·handoff 프롬프트.
 */
import { describe, expect, test } from 'vitest';

import type { CardPayload } from '@chickadee/store-sql';

import { buildHandoffPrompt, checkLinks, checkPlace, declaredName, gradeStage } from './stage.js';

const CHOICE: CardPayload = {
  track: 't3', kind: 'cut', stage: 3, file: 'BACK/src/main/resources/mapper/UserMapper.xml', focus: 35,
  lines: [{ n: 35, t: '  AND deleted_date IS NULL', target: true }],
  q: '35행을 지우면?', hint: 'h',
  options: [{ t: '아무것도 달라지지 않는다' }, { t: '지운 행이 다시 나타난다' }, { t: '컴파일 오류' }, { t: '터진다' }],
  answer: 1,
  why: [{ t: '정상 입력에서는 그렇게 보입니다.' }, null, { t: '문법은 그대로다.' }, { t: '다른 가드다.' }],
  ok: '행은 남아 있습니다.', rule: '가드를 지우면 막던 입력이 통과한다.', promptLines: [],
};

const CONTRACT: CardPayload = {
  ...CHOICE, kind: 'contract',
  reason: { q: '왜?', options: [{ t: '타입' }, { t: 'JSON' }], answer: 1, why: [{ t: '타입은 프로세스 안에서만.' }, null] },
};

const FLOW: CardPayload = {
  track: 't2', kind: 'flow', q: 'q', hint: 'h', bands: [], files: [], edges: [], core: {}, sec: {}, trap: { 'c.js:9': '함정' },
  hints: [], flow: { answer: ['a.js:1', 'b.java:2', 'c.xml'], deck: ['a.js:1', 'b.java:2', 'c.js:9', 'c.xml'] },
};

const RADIUS: CardPayload = {
  track: 't2', kind: 'radius', q: 'q', hint: 'h', bands: [], files: [], edges: [], hints: [],
  core: { 'svc.java': ['', '부른다'] }, sec: {}, trap: { 'util.java': '반대다' },
};

const repair = (over: Partial<Extract<CardPayload, { kind: 'repair' }>>): CardPayload => ({
  track: 't3', kind: 'repair', type: 'patch-line', stage: 4, q: '85행을 고쳐 보세요.', file: 'BACK/x/AuthService.java', grammar: 'java',
  goal: 'role 값 추가', commit: { h: 'dc37666', d: '2025-12-20', m: 'role 값 추가' },
  lines: ['int a = 1;', 'String role = "USER";', 'use(role);'], from: 84, target: 1,
  expected: ['String role = user.getRole();'], promptLines: [], ...over,
});

describe('선택형', () => {
  test('정답이면 ok · 오답이면 그 보기의 진단', () => {
    expect(gradeStage(CHOICE, { kind: 'choice', sel: 1 })).toMatchObject({ ok: true, pct: 100, diagnosis: null, okText: '행은 남아 있습니다.' });
    expect(gradeStage(CHOICE, { kind: 'choice', sel: 0 })).toMatchObject({ ok: false, pct: 0, diagnosis: '정상 입력에서는 그렇게 보입니다.' });
  });

  test('contract — 자리와 이유를 둘 다 맞혀야 한다', () => {
    expect(gradeStage(CONTRACT, { kind: 'choice', sel: 1, reasonSel: 1 }).ok).toBe(true);
    const half = gradeStage(CONTRACT, { kind: 'choice', sel: 1, reasonSel: 0 });
    expect(half.ok).toBe(false);
    expect(half.pct).toBe(50);
    expect(half.diagnosis).toBe('타입은 프로세스 안에서만.');
  });

  test('답 모양이 다르면 wrong-shape', () => {
    expect(gradeStage(CHOICE, { kind: 'order', ordered: [] }).detail.kind).toBe('wrong-shape');
  });
});

describe('2단 · 전부 맞아야 통과', () => {
  test('hop — 순서를 다 맞히면 통과, 하나만 틀려도 진단이 붙는다', () => {
    expect(gradeStage(FLOW, { kind: 'order', ordered: ['a.js:1', 'b.java:2', 'c.xml'] }).ok).toBe(true);
    const partial = gradeStage(FLOW, { kind: 'order', ordered: ['a.js:1', 'c.js:9', 'b.java:2', 'c.xml'] });
    expect(partial.ok).toBe(false);
    expect(partial.diagnosis).toContain('%');
  });

  test('caller — 부르는 쪽을 다 짚고 함정을 안 짚어야 통과', () => {
    expect(gradeStage(RADIUS, { kind: 'picks', selected: ['svc.java'] }).ok).toBe(true);
    expect(gradeStage(RADIUS, { kind: 'picks', selected: ['svc.java', 'util.java'] }).ok).toBe(false);
  });
});

describe('4단 · 수정', () => {
  test('patch-line — 참조 답과 같은 뜻이면 통과 (따옴표·공백 차이는 동등)', () => {
    const card = repair({});
    expect(gradeStage(card, { kind: 'lines', lines: ['int a = 1;', 'String role = user.getRole();', 'use(role);'] }).ok).toBe(true);
    expect(gradeStage(card, { kind: 'lines', lines: ['int a = 1;', 'String role  =  user.getRole( );', 'use(role);'] }).ok).toBe(true);
    const wrong = gradeStage(card, { kind: 'lines', lines: ['int a = 1;', 'String role = "ADMIN";', 'use(role);'] });
    expect(wrong.ok).toBe(false);
    expect(wrong.diagnosis).toContain('참조 답과 다릅니다');
    expect(gradeStage(card, { kind: 'lines', lines: ['int a = 1;', '', 'use(role);'] }).diagnosis).toContain('비어');
  });

  test('checkPlace — 만드는 줄 뒤 · 쓰는 줄 앞이면 정답, 아니면 이유가 붙는다', () => {
    const lines = ['User user = find(id);', 'log(id);', 'String token = sign(user);', 'return token;'];
    // `reset(user.getId());` 는 user 뒤, 그리고 아무도 안 쓰는 이름을 안 만든다 — 1·2·3 이 다 된다.
    expect(checkPlace(lines, 'reset(user.getId());', 1, 1)).toEqual({ ok: true, reason: 'exact' });
    expect(checkPlace(lines, 'reset(user.getId());', 2, 1)).toEqual({ ok: true, reason: 'scope-ok' });
    expect(checkPlace(lines, 'reset(user.getId());', 0, 1)).toEqual({ ok: false, reason: 'before-decl', name: 'user', line: 0 });
    // `String role = ...;` 를 넣는데 그 뒤 줄이 role 을 쓴다면 그보다 앞이어야 한다.
    const uses = ['User user = find(id);', 'String token = sign(user, role);'];
    expect(checkPlace(uses, 'String role = "USER";', 2, 1)).toEqual({ ok: false, reason: 'after-use', name: 'role', line: 1 });
    // 이름이 하나도 안 걸리면 원래 자리만 정답이다.
    expect(checkPlace(['a();', 'b();'], 'c();', 0, 1)).toEqual({ ok: false, reason: 'off', line: 1 });
    expect(declaredName('final Optional<User> u = x;')).toBe('u');
    expect(declaredName('count = 3')).toBe('count');
    expect(declaredName('if (a == b)')).toBeNull();
  });

  test('patch-place 카드 — 진단문이 파일 줄 번호를 말한다', () => {
    const card = repair({ type: 'patch-place', lines: ['User user = find(id);', 'log(id);', 'return user;'], target: 1, expected: ['reset(user.getId());'], from: 84 });
    expect(gradeStage(card, { kind: 'place', at: 1 }).ok).toBe(true);
    const early = gradeStage(card, { kind: 'place', at: 0 });
    expect(early.ok).toBe(false);
    expect(early.diagnosis).toContain('84행');
    expect(gradeStage(card, { kind: 'lines', lines: [] }).detail.kind).toBe('wrong-shape');
  });

  test('rollback — 창 전체를 이전 모양과 견준다 (T1 사다리)', () => {
    const before = ['    int reset = userDao.resetDailyCoin(userId);', '    if (reset > 0) { log.info("reset"); }', '    return UserInfo.of(user);'];
    const card = repair({ type: 'rollback', lines: ['    resetDailyCoinIfNeeded(userId);', '    return UserInfo.of(user);'], target: 0, expected: before });
    expect(gradeStage(card, { kind: 'lines', lines: before }).ok).toBe(true);
    expect(gradeStage(card, { kind: 'lines', lines: ['    return UserInfo.of(user);'] }).ok).toBe(false);
  });
});

describe('5단 · 재구현', () => {
  const reimpl = (over: Partial<Extract<CardPayload, { kind: 'reimpl' }>>): CardPayload => ({
    track: 't3', kind: 'reimpl', type: 'reimpl-spec', stage: 5, file: 'BACK/src/main/java/com/x/security/JwtUtil.java',
    grammar: 'java', fn: 'generateToken', from: 28,
    original: ['public String generateToken(Long userId) {', '    Date now = new Date();', '    return build(userId, now);', '}'],
    signature: ['public String generateToken(Long userId) {'], mustHold: [], links: [], context: [],
    question: '«generateToken» 의 본문을 써 보세요.', promptLines: ['a', 'b', 'c'], blockId: 11, ...over,
  });

  test('reimpl-spec — 원본과 동등하면 통과', () => {
    const card = reimpl({});
    const same = gradeStage(card, { kind: 'lines', lines: ['public String generateToken(Long userId) {', '    Date now = new Date();', '    return build(userId, now);', '}'] });
    expect(same.ok).toBe(true);
    expect(same.pct).toBe(100);
    expect(gradeStage(card, { kind: 'lines', lines: ['public String generateToken(Long userId) {', '}'] }).ok).toBe(false);
  });

  test('reimpl-layer — 사다리를 통과해도 연결 이름이 빠지면 못 넘는다', () => {
    const card = reimpl({ type: 'reimpl-layer', links: ['build', 'findByLoginId'] });
    const out = gradeStage(card, { kind: 'lines', lines: ['public String generateToken(Long userId) {', '    Date now = new Date();', '    return build(userId, now);', '}'] });
    expect(out.ok).toBe(false);
    expect(out.diagnosis).toContain('findByLoginId');
    expect(out.okText).toBe('연결 검사 1/2');
    expect(checkLinks(['build', 'builder'], ['x = build(1);'])).toEqual([{ name: 'build', ok: true }, { name: 'builder', ok: false }]);
  });

  test('handoff — 채점 없음, 프롬프트는 파일 이름만 · 앞뒤 4줄 · 내 답 · 물음', () => {
    const card = reimpl({ type: 'handoff', question: '내가 쓴 «generateToken» 이 <b>실제로</b> 도는지' });
    const out = gradeStage(card, { kind: 'handoff', lines: ['my line 1', 'my line 2'] });
    expect(out.ok).toBe(true);
    expect(out.pct).toBeNull();
    if (out.detail.kind !== 'handoff') throw new Error('shape');
    expect(out.detail.prompt).toContain('JwtUtil.java');
    expect(out.detail.prompt).not.toContain('BACK/src');
    expect(out.detail.prompt).toContain('my line 2');
    expect(out.detail.prompt).not.toContain('<b>');
    expect(buildHandoffPrompt(card as Extract<CardPayload, { kind: 'reimpl' }>, [])).toContain('24행부터');
  });
});
