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

  test('둘째 칸은 라우트가 선언된 줄이다 — 요청마다 갈린다', () => {
    // 없으면 `import` 줄을 가리켜 로그인과 회원가입이 같은 자리를 본다. 실측에서
    // 여섯 요청이 `AuthController.java:44·56·64·73·83·94` 로 갈렸다.
    const login: ResolvedEdge = { ...edge(FE, CTRL, 21, 'http'), toLine: 56 };
    const signup: ResolvedEdge = { ...edge(FE, CTRL, 12, 'http'), toLine: 44 };
    const paths = requestPaths([login, signup, ...CHAIN]);
    const at = (n: number) => paths.find((p) => p[0]?.line === n)?.[1];
    expect(at(21)?.line).toBe(56);
    expect(at(12)?.line).toBe(44);
    // 꼬리는 아직 파일 단위라 같다.
    expect(paths[0]?.slice(2).map((h) => h.path)).toStrictEqual([SVC, DAO, MAP]);
  });

  test('라우트 줄을 모르면 그 자리는 import 줄로 남는다', () => {
    const paths = requestPaths([edge(FE, CTRL, 21, 'http'), ...CHAIN]);
    expect(paths[0]?.[1]?.line).toBe(20);
  });

  test('사이클이 있어도 멈춘다', () => {
    const p = featurePath(FE, [edge(FE, CTRL, 1, 'http'), edge(CTRL, SVC, 2), edge(SVC, CTRL, 3)]);
    expect(p.map((h) => h.path)).toStrictEqual([FE, CTRL, SVC]);
  });
});

// ───────── 메서드 단위 (D168) ─────────

import { buildCallGraph, type FileBlocks } from './calls.js';
import { methodPaths, trunk } from './path.js';
import type { RawBlock, RawImport } from './derive.js';
import type { FileImports } from './resolve-imports.js';

const block = (name: string, lineStart: number, lineEnd: number, form: string | null = 'method'): RawBlock =>
  ({ name, lineStart, lineEnd, startByte: 0, endByte: 0, form });
const call = (recv: string | null, name: string, line: number): RawImport =>
  (recv === null ? { specifier: name, form: 'call-self', line } : { specifier: name, form: 'call', line, ctx: { recv } });
const field = (name: string, type: string, line: number): RawImport =>
  ({ specifier: name, form: 'field', line, ctx: { type } });

const VIEW = 'FRONT/LandingView.vue';
const STORE = 'FRONT/authStore.js';
const JWT = 'BACK/JwtUtil.java';

function graph(): ReturnType<typeof buildCallGraph> {
  const files: FileImports[] = [
    { path: VIEW, imports: [call('authStore', 'login', 504)] },
    { path: STORE, imports: [call('authService', 'login', 64)] },
    { path: FE, imports: [{ specifier: '/auth/login', form: 'http-post', line: 21 }, { specifier: '/auth/signup', form: 'http-post', line: 12 }] },
    { path: CTRL, imports: [field('authService', 'AuthService', 36), { specifier: '/login', form: 'route-post', line: 56 }, { specifier: '/signup', form: 'route-post', line: 44 }, call('authService', 'login', 58), call('authService', 'signup', 46)] },
    { path: SVC, imports: [field('userDao', 'UserDao', 32), field('jwtUtil', 'JwtUtil', 34), call('userDao', 'findByLoginId', 78), call(null, 'resetDailyCoinIfNeeded', 87), call('userDao', 'findById', 90), call('jwtUtil', 'generateToken', 95), call('userDao', 'resetDailyCoin', 115), call('userDao', 'insertUser', 60)] },
    { path: DAO, imports: [] }, { path: JWT, imports: [] }, { path: MAP, imports: [] },
  ];
  const blocks: FileBlocks[] = [
    { path: VIEW, blocks: [block('handleSubmit', 467, 515, null)] },
    { path: STORE, blocks: [block('login', 59, 80, null), block('signup', 30, 58, null)] },
    { path: FE, blocks: [block('signup', 11, 14, null), block('login', 20, 42, null)] },
    { path: CTRL, blocks: [block('signup', 44, 48), block('login', 56, 60)] },
    { path: SVC, blocks: [block('signup', 36, 73), block('login', 76, 110), block('resetDailyCoinIfNeeded', 112, 116)] },
    { path: DAO, blocks: [block('insertUser', 14, 14), block('findByLoginId', 17, 17), block('findById', 20, 20), block('resetDailyCoin', 26, 26)] },
    { path: JWT, blocks: [block('generateToken', 32, 39)] },
    { path: MAP, blocks: [block('insertUser', 25, 28, 'statement'), block('findByLoginId', 31, 36, 'statement'), block('findById', 39, 44, 'statement'), block('resetDailyCoin', 60, 66, 'statement')] },
  ];
  const edges: ResolvedEdge[] = [
    edge(VIEW, STORE, 1), edge(STORE, FE, 1),
    { ...edge(FE, CTRL, 21, 'http'), toLine: 56 }, { ...edge(FE, CTRL, 12, 'http'), toLine: 44 },
    edge(CTRL, SVC, 1), edge(SVC, DAO, 1), edge(SVC, JWT, 1), edge(DAO, MAP, 1),
  ];
  return buildCallGraph({ files, blocks, edges });
}

