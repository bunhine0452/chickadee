/**
 * 줄 diff → hunk (D172 ③). 4단 세 유형이 각각 요구하는 모양 — 한 줄 바꿈(`patch-line`),
 * 한 줄 더함(`patch-place`), 여러 줄 바꿈(`rollback`) — 이 나오는지 본다.
 */
import { describe, expect, test } from 'vitest';

import { DIFF_CELLS, lineDiff } from './diff.js';

const SVC = [
  'public LoginResponse login(LoginRequest request) {',
  '    String loginId = request.getLoginId();',
  '    User user = userDao.findByLoginId(loginId)',
  '            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));',
  '',
  '    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {',
  '        throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");',
  '    }',
  '    String role = user.getRole();',
  '    String token = jwtUtil.generateToken(user.getUserId(), loginId, role);',
  '    return LoginResponse.of(token, user, role);',
  '}',
];

describe('lineDiff', () => {
  test('한 줄이 바뀌면 hunk 하나에 −1 +1, 문맥은 앞뒤 4줄', () => {
    const after = SVC.map((l) => (l.includes('ResourceNotFoundException') ? '            .orElseThrow(() -> new UnauthorizedException("비밀번호가 일치하지 않습니다."));' : l));
    const hunks = lineDiff(SVC, after);
    expect(hunks).toHaveLength(1);
    const h = hunks[0]!;
    expect(h.lines.filter((l) => l.sign === '-')).toHaveLength(1);
    expect(h.lines.filter((l) => l.sign === '+')).toHaveLength(1);
    // 바뀐 줄은 4번째(1-based) — 앞 문맥 3줄(파일 머리라 4를 못 채움), 뒤 4줄.
    expect(h.oldStart).toBe(1);
    expect(h.newStart).toBe(1);
    expect(h.lines.map((l) => l.sign).join('')).toBe('   -+    ');
  });

  test('한 줄이 더해지면 −0 +1 이고 위치가 새 판 기준으로 맞다', () => {
    const after = [...SVC.slice(0, 8), '    resetDailyCoinIfNeeded(user.getUserId());', ...SVC.slice(8)];
    const hunks = lineDiff(SVC, after);
    expect(hunks).toHaveLength(1);
    const h = hunks[0]!;
    expect(h.lines.filter((l) => l.sign === '+').map((l) => l.text)).toEqual(['    resetDailyCoinIfNeeded(user.getUserId());']);
    expect(h.lines.filter((l) => l.sign === '-')).toHaveLength(0);
    // 앞 문맥 4줄이면 hunk 는 5번째 줄부터 — 옛 판·새 판 모두 5 (더한 줄 앞까지는 같다).
    expect(h.oldStart).toBe(5);
    expect(h.newStart).toBe(5);
  });

  test('여러 줄이 바뀌면 −n +m 한 덩이', () => {
    const after = SVC.map((l, i) => (i === 8 ? '    String role = user.getRole() != null ? user.getRole() : "USER";' : i === 9 ? '    String token = jwtUtil.generateToken(user.getUserId(), loginId, role, 1);' : l));
    const hunks = lineDiff(SVC, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0]!.lines.filter((l) => l.sign === '-')).toHaveLength(2);
    expect(hunks[0]!.lines.filter((l) => l.sign === '+')).toHaveLength(2);
  });

  test('멀리 떨어진 변경은 hunk 둘', () => {
    const after = SVC.map((l, i) => (i === 1 || i === 10 ? `${l} // x` : l));
    expect(lineDiff(SVC, after)).toHaveLength(2);
  });

  test('같으면 비고, 표가 너무 커도 빈다', () => {
    expect(lineDiff(SVC, SVC)).toEqual([]);
    const n = Math.ceil(Math.sqrt(DIFF_CELLS)) + 1;
    const a = Array.from({ length: n }, (_, i) => `a${i}`);
    const b = Array.from({ length: n }, (_, i) => `b${i}`);
    expect(lineDiff(a, b)).toEqual([]);
  });

  test('결정론 — 같은 입력에 같은 hunk', () => {
    const after = SVC.map((l, i) => (i === 5 ? '    if (!ok) {' : l));
    expect(lineDiff(SVC, after)).toEqual(lineDiff(SVC, after));
  });
});
