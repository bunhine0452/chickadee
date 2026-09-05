import { describe, expect, test } from 'vitest';

import { buildCallGraph, type FileBlocks } from './calls.js';
import type { RawBlock, RawImport } from './derive.js';
import type { FileImports, ResolvedEdge } from './resolve-imports.js';

/** 실측 리포의 로그인 경로를 캡처 모양 그대로 줄인 것 — 파일 이름·메서드 이름이 이음매다. */
const FE = 'FRONT/src/views/LandingView.vue';
const STORE = 'FRONT/src/stores/authStore.js';
const SVC_JS = 'FRONT/src/services/authService.js';
const CTRL = 'BACK/src/main/java/com/a/controller/AuthController.java';
const SVC = 'BACK/src/main/java/com/a/service/AuthService.java';
const DAO = 'BACK/src/main/java/com/a/model/dao/UserDao.java';
const JWT = 'BACK/src/main/java/com/a/security/JwtUtil.java';
const MAPPER = 'BACK/src/main/resources/mapper/UserMapper.xml';

const block = (name: string, lineStart: number, lineEnd: number, form: string | null = 'method'): RawBlock =>
  ({ name, lineStart, lineEnd, startByte: 0, endByte: 0, form });
const call = (recv: string | null, name: string, line: number): RawImport =>
  (recv === null ? { specifier: name, form: 'call-self', line } : { specifier: name, form: 'call', line, ctx: { recv } });
const field = (name: string, type: string, line: number): RawImport =>
  ({ specifier: name, form: 'field', line, ctx: { type } });
const edge = (from: string, to: string, kind: ResolvedEdge['kind'] = 'static', extra: Partial<ResolvedEdge> = {}): ResolvedEdge =>
  ({ from, to, kind, confidence: 'syntactic', line: 1, ...extra });

function login(): { files: FileImports[]; blocks: FileBlocks[]; edges: ResolvedEdge[] } {
  const files: FileImports[] = [
    { path: FE, imports: [call('authStore', 'login', 504), call('router', 'push', 509)] },
    { path: STORE, imports: [call('authService', 'login', 64)] },
    { path: SVC_JS, imports: [{ specifier: '/auth/login', form: 'http-post', line: 21 }] },
    { path: CTRL, imports: [
      field('authService', 'AuthService', 36),
      { specifier: '/login', form: 'route-post', line: 56 },
      { specifier: '/signup', form: 'route-post', line: 44 },
      call('authService', 'login', 58), call('authService', 'signup', 46),
    ] },
    { path: SVC, imports: [
      field('userDao', 'UserDao', 32), field('jwtUtil', 'JwtUtil', 34),
      call('userDao', 'findByLoginId', 78), call(null, 'resetDailyCoinIfNeeded', 87),
      call('userDao', 'findById', 90), call('jwtUtil', 'generateToken', 95),
      call('userDao', 'resetDailyCoin', 115), call('userDao', 'insertUser', 60),
    ] },
    { path: DAO, imports: [] },
    { path: JWT, imports: [] },
    { path: MAPPER, imports: [] },
  ];
  const blocks: FileBlocks[] = [
    { path: FE, blocks: [block('handleSubmit', 467, 515, null)] },
    { path: STORE, blocks: [block('login', 59, 80, null), block('signup', 30, 58, null)] },
    { path: SVC_JS, blocks: [block('signup', 11, 14, null), block('login', 20, 42, null)] },
    { path: CTRL, blocks: [block('AuthController', 34, 100, 'class'), block('signup', 44, 48), block('login', 56, 60)] },
    { path: SVC, blocks: [block('signup', 36, 73), block('login', 76, 110), block('resetDailyCoinIfNeeded', 112, 116)] },
    { path: DAO, blocks: [block('insertUser', 14, 14), block('findByLoginId', 17, 17), block('findById', 20, 20), block('resetDailyCoin', 26, 26)] },
    { path: JWT, blocks: [block('generateToken', 32, 39)] },
    { path: MAPPER, blocks: [block('insertUser', 25, 28, 'statement'), block('findByLoginId', 31, 36, 'statement'), block('findById', 39, 44, 'statement'), block('resetDailyCoin', 60, 66, 'statement')] },
  ];
  const edges: ResolvedEdge[] = [
    edge(FE, STORE), edge(STORE, SVC_JS),
    edge(SVC_JS, CTRL, 'http', { line: 21, toLine: 56 }),
    edge(SVC_JS, CTRL, 'http', { line: 12, toLine: 44 }),
    edge(CTRL, SVC), edge(SVC, DAO), edge(SVC, JWT), edge(DAO, MAPPER),
  ];
  return { files, blocks, edges };
}

const show = (g: ReturnType<typeof buildCallGraph>): string[] =>
  g.edges.map((e) => `${short(e.from.path)}#${e.from.name} -${e.kind}:${e.line}-> ${short(e.to.path)}#${e.to.name}`);
const short = (path: string): string => path.slice(path.lastIndexOf('/') + 1);