const show = (hops: readonly { path: string; name: string; depth: number; kind: string | null; calledAt: { line: number } | null }[]): string[] =>
  hops.map((h) => `${'  '.repeat(h.depth)}${h.path.slice(h.path.lastIndexOf('/') + 1)}#${h.name}${h.calledAt === null ? '' : `@${h.calledAt.line}`}${h.kind === null ? '' : ` (${h.kind})`}`);

describe('메서드 줄기 (D168)', () => {
  test('로그인 — 화면 핸들러에서 매퍼까지, 실행 순서대로 들여쓴다', () => {
    const paths = methodPaths(graph());
    const login = paths.find((p) => p.some((h) => h.name === 'login' && h.path === CTRL)) ?? [];
    expect(show(login)).toStrictEqual([
      'LandingView.vue#handleSubmit',
      '  authStore.js#login@504 (call)',
      '    authService.js#login@64 (call)',
      '      AuthController.java#login@21 (http)',
      '        AuthService.java#login@58 (call)',
      '          UserDao.java#findByLoginId@78 (call)',
      '            UserMapper.xml#findByLoginId@17 (mapper)',
      '          AuthService.java#resetDailyCoinIfNeeded@87 (call)',
      '            UserDao.java#resetDailyCoin@115 (call)',
      '              UserMapper.xml#resetDailyCoin@26 (mapper)',
      '          UserDao.java#findById@90 (call)',
      '            UserMapper.xml#findById@20 (mapper)',
      '          JwtUtil.java#generateToken@95 (call)',
    ]);
  });

  test('회원가입은 첫 칸부터 다른 줄기다 — 호출자가 없으면 위로 안 오른다', () => {
    const paths = methodPaths(graph());
    const signup = paths.find((p) => p.some((h) => h.name === 'signup' && h.path === CTRL)) ?? [];
    expect(show(signup).slice(0, 3)).toStrictEqual([
      'authService.js#signup',
      '  AuthController.java#signup@12 (http)',
      '    AuthService.java#signup@46 (call)',
    ]);
    expect(paths).toHaveLength(2);
  });

  test('등뼈 — 맨 위에서 첫 매퍼 문까지, 곁가지 없이', () => {
    const paths = methodPaths(graph());
    const login = paths.find((p) => p.some((h) => h.name === 'login' && h.path === CTRL)) ?? [];
    expect(trunk(login).map((h) => `${h.path.slice(h.path.lastIndexOf('/') + 1)}#${h.name}`)).toStrictEqual([
      'LandingView.vue#handleSubmit', 'authStore.js#login', 'authService.js#login',
      'AuthController.java#login', 'AuthService.java#login', 'UserDao.java#findByLoginId', 'UserMapper.xml#findByLoginId',
    ]);
  });

  test('호출자가 둘이면 위로 안 오른다 — 어느 화면에서 왔는지 코드가 말하지 않는다', () => {
    const g = graph();
    const other = 'FRONT/OtherView.vue';
    g.blocks.push({ path: other, name: 'go', lineStart: 1, lineEnd: 9, form: null });
    const store = g.blocks.find((b) => b.path === STORE && b.name === 'login') as (typeof g.blocks)[number];
    g.edges.push({ from: { path: other, name: 'go', lineStart: 1, lineEnd: 9, form: null }, to: store, line: 3, kind: 'call' });
    const login = methodPaths(g).find((p) => p.some((h) => h.name === 'login' && h.path === CTRL)) ?? [];
    expect(show(login)[0]).toBe('authStore.js#login');
  });
});
