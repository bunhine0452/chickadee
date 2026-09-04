/**
 * 기능 대지 (D160). 디렉터리 규칙(`assignUnits`)의 시험은 `concepts.test.ts` 에 있다 —
 * 여기는 HTTP 진입점에서 폐포를 뜨는 쪽만 본다.
 */
import { describe, expect, test } from 'vitest';

import { OTHER_UNIT, entryUnits, planUnits } from './units.js';

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

describe('기능 + 디렉터리 합치기 (D160)', () => {
  const edge = (from: string, to: string, kind: 'static' | 'http' = 'static') =>
    ({ from, to, kind, confidence: 'syntactic' as const });
  const FE = 'FRONT/src/services/authService.js';
  const CTRL = 'BACK/src/main/java/com/ssafy/app/controller/AuthController.java';
  const SVC = 'BACK/src/main/java/com/ssafy/app/service/AuthService.java';
  const CFG = 'BACK/src/main/java/com/ssafy/app/config/SecurityConfig.java';
  const FILTER = 'BACK/src/main/java/com/ssafy/app/security/JwtAuthenticationFilter.java';
  const BOOT = 'BACK/src/main/java/com/ssafy/app/Application.java';

  test('기능이 먼저 서고 남은 것만 디렉터리 규칙이 받는다', () => {
    const paths = [FE, CTRL, SVC, CFG, FILTER, BOOT];
    const { units, unitsOf } = planUnits(paths, [edge(FE, CTRL, 'http'), edge(CTRL, SVC)]);
    expect(units[0]?.name).toBe('auth');
    expect(unitsOf.get(CTRL)).toStrictEqual(['auth']);
    // 런타임에 엮이는 것은 어느 폐포에도 안 든다 — 디렉터리 쪽으로 온다.
    expect(unitsOf.get(CFG)).toBeDefined();
    expect(unitsOf.get(CFG)).not.toContain('auth');
  });

  test('덮이지 않은 파일이 하나도 안 사라진다', () => {
    const paths = [FE, CTRL, SVC, CFG, FILTER, BOOT];
    const { unitsOf } = planUnits(paths, [edge(FE, CTRL, 'http'), edge(CTRL, SVC)]);
    for (const p of paths) expect(unitsOf.get(p)?.length ?? 0).toBeGreaterThan(0);
  });

  test('엣지가 없으면 예전과 같다 — 디렉터리 규칙만 돈다', () => {
    const paths = ['src/cart/a.ts', 'src/cart/b.ts', 'src/cart/c.ts'];
    const { units } = planUnits(paths, []);
    expect(units.map((u) => u.name)).toStrictEqual(['cart']);
  });

  test('이름이 겹치면 기능이 이기고 밀려난 파일은 기타로 간다', () => {
    const paths = [FE, CTRL, 'src/auth/x.ts', 'src/auth/y.ts', 'src/auth/z.ts'];
    const { units, unitsOf } = planUnits(paths, [edge(FE, CTRL, 'http')]);
    expect(units.filter((u) => u.name === 'auth')).toHaveLength(1);
    expect(unitsOf.get('src/auth/x.ts')).toStrictEqual([OTHER_UNIT]);
    expect(unitsOf.get(CTRL)).toStrictEqual(['auth']);
  });
});

describe('위로 한 단 (D163)', () => {
  const edge = (from: string, to: string, kind: 'static' | 'http' = 'static') =>
    ({ from, to, kind, confidence: 'syntactic' as const });
  const FE = 'FRONT/src/services/authService.js';
  const CTRL = 'BACK/controller/AuthController.java';
  const JWT = 'BACK/security/JwtUtil.java';
  const FILTER = 'BACK/security/JwtAuthenticationFilter.java';

  test('이 기능만의 파일을 쓰는 쪽은 기능에 든다 — 필터 체인이 그렇다', () => {
    const units = entryUnits([edge(FE, CTRL, 'http'), edge(CTRL, JWT), edge(FILTER, JWT)]);
    expect(units[0]?.files).toContain(FILTER);
  });

  test('여러 기능이 쓰는 파일에서는 안 올라간다 — 공유 부품이 통로가 되면 안 된다', () => {
    // `UTIL` 을 두 기능이 쓴다. 그 위의 `OTHER` 는 어느 쪽 것도 아니다.
    const FE2 = 'FRONT/src/services/noticeService.js';
    const CTRL2 = 'BACK/controller/NoticeController.java';
    const UTIL = 'BACK/util/SecurityUtil.java';
    const OTHER = 'BACK/controller/RankingController.java';
    const units = entryUnits([
      edge(FE, CTRL, 'http'), edge(CTRL, UTIL),
      edge(FE2, CTRL2, 'http'), edge(CTRL2, UTIL),
      edge(OTHER, UTIL),
    ]);
    for (const u of units) expect(u.files).not.toContain(OTHER);
  });

  test('한 단만 올라간다 — 두 단 위는 안 든다', () => {
    const BOOT = 'BACK/config/SecurityConfig.java';
    const units = entryUnits([edge(FE, CTRL, 'http'), edge(CTRL, JWT), edge(FILTER, JWT), edge(BOOT, FILTER)]);
    expect(units[0]?.files).toContain(FILTER);
    expect(units[0]?.files).not.toContain(BOOT);
  });
});
