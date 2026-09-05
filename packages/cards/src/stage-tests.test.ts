/**
 * 판정용 테스트 뽑기 (D180 ③). 갈래 셋의 순서와, 생성한 계약 테스트가 **컴파일 가능한 모양**인지.
 */
import { describe, expect, test } from 'vitest';

import {
  commitTests, contractTest, isTestPath, javaFqn, judgeTests, namedTests, parseJavaSignature,
} from './stage-tests.js';
import type { StageCommit, StageTestFile } from './stage-types.js';

const AUTH = 'BACK/src/main/java/com/ssafy/finalproject/service/AuthService.java';

const repoTests: StageTestFile[] = [
  { path: 'BACK/src/test/java/com/ssafy/finalproject/FinalProjectApplicationTests.java', text: 'class FinalProjectApplicationTests {}' },
  { path: 'BACK/src/test/java/com/ssafy/finalproject/service/AuthServiceTest.java', text: 'class AuthServiceTest { /* 전문 */ }' },
];

describe('경로와 이름', () => {
  test('테스트 경로 — 자바 src/test 와 JS 관례', () => {
    expect(isTestPath('BACK/src/test/java/com/x/AuthServiceTest.java')).toBe(true);
    expect(isTestPath('FRONT/src/stores/authStore.spec.js')).toBe(true);
    expect(isTestPath('FRONT/tests/e2e/login.js')).toBe(true);
    expect(isTestPath(AUTH)).toBe(false);
    expect(isTestPath('FRONT/src/services/authService.js')).toBe(false);
  });

  test('자바 완전 이름 — src/main/java 뒤가 패키지다', () => {
    expect(javaFqn(AUTH)).toBe('com.ssafy.finalproject.service.AuthService');
    expect(javaFqn('FRONT/src/services/authService.js')).toBeNull();
    expect(javaFqn('lib/Foo.java')).toBeNull();
  });
});

describe('계약 읽기', () => {
  test('공개 메서드의 이름·인자·반환', () => {
    expect(parseJavaSignature(['    public LoginResponse login(LoginRequest request) {']))
      .toEqual({ name: 'login', params: ['LoginRequest'], returns: 'LoginResponse' });
    expect(parseJavaSignature(['public void updateUser(Long userId, UpdateUserRequest request) {']))
      .toEqual({ name: 'updateUser', params: ['Long', 'UpdateUserRequest'], returns: 'void' });
    // 제네릭 인자는 벗긴다 — 리플렉션의 `getSimpleName()` 도 벗겨서 준다.
    expect(parseJavaSignature(['public List<User> findAll() {']))
      .toEqual({ name: 'findAll', params: [], returns: 'List' });
    expect(parseJavaSignature(['private String secret;'])).toBeNull();
  });
});

describe('계약 테스트 생성 (ⓒ)', () => {
  test('패키지·클래스 이름·리플렉션 단언이 선다', () => {
    const made = contractTest({ file: AUTH, signature: ['    public LoginResponse login(LoginRequest request) {'] });
    expect(made).not.toBeNull();
    const t = made as NonNullable<typeof made>;
    expect(t.source).toBe('contract');
    expect(t.path).toBe('BACK/src/test/java/chickadee/judge/AuthServiceLoginContractTest.java');
    expect(t.text).toContain('package chickadee.judge;');
    expect(t.text).toContain('class AuthServiceLoginContractTest {');
    expect(t.text).toContain('Class.forName("com.ssafy.finalproject.service.AuthService")');
    expect(t.text).toContain('"LoginResponse"');
    expect(t.text).toContain('"LoginRequest"');
    // 대상 타입을 import 하지 않는다 — 단순 이름만 견주므로 컴파일이 이름 해석에 안 걸린다.
    expect(t.text).not.toContain('import com.ssafy');
  });

  test('시그니처를 못 읽으면 클래스가 서는지만 본다', () => {
    const made = contractTest({ file: AUTH });
    expect((made as NonNullable<typeof made>).text).toContain('assertNotNull');
    expect((made as NonNullable<typeof made>).text).not.toContain('getDeclaredMethods');
  });

  test('자바가 아니면 안 만든다 — 그 판은 게이트 밖이다', () => {
    expect(contractTest({ file: 'FRONT/src/services/authService.js' })).toBeNull();
  });
});

describe('갈래의 순서 (ⓐ → ⓑ → ⓒ)', () => {
  const commit = (paths: string[]): StageCommit => ({
    id: 1, sha: 'abc1234', date: '2026-01-02', message: 'fix: role 값 추가',
    files: paths.map((path) => ({
      path,
      hunks: [{ oldStart: 1, newStart: 1, lines: [{ sign: ' ' as const, text: 'class T {' }, { sign: '+' as const, text: '  @Test void x() {}' }, { sign: ' ' as const, text: '}' }] }],
    })),
  });

  test('ⓐ 커밋이 같이 고친 테스트가 이긴다 — 리포에 전문이 있으면 전문을 쓴다', () => {
    const out = judgeTests({
      file: AUTH,
      commit: commit([AUTH, 'BACK/src/test/java/com/ssafy/finalproject/service/AuthServiceTest.java']),
      repoTests,
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe('commit');
    expect(out[0]?.text).toBe('class AuthServiceTest { /* 전문 */ }');
  });

  test('ⓐ 리포에 없으면 hunk 의 자식 판을 쓴다', () => {
    const out = commitTests(commit(['BACK/src/test/java/com/x/NewTest.java']), []);
    expect(out[0]?.text).toBe('class T {\n  @Test void x() {}\n}');
  });

  test('ⓑ 커밋이 테스트를 안 고쳤으면 이름이 맞는 리포 테스트', () => {
    const out = judgeTests({ file: AUTH, commit: commit([AUTH]), repoTests });
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe('repo');
    expect(namedTests(AUTH, repoTests).map((t) => t.path)).toEqual([repoTests[1]?.path]);
  });

  test('ⓒ 둘 다 없으면 계약 테스트 하나', () => {
    const out = judgeTests({ file: AUTH, signature: ['public LoginResponse login(LoginRequest request) {'], repoTests: [] });
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe('contract');
  });

  test('자바가 아니고 이름 맞는 테스트도 없으면 0장 — 그 판은 실행으로 판정하지 않는다', () => {
    expect(judgeTests({ file: 'FRONT/src/services/authService.js', repoTests })).toEqual([]);
  });
});