describe('buildCallGraph (D168)', () => {
  test('로그인이 화면 핸들러에서 매퍼 문까지 이름으로 이어진다', () => {
    const g = buildCallGraph(login());
    expect(show(g)).toContain('LandingView.vue#handleSubmit -call:504-> authStore.js#login');
    expect(show(g)).toContain('authStore.js#login -call:64-> authService.js#login');
    expect(show(g)).toContain('authService.js#login -http:21-> AuthController.java#login');
    expect(show(g)).toContain('AuthController.java#login -call:58-> AuthService.java#login');
    expect(show(g)).toContain('AuthService.java#login -call:78-> UserDao.java#findByLoginId');
    expect(show(g)).toContain('UserDao.java#findByLoginId -mapper:17-> UserMapper.xml#findByLoginId');
  });

  test('로그인과 회원가입이 컨트롤러에서 갈린다 — 파일 간선으로는 같은 칸이었다', () => {
    const g = buildCallGraph(login());
    expect(show(g)).toContain('authService.js#signup -http:12-> AuthController.java#signup');
    expect(show(g)).toContain('AuthController.java#signup -call:46-> AuthService.java#signup');
    expect(show(g)).not.toContain('AuthController.java#signup -call:46-> AuthService.java#login');
  });

  test('자기 호출은 같은 파일의 메서드로, 자기 자신은 아니다', () => {
    const g = buildCallGraph(login());
    expect(show(g)).toContain('AuthService.java#login -call:87-> AuthService.java#resetDailyCoinIfNeeded');
    expect(show(g)).toContain('AuthService.java#resetDailyCoinIfNeeded -call:115-> UserDao.java#resetDailyCoin');
  });

  test('블록이 없는 이름(라이브러리·DTO getter)은 세지 않고 간선도 안 선다', () => {
    const g = buildCallGraph(login());
    expect(show(g).some((l) => l.includes('router') || l.includes('#push'))).toBe(false);
    expect(g.unresolved).toBe(1); // `router.push`
  });

  test('라우트 메서드가 진입점이다', () => {
    const g = buildCallGraph(login());
    expect(g.entries.map((e) => `${e.kind} ${e.label} ${e.block.name}`)).toStrictEqual([
      'route POST /signup signup', 'route POST /login login',
    ]);
  });

  test('JS 수신자가 둘 이상의 파일에 걸리면 파일 이름으로 가르고, 그래도 둘이면 잇지 않는다', () => {
    const a = 'src/stores/authStore.js';
    const b = 'src/services/authService.js';
    const view = 'src/views/V.vue';
    const files: FileImports[] = [
      { path: view, imports: [call('authStore', 'login', 5), call('x', 'login', 6)] },
      { path: a, imports: [] }, { path: b, imports: [] },
    ];
    const blocks: FileBlocks[] = [
      { path: view, blocks: [block('go', 1, 10, null)] },
      { path: a, blocks: [block('login', 1, 3, null)] },
      { path: b, blocks: [block('login', 1, 3, null)] },
    ];
    const g = buildCallGraph({ files, blocks, edges: [edge(view, a), edge(view, b)] });
    expect(show(g)).toStrictEqual(['V.vue#go -call:5-> authStore.js#login']);
    expect(g.unresolved).toBe(1);
  });

  test('자바 정적 호출은 수신자가 곧 타입이다 — `SecurityUtil.getCurrentUserId()`', () => {
    const util = 'BACK/src/main/java/com/a/util/SecurityUtil.java';
    const files: FileImports[] = [
      { path: CTRL, imports: [call('SecurityUtil', 'getCurrentUserId', 75)] },
      { path: util, imports: [] },
    ];
    const blocks: FileBlocks[] = [
      { path: CTRL, blocks: [block('getUserInfo', 73, 79)] },
      { path: util, blocks: [block('getCurrentUserId', 9, 15)] },
    ];
    const g = buildCallGraph({ files, blocks, edges: [edge(CTRL, util)] });
    expect(show(g)).toStrictEqual(['AuthController.java#getUserInfo -call:75-> SecurityUtil.java#getCurrentUserId']);
  });

  test('같은 이름의 자바 파일이 둘이면 import 하거나 같은 디렉터리인 쪽만 잇는다', () => {
    const near = 'BACK/src/main/java/com/a/service/Helper.java';
    const far = 'OTHER/src/main/java/com/b/service/Helper.java';
    const files: FileImports[] = [
      { path: SVC, imports: [field('helper', 'Helper', 5), call('helper', 'run', 10)] },
      { path: near, imports: [] }, { path: far, imports: [] },
    ];
    const blocks: FileBlocks[] = [
      { path: SVC, blocks: [block('login', 8, 12)] },
      { path: near, blocks: [block('run', 1, 2)] }, { path: far, blocks: [block('run', 1, 2)] },
    ];
    expect(show(buildCallGraph({ files, blocks, edges: [] }))).toStrictEqual(['AuthService.java#login -call:10-> Helper.java#run']);
  });

  test('지역 변수가 필드를 가린다 — 같은 블록 안에서 앞서 선언된 것', () => {
    const user = 'BACK/src/main/java/com/a/model/entity/User.java';
    const files: FileImports[] = [
      { path: SVC, imports: [
        field('user', 'Other', 3),
        { specifier: 'user', form: 'local', line: 9, ctx: { type: 'User' } },
        call('user', 'getUserId', 10),
      ] },
      { path: user, imports: [] },
      { path: 'BACK/src/main/java/com/a/model/entity/Other.java', imports: [] },
    ];
    const blocks: FileBlocks[] = [
      { path: SVC, blocks: [block('login', 8, 12)] },
      { path: user, blocks: [block('getUserId', 1, 1)] },
      { path: 'BACK/src/main/java/com/a/model/entity/Other.java', blocks: [block('getUserId', 1, 1)] },
    ];
    const g = buildCallGraph({ files, blocks, edges: [edge(SVC, user), edge(SVC, 'BACK/src/main/java/com/a/model/entity/Other.java')] });
    expect(show(g)).toStrictEqual(['AuthService.java#login -call:10-> User.java#getUserId']);
  });

  test('같은 입력에 같은 배열 — 순서를 섞어도', () => {
    const a = login();
    const b = { files: [...a.files].reverse(), blocks: [...a.blocks].reverse(), edges: [...a.edges].reverse() };
    expect(buildCallGraph(b)).toStrictEqual(buildCallGraph(a));
  });
});
