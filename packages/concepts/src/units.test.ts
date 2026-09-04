/**
 * 기능 대지 (D160). 디렉터리 규칙(`assignUnits`)의 시험은 `concepts.test.ts` 에 있다 —
 * 여기는 HTTP 진입점에서 폐포를 뜨는 쪽만 본다.
 */
import { describe, expect, test } from 'vitest';

import { entryUnits } from './units.js';

describe('기능 대지 — HTTP 진입점에서 도달하는 것 (D160)', () => {
  const edge = (from: string, to: string, kind: 'static' | 'http' = 'static') =>
    ({ from, to, kind, confidence: 'syntactic' as const });

  const FE = 'FRONT/src/services/authService.js';
  const CTRL = 'BACK/src/main/java/com/ssafy/app/controller/AuthController.java';
  const SVC = 'BACK/src/main/java/com/ssafy/app/service/AuthService.java';
  const DAO = 'BACK/src/main/java/com/ssafy/app/model/dao/UserDao.java';

  test('진입점에서 따라간 폐포가 기능 하나다', () => {
    const units = entryUnits([edge(FE, CTRL, 'http'), edge(CTRL, SVC), edge(SVC, DAO)]);
    expect(units).toHaveLength(1);
    expect(units[0]?.name).toBe('auth');
    expect(units[0]?.files).toStrictEqual([CTRL, SVC, DAO, FE].sort());
  });

  test('이름은 진입 파일에서 뽑고 `Service` 접미는 뗀다', () => {
    const units = entryUnits([edge('FRONT/src/services/rankingService.js', CTRL, 'http')]);
    expect(units[0]?.name).toBe('ranking');
  });

  test('HTTP 엣지가 없으면 기능도 없다 — 정적 import 만으로는 진입점을 모른다', () => {
    expect(entryUnits([edge(CTRL, SVC), edge(SVC, DAO)])).toStrictEqual([]);
  });

  test('파일 하나가 기능 여럿에 든다 — 1:1 로 접지 않는다', () => {
    // 실측: 90파일 중 13개가 그랬다. `UserDao` 는 로그인이자 회원정보다.
    const OTHER = 'FRONT/src/services/userService.js';
    const OTHER_CTRL = 'BACK/src/main/java/com/ssafy/app/controller/UserController.java';
    const units = entryUnits([
      edge(FE, CTRL, 'http'), edge(CTRL, SVC), edge(SVC, DAO),
      edge(OTHER, OTHER_CTRL, 'http'), edge(OTHER_CTRL, DAO),
    ]);
    expect(units.map((u) => u.name)).toStrictEqual(['auth', 'user']);
    for (const u of units) expect(u.files).toContain(DAO);
  });

  test('사이클이 있어도 멈춘다', () => {
    const units = entryUnits([edge(FE, CTRL, 'http'), edge(CTRL, SVC), edge(SVC, CTRL)]);
    expect(units[0]?.files).toStrictEqual([CTRL, SVC, FE].sort());
  });

  test('이름이 같은 진입점 둘이면 큰 쪽이 이긴다', () => {
    const a = 'FRONT/a/authService.js';
    const b = 'FRONT/b/authService.js';
    const units = entryUnits([edge(a, CTRL, 'http'), edge(b, SVC, 'http'), edge(CTRL, SVC)]);
    expect(units).toHaveLength(1);
    expect(units[0]?.entry).toBe(a);
  });
});
