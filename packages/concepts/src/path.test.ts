/**
 * 요청 한 줄기 (D162 · 2단 추적).
 */
import { describe, expect, test } from 'vitest';

import { featurePath, requestPaths } from './path.js';
import type { ResolvedEdge } from './resolve-imports.js';

const edge = (
  from: string, to: string, line: number, kind: ResolvedEdge['kind'] = 'static',
): ResolvedEdge => ({ from, to, kind, confidence: 'syntactic', line });

const FE = 'FRONT/authService.js';
const CTRL = 'BACK/AuthController.java';
const SVC = 'BACK/AuthService.java';
const DAO = 'BACK/UserDao.java';
const MAP = 'BACK/UserMapper.xml';
const CHAIN = [edge(CTRL, SVC, 20), edge(SVC, DAO, 6), edge(DAO, MAP, 5)];

describe('줄기', () => {
  test('진입점에서 가장 먼 곳까지 순서대로', () => {
    const p = featurePath(FE, [edge(FE, CTRL, 21, 'http'), ...CHAIN]);
    expect(p.map((h) => h.path)).toStrictEqual([FE, CTRL, SVC, DAO, MAP]);
    expect(p[0]?.line).toBe(21);
    // 마지막 칸에서는 넘어가지 않는다.
    expect(p[4]?.line).toBeNull();
    expect(p[4]?.kind).toBeNull();
  });

  test('짧은 갈래가 아니라 긴 갈래를 고른다', () => {
    const DTO = 'BACK/LoginRequest.java';
    const p = featurePath(FE, [edge(FE, CTRL, 21, 'http'), edge(CTRL, DTO, 9), ...CHAIN]);
    expect(p.map((h) => h.path)).toStrictEqual([FE, CTRL, SVC, DAO, MAP]);
  });

  test('나갈 데가 없으면 문항이 안 된다', () => {
    expect(featurePath(FE, [])).toStrictEqual([]);
  });

  test('호출 자리마다 요청 하나 — 같은 컨트롤러를 여섯 번 불러도 여섯이다', () => {
    // 접으면 첫 호출이 기능 전체를 대표한다. 실측에서 그것이 `signup` 이었다.
    const calls = [12, 21, 49].map((n) => edge(FE, CTRL, n, 'http'));
    const paths = requestPaths([...calls, ...CHAIN]);
    expect(paths).toHaveLength(3);
    expect(paths.map((p) => p[0]?.line)).toStrictEqual([12, 21, 49]);
    // 꼬리는 아직 기능별이다 — 파일 단위 간선의 한계다.
    for (const p of paths) expect(p.map((h) => h.path)).toStrictEqual([FE, CTRL, SVC, DAO, MAP]);
  });

  test('사이클이 있어도 멈춘다', () => {
    const p = featurePath(FE, [edge(FE, CTRL, 1, 'http'), edge(CTRL, SVC, 2), edge(SVC, CTRL, 3)]);
    expect(p.map((h) => h.path)).toStrictEqual([FE, CTRL, SVC]);
  });
});
