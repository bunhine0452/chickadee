/**
 * 코스 문항 16유형 (D164). 표본은 `docs/program/chapter-login.md` 의 로그인 챕터를 줄여 만든
 * 가짜 리포다 — 프런트 JS · 컨트롤러 · 서비스 · DAO · 매퍼 XML · JwtUtil. 여기서 재는 것은
 * 「그 문서의 문항이 실제로 나오는가」와 결정성(같은 입력 → 같은 카드)이다.
 */
import { describe, expect, test } from 'vitest';

import { loadDict } from '@chickadee/dictionary';
import type { Hop } from '@chickadee/concepts';
import type { AstLite, ConceptId, ConceptSite } from '@chickadee/store-sql';

import { findGuards, swapPairs } from './stage-choice.js';
import { fixSubject, linksBetween } from './stage-edit.js';
import { buildCourseCards, buildStageCards, conceptsOnPath } from './stage.js';
import { layerOf, splitHops } from './stage-trace.js';
import type { StageBlock, StageCommit, StageFile, StageRequest } from './stage-types.js';
import type { FocusLine } from './types.js';

const dict = loadDict();

const FRONT = 'FRONT/src/services/authService.js';
const CTRL = 'BACK/src/main/java/com/x/controller/AuthController.java';
const SVC = 'BACK/src/main/java/com/x/service/AuthService.java';
const DAO = 'BACK/src/main/java/com/x/dao/UserDao.java';
const MAPPER = 'BACK/src/main/resources/mapper/UserMapper.xml';
const JWT = 'BACK/src/main/java/com/x/security/JwtUtil.java';
const SIGNUP = 'BACK/src/main/java/com/x/service/SignupService.java';

/** 줄 번호를 붙인 원문. 빈 자리는 없어도 된다 — 창 계산은 범위로만 거른다. */
const lines = (from: number, ...text: string[]): FocusLine[] => text.map((t, i) => ({ n: from + i, t }));

const JWT_BLOCK = [
  '    public String generateToken(Long userId, String loginId, String role) {',
  '        Date now = new Date();',
  '        Date expiry = new Date(now.getTime() + expiration);',
  '        String subject = String.valueOf(userId);',
  '        JwtBuilder builder = Jwts.builder();',
  '        builder.setSubject(subject);',
  '        builder.claim("loginId", loginId);',
  '        builder.claim("role", role);',
  '        builder.setIssuedAt(now);',
  '        builder.setExpiration(expiry);',
  '        builder.signWith(secretKey, SignatureAlgorithm.HS256);',
  '        return builder.compact();',
  '    }',
];

const FILES = new Map<string, StageFile>([
  [FRONT, { path: FRONT, fileId: 1, grammar: 'javascript', lines: [
    ...lines(10, 'export async function signup(form) {', '  const response = await api.post("/auth/signup", form);', '  return response.data;', '}'),
    ...lines(20, 'export async function login(credentials) {', '  const response = await api.post("/auth/login", credentials);', '  if (!response) return null;', '  if (response.data.token) {', '    localStorage.setItem("accessToken", response.data.token);', '  }', '  return response;', '}'),
    ...lines(34, 'export function currentUser(response) {', '  return {', '    role: response.data.role,', '  };', '}'),
  ] }],
  [CTRL, { path: CTRL, fileId: 2, grammar: 'java', lines: [
    ...lines(32, '@RequestMapping("/api/auth")', 'public class AuthController {'),
    ...lines(45, '    @PostMapping("/signup")', '    public ResponseEntity<Void> signup(@RequestBody SignupRequest request) {', '        authService.signup(request);', '        return ResponseEntity.ok().build();', '    }'),
    ...lines(56, '    @PostMapping("/login")', '    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {', '        LoginResponse response = authService.login(request);', '        return ResponseEntity.ok(response);', '    }'),
  ] }],
  [SVC, { path: SVC, fileId: 3, grammar: 'java', lines: [
    ...lines(20, 'import com.x.dao.UserDao;', 'import com.x.security.JwtUtil;'),
    ...lines(76, '    public LoginResponse login(LoginRequest request) {',
      '        String loginId = request.getLoginId();',
      '        User user = userDao.findByLoginId(loginId)',
      '                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));',
      '',
      '        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {',
      '            throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");',
      '        }',
      '        resetDailyCoinIfNeeded(user.getUserId());',
      '        user = userDao.findById(user.getUserId()).orElse(user);',
      '        String role = user.getRole() != null ? user.getRole() : "USER";',
      '        String token = jwtUtil.generateToken(user.getUserId(), loginId, role);',
      '        return LoginResponse.of(token, user, role);',
      '    }'),
  ] }],
  [DAO, { path: DAO, fileId: 4, grammar: 'java', lines: lines(5, 'import org.apache.ibatis.annotations.Mapper;', '', '@Mapper', 'public interface UserDao {', '    Optional<User> findByLoginId(@Param("loginId") String loginId);', '}') }],
  [MAPPER, { path: MAPPER, fileId: 5, grammar: 'mybatis', lines: [
    ...lines(15, '        <result property="role" column="role"/>'),
    ...lines(31, '    <select id="findByLoginId" resultMap="UserResultMap">', '        SELECT * FROM users', '        WHERE login_id = #{loginId}', '          AND deleted_date IS NULL', '    </select>'),
    ...lines(88, '    <update id="deleteUser">', '        UPDATE users', '        SET deleted_date = NOW()', '        WHERE user_id = #{userId}', '    </update>'),
  ] }],
  [JWT, { path: JWT, fileId: 6, grammar: 'java', lines: [
    ...lines(20, 'public class JwtUtil {', '    private final Key secretKey;'),
    ...lines(28, ...JWT_BLOCK),
    ...lines(61, '    public boolean validateToken(String token) {', '        return true;', '    }'),
  ] }],
  [SIGNUP, { path: SIGNUP, fileId: 7, grammar: 'java', lines: lines(54, '        .role("USER")') }],
]);

const hop = (path: string, line: number | null, kind: Hop['kind']): Hop => ({ path, line, kind });
const LOGIN: Hop[] = [hop(FRONT, 21, 'http'), hop(CTRL, 56, 'static'), hop(SVC, 20, 'static'), hop(DAO, 5, 'static'), hop(MAPPER, null, null)];
const SIGNUP_PATH: Hop[] = [hop(FRONT, 11, 'http'), hop(CTRL, 45, 'static'), hop(SVC, 20, 'static'), hop(DAO, 5, 'static'), hop(MAPPER, null, null)];
const TOKEN_PATH: Hop[] = [hop(FRONT, 21, 'http'), hop(CTRL, 56, 'static'), hop(SVC, 95, 'static'), hop(JWT, null, null)];

const site = (id: number, path: string, conceptId: string, line: number, excerpt: string): { site: ConceptSite; path: string } => ({
  path,
  site: {
    id, repoId: 1, fileId: FILES.get(path)?.fileId ?? 0, conceptId: conceptId as ConceptId, siteKey: `k${id}`,
    lineStart: line, lineEnd: line, colStart: 0, colEnd: 0, tsNodeKind: null, form: null, shape: 's', occurrence: 0,
    excerpt, picks: {}, hole: null, ctx: {}, lineConcepts: [], uncoveredRatio: 0, confidence: 'syntactic',
    parseQuality: 'ok', isDirty: false, isOversize: false, commitId: null, unknownCount: 0, isAlive: true, updatedAt: 0,
  },
});

const SITES = [
  site(1, SVC, 'common/absent-value', 79, '.orElseThrow(() -> new ResourceNotFoundException(...))'),
  site(2, SVC, 'common/absent-value', 85, '.orElse(user)'),
  site(3, SVC, 'common/comparison', 82, 'passwordEncoder.matches(...)'),
  site(4, SVC, 'common/conditional-expression', 86, 'user.getRole() != null ? user.getRole() : "USER"'),
  site(5, SVC, 'common/function-call', 87, 'jwtUtil.generateToken(...)'),
  site(6, CTRL, 'common/function-call', 58, 'authService.login(request)'),
  site(7, FRONT, 'common/async-await', 21, 'await api.post("/auth/login", credentials)'),
];

// ───────── AST 픽스처 (오프셋은 블록 원문에서 계산) ─────────

const src = (from: number, to: number, path: string): string =>
  (FILES.get(path) as StageFile).lines.filter((l) => l.n >= from && l.n <= to).map((l) => l.t).join('\n');

const leaf = (text: string, at: number, kind = 'identifier'): AstLite =>
  ({ kind, named: true, start: at, end: at + text.length, text, children: [] });
const node = (kind: string, start: number, end: number, children: AstLite[]): AstLite =>
  ({ kind, named: true, start, end, children });

/** `AuthService.login` 을 자바 노드 이름으로. 문장 여섯 — 선언·선언·if·식·재대입·선언·선언·return. */
function loginAst(): AstLite {
  const text = src(76, 89, SVC);
  const at = (s: string, from = 0): number => {
    const i = text.indexOf(s, from);
    if (i < 0) throw new Error(`fixture: ${s}`);
    return i;
  };
  const lineEnd = (s: string): number => text.indexOf('\n', at(s));
  const decl = (kind: string, lineStart: string, name: string, calls: string[]): AstLite => {
    const s = at(lineStart);
    const e = lineEnd(lineStart);
    return node(kind, s, e, [node('variable_declarator', s, e, [
      leaf(name, at(name, s)), ...calls.map((c) => node('method_invocation', at(c, s), at(c, s) + c.length, [leaf(c, at(c, s))])),
    ])]);
  };
  const stmts: AstLite[] = [
    decl('local_variable_declaration', 'String loginId', 'loginId', ['request']),
    node('local_variable_declaration', at('User user'), lineEnd('.orElseThrow'), [node('variable_declarator', at('User user'), lineEnd('.orElseThrow'), [
      leaf('user', at('user =')), node('method_invocation', at('userDao'), lineEnd('.orElseThrow'), [leaf('userDao', at('userDao')), leaf('findByLoginId', at('findByLoginId')), leaf('loginId', at('(loginId)') + 1)]),
    ])]),
    node('if_statement', at('if (!passwordEncoder'), lineEnd('        }'), [leaf('passwordEncoder', at('passwordEncoder'))]),
    node('expression_statement', at('resetDailyCoinIfNeeded'), lineEnd('resetDailyCoinIfNeeded'), [node('method_invocation', at('resetDailyCoinIfNeeded'), lineEnd('resetDailyCoinIfNeeded'), [leaf('resetDailyCoinIfNeeded', at('resetDailyCoinIfNeeded')), leaf('user', at('user.getUserId()')), leaf('getUserId', at('getUserId'))])]),
    node('expression_statement', at('user = userDao.findById'), lineEnd('user = userDao.findById'), [node('assignment_expression', at('user = userDao.findById'), lineEnd('user = userDao.findById'), [leaf('user', at('user = userDao.findById')), leaf('userDao', at('userDao.findById')), leaf('findById', at('findById'))])]),
    decl('local_variable_declaration', 'String role', 'role', ['user']),
    decl('local_variable_declaration', 'String token', 'token', ['jwtUtil', 'role']),
    node('return_statement', at('return LoginResponse'), lineEnd('return LoginResponse'), [leaf('token', at('token, user'))]),
  ];
  const body = node('block', at('{'), text.length, stmts);
  return node('method_declaration', 0, text.length, [leaf('login', at('login(')), body]);
}

const BLOCKS: StageBlock[] = [
  { path: SVC, blockId: 10, name: 'login', window: { from: 76, to: 89 }, ast: loginAst(), grammar: 'java', hash: 'h-login', concepts: [
    { conceptId: 'common/absent-value', layer: 0, siteCount: 2, siteId: 1 },
    { conceptId: 'common/comparison', layer: 0, siteCount: 1, siteId: 3 },
  ] },
  { path: JWT, blockId: 11, name: 'generateToken', window: { from: 28, to: 40 }, ast: null, grammar: 'java', hash: 'h-jwt', concepts: [
    { conceptId: 'common/function-call', layer: 0, siteCount: 3, siteId: 5 },
  ] },
];

const COMMITS: StageCommit[] = [
  { id: 1, sha: 'dc37666abc', date: '2025-12-20', message: 'fix: 사용자 정보 조회 시 role 값 추가', files: [
    { path: SVC, hunks: [
      { oldStart: 84, newStart: 84, lines: [
        { sign: ' ', text: '        resetDailyCoinIfNeeded(user.getUserId());' },
        { sign: ' ', text: '        user = userDao.findById(user.getUserId()).orElse(user);' },
        { sign: '-', text: '        String role = "USER";' },
        { sign: '+', text: '        String role = user.getRole() != null ? user.getRole() : "USER";' },
        { sign: ' ', text: '        String token = jwtUtil.generateToken(user.getUserId(), loginId, role);' },
      ] },
      { oldStart: 82, newStart: 82, lines: [
        { sign: ' ', text: '        User user = userDao.findByLoginId(loginId).orElseThrow();' },
        { sign: ' ', text: '        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {' },
        { sign: ' ', text: '            throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");' },
        { sign: ' ', text: '        }' },
        { sign: '+', text: '        resetDailyCoinIfNeeded(user.getUserId());' },
        { sign: ' ', text: '        user = userDao.findById(user.getUserId()).orElse(user);' },
      ] },
    ] },
  ] },
  { id: 2, sha: '22c85de999', date: '2025-12-18', message: 'fix: 마이페이지 코인 리셋 트랜잭션 분리', files: [
    { path: SVC, hunks: [
      { oldStart: 110, newStart: 110, lines: [
        { sign: ' ', text: '    public UserInfo getUserInfo(Long userId) {' },
        { sign: '-', text: '        int reset = userDao.resetDailyCoin(userId);' },
        { sign: '-', text: '        if (reset > 0) { log.info("reset"); }' },
        { sign: '+', text: '        resetDailyCoinIfNeeded(userId);' },
        { sign: '+', text: '        User user = userDao.findById(userId).orElseThrow();' },
        { sign: '+', text: '        return UserInfo.of(user);' },
        { sign: ' ', text: '    }' },
      ] },
    ] },
  ] },
  { id: 3, sha: 'feat000000', date: '2025-12-25', message: 'feat: 코인 랭킹', files: [{ path: SVC, hunks: [{ oldStart: 1, newStart: 1, lines: [{ sign: '+', text: 'x' }] }] }] },
];

const REQ: StageRequest = {
  repoId: 1, unitId: 7, unitName: 'auth', dictVersion: 'd1', attempt: 0,
  files: FILES, paths: [LOGIN, SIGNUP_PATH, TOKEN_PATH],
  edges: [
    { from: FRONT, to: CTRL, kind: 'http', line: 21 }, { from: FRONT, to: CTRL, kind: 'http', line: 11 },
    { from: CTRL, to: SVC, kind: 'static', line: 20 }, { from: SVC, to: DAO, kind: 'static', line: 20 },
    { from: SVC, to: JWT, kind: 'static', line: 21 }, { from: DAO, to: MAPPER, kind: 'static', line: 5 },
  ],
  concepts: dict.concepts, sites: SITES, blocks: BLOCKS, commits: COMMITS,
  names: [
    { name: 'role', path: SVC, line: 86, text: 'String role = user.getRole() != null ? user.getRole() : "USER";', role: 'define' },
    { name: 'role', path: FRONT, line: 36, text: 'role: response.data.role,', role: 'read' },
    { name: 'role', path: JWT, line: 35, text: 'builder.claim("role", role);', role: 'carry' },
    { name: 'role', path: MAPPER, line: 15, text: '<result property="role" column="role"/>', role: 'read' },
    { name: 'role', path: SIGNUP, line: 54, text: '.role("USER")', role: 'carry' },
  ],
  responseKeys: [
    { key: 'token', maker: { path: SVC, line: 88, text: 'return LoginResponse.of(token, user, role);' }, reads: [
      { path: FRONT, line: 24, text: 'if (response.data.token) {' },
      { path: FRONT, line: 25, text: 'localStorage.setItem("accessToken", response.data.token);' },
    ] },
    { key: 'role', maker: { path: SVC, line: 88, text: 'return LoginResponse.of(token, user, role);' }, reads: [
      { path: FRONT, line: 36, text: 'role: response.data.role,' },
    ] },
  ],
};

const typesOf = (stage: 1 | 2 | 3 | 4 | 5) => buildStageCards(REQ, stage).cards.map((c) => c.type);

describe('1단 · 읽기', () => {
  test('twin — 같은 개념의 다른 사용처가 정답이고 함정 셋은 다른 개념이다', () => {
    const { cards, dropped } = buildStageCards(REQ, 1);
    // 프런트의 `await` 는 리포에 쌍둥이가 없다 — 사유와 함께 빠진다.
    expect(dropped.some((d) => d.type === 'twin')).toBe(true);
    // 요청 순서상 첫 쌍둥이는 컨트롤러의 호출 ↔ 서비스의 호출이다.
    const twin = cards.find((c) => c.type === 'twin');
    if (twin?.payload.track !== 't3' || twin.payload.kind !== 'twin') throw new Error('shape');
    expect(twin.track).toBe('t3');
    expect(twin.stageNo).toBe(1);
    expect(twin.conceptId).toBe('common/function-call');
    expect(twin.payload.options).toHaveLength(4);
    expect(twin.payload.why.filter((w) => w === null)).toHaveLength(1);
    expect(twin.payload.why[twin.payload.answer]).toBeNull();
    expect(twin.payload.options[twin.payload.answer]?.l).toBe(87);
    // 다른 파일의 쌍둥이를 먼저 고른다 — 같은 파일 안의 `.orElse(user)` 는 두 번째 카드다.
    const absent = cards.find((c) => c.conceptId === 'common/absent-value');
    if (absent?.payload.track !== 't3' || absent.payload.kind !== 'twin') throw new Error('shape');
    expect(absent.payload.options[absent.payload.answer]?.l).toBe(85);
  });

  test('conceptsOnPath — 요청 순서로, 중복 없이', () => {
    expect(conceptsOnPath(REQ)).toEqual([
      'common/async-await', 'common/function-call', 'common/absent-value', 'common/comparison', 'common/conditional-expression',
    ]);
  });
});

describe('2단 · 추적', () => {
  test('exec·hop·origin·caller 와 값 추적이 다 나온다', () => {
    const types = typesOf(2);
    expect(new Set(types)).toEqual(new Set(['exec', 'hop', 'origin', 'caller', 'trace-table']));
  });

  test('hop — 노드가 path:line 이고 함정은 같은 파일의 다른 요청 줄이다', () => {
    const { cards } = buildStageCards(REQ, 2);
    const hops = cards.filter((c) => c.type === 'hop');
    expect(hops).toHaveLength(3);
    const login = hops[0];
    if (login?.payload.track !== 't2' || login.payload.kind !== 'flow') throw new Error('shape');
    expect(login.payload.flow?.answer).toEqual([`${FRONT}:21`, `${CTRL}:56`, `${SVC}:20`, `${DAO}:5`, MAPPER]);
    // 함정은 같은 파일의 다른 요청 줄 — 회원가입의 `AuthController.java:45`, 다른 줄기의 `AuthService.java:95`
    // (이름순 상위 둘, `FLOW_DECOYS`).
    expect(Object.keys(login.payload.trap).sort()).toEqual([`${CTRL}:45`, `${SVC}:95`]);
    expect(login.payload.edges[0]).toEqual([`${FRONT}:21`, `${CTRL}:56`, 'http']);
    expect(login.kind).toBe('flow');
    expect(login.track).toBe('t3');
  });

  test('hop — 여섯 칸을 넘으면 매퍼에서 두 장으로 자른다', () => {
    const long: Hop[] = [hop('a.js', 1, 'http'), hop('b.java', 2, 'static'), hop('c.java', 3, 'static'),
      hop('d.java', 4, 'static'), hop('m.xml', 5, 'static'), hop('e.java', 6, 'static'), hop('f.java', 7, 'static'), hop('g.java', null, null)];
    const parts = splitHops(long);
    expect(parts).toHaveLength(2);
    expect(parts[0]?.hops.map((h) => h.path)).toEqual(['a.js', 'b.java', 'c.java', 'd.java', 'm.xml']);
    expect(parts[1]?.hops[0]?.path).toBe('m.xml');
    expect(splitHops(LOGIN)).toHaveLength(1);
  });

  test('origin — 정답은 요청 순서에서 먼저 만나는 define, 초점은 화면 쪽 읽는 줄', () => {
    const origin = buildStageCards(REQ, 2).cards.find((c) => c.type === 'origin');
    if (origin?.payload.track !== 't3' || origin.payload.kind !== 'origin') throw new Error('shape');
    expect(origin.payload.file).toBe(FRONT);
    expect(origin.payload.focus).toBe(36);
    expect(origin.payload.options[origin.payload.answer]?.l).toBe(86);
    const whys = origin.payload.why.filter((w) => w !== null).map((w) => w?.t ?? '');
    expect(whys.some((w) => w.includes('다른 경로'))).toBe(true);
    expect(whys.some((w) => w.includes('옮겨'))).toBe(true);
  });

  test('caller — 불리는 수가 적은 대상부터, 부르는 쪽이 core 고 대상이 쓰는 쪽이 함정이다', () => {
    const callers = buildStageCards(REQ, 2).cards.filter((c) => c.type === 'caller');
    expect(callers).toHaveLength(2);
    // 코드 파일이 매퍼 XML 보다 먼저다 — 둘 다 부르는 곳이 하나뿐이고 깊이가 같으면 이름순.
    expect(callers.map((c) => c.gen.key)).toEqual([DAO, JWT]);
    const jwt = callers[1];
    if (jwt?.payload.track !== 't2' || jwt.payload.kind !== 'radius') throw new Error('shape');
    expect(Object.keys(jwt.payload.core)).toEqual([SVC]);
    expect(jwt.kind).toBe('radius');
    expect(jwt.payload.q).toContain('JwtUtil.java');
  });

  test('exec — 자바 블록에서 실행 추적 카드가 선다 (Java dialect)', () => {
    const exec = buildStageCards(REQ, 2).cards.find((c) => c.type === 'exec');
    if (exec?.payload.track !== 't0') throw new Error('shape');
    expect(exec.payload.kind).toBe('point');
    // 첫 statement 는 77행 — 정의 줄 76 은 오답이다.
    expect(exec.payload.focus).toBe(77);
    expect(exec.conceptId).toBe('exec/order');
  });

  test('layerOf — 파일 이름으로 층을 짐작한다', () => {
    expect(layerOf(FRONT, 0, 5)).toBe(0);
    expect(layerOf(CTRL, 1, 5)).toBe(1);
    expect(layerOf(SVC, 2, 5)).toBe(2);
    expect(layerOf(MAPPER, 4, 5)).toBe(3);
  });
});

describe('형식 둘 — 값 추적과 섞기 (D187 ⑱)', () => {
  test('로그인 챕터에서 값 추적 판이 실제로 구워진다 — 재료는 AuthService.login 이다', () => {
    const { cards } = buildStageCards(REQ, 2);
    const traces = cards.filter((c) => c.type === 'trace-table');
    // 2단은 경로 판이 이미 넷이라 격자는 한 장이다 (`MAX_TRACE`).
    expect(traces).toHaveLength(1);
    const card = traces[0];
    if (card?.payload.track !== 't3' || card.payload.kind !== 'trace') throw new Error('shape');
    const p = card.payload;
    expect(card.stageNo).toBe(2);
    expect(card.conceptId).toBe('common/reassignment');
    expect(p.file).toBe(SVC);
    // 열은 `java-learning.md` §12.5 가 찾아 둔 셋이다 — user 의 상자, role 이 있나, token 이 있나.
    expect(p.cols.map((c) => c.k)).toEqual(['c_user', 'c_role', 'c_token']);
    expect(p.cols[0]?.axis).toBe('obj');
    expect(p.cols[1]?.axis).toBe('var');
    // 시간축에 재대입 줄과 그 **직전 읽기**가 다 있다 — 87 이 빠지면 「DB 만 바뀐다」를 못 묻는다.
    const at = p.rows.map((r) => r.line);
    expect(at).toContain(78);
    expect(at).toContain(84);
    expect(at).toContain(85);
    expect(at.length).toBeLessThanOrEqual(8);
  });

  test('예측 모드는 바뀐 칸만 가린다 — user 는 두 칸, 나머지는 재료로 남는다', () => {
    const card = buildStageCards(REQ, 2).cards.find((c) => c.type === 'trace-table');
    if (card?.payload.track !== 't3' || card.payload.kind !== 'trace') throw new Error('shape');
    const p = card.payload;
    const changed = p.cells.filter((c) => c.carry === null).map((c) => `${c.r}|${c.c}`);
    expect(new Set(p.hidden)).toEqual(new Set(changed));
    // 상자 열은 「없음 → A」와 「A → B」 두 자리에서만 바뀐다.
    expect(p.hidden.filter((k) => k.endsWith('|c_user'))).toHaveLength(2);
    expect(p.hidden.length).toBeLessThan(p.cells.length);
  });

  test('상자 라벨은 대입 순서대로 A · B 다', () => {
    const card = buildStageCards(REQ, 2).cards.find((c) => c.type === 'trace-table');
    if (card?.payload.track !== 't3' || card.payload.kind !== 'trace') throw new Error('shape');
    const user = card.payload.cells.filter((c) => c.c === 'c_user');
    const labels = user.map((c) => (c.v.t === 'box' ? c.v.label : c.v.t));
    expect(labels[0]).toBe('A');
    expect(labels[labels.length - 1]).toBe('B');
  });

  test('order — 줄기마다 한 장, 상한 둘. 조각의 사실이 부르는 방향이다', () => {
    const { cards } = buildStageCards(REQ, 5);
    const orders = cards.filter((c) => c.type === 'order');
    expect(orders).toHaveLength(2);
    const first = orders[0];
    if (first?.payload.track !== 't3' || first.payload.kind !== 'order') throw new Error('shape');
    const p = first.payload;
    expect(first.stageNo).toBe(5);
    expect(first.kind).toBe('reorder');
    expect(p.answer).toEqual([`${FRONT}:21`, `${CTRL}:56`, `${SVC}:20`, `${DAO}:5`, MAPPER]);
    expect([...p.deck].sort()).toEqual([...p.answer].sort());
    expect(p.deck).not.toEqual(p.answer);
    expect(p.pieces[0]?.fact).toContain('AuthController.java');
  });

  test('줄기가 짧으면 사유와 함께 안 낸다', () => {
    const short = { ...REQ, paths: [[hop(FRONT, 21, 'http'), hop(CTRL, null, null)]] };
    const { cards, dropped } = buildStageCards(short, 5);
    expect(cards.filter((c) => c.type === 'order')).toHaveLength(0);
    expect(dropped.some((d) => d.type === 'order')).toBe(true);
  });

  test('재대입이 없는 챕터는 값 추적을 못 굽고 사유를 남긴다 (D186 ④)', () => {
    const noRebind: StageRequest = {
      ...REQ,
      blocks: [BLOCKS[1] as StageBlock],
      paths: [[hop(JWT, 30, 'static'), hop(MAPPER, null, null)]],
    };
    const { cards, dropped } = buildStageCards(noRebind, 2);
    expect(cards.filter((c) => c.type === 'trace-table')).toHaveLength(0);
    expect(dropped.find((d) => d.type === 'trace-table')?.reason).toContain('대입');
  });
});

describe('3단 · 예측', () => {
  test('cut — 카탈로그 넷 중 소프트 삭제·throw 가드·orElseThrow 를 찾는다', () => {
    const guards = findGuards([FILES.get(MAPPER) as StageFile, FILES.get(SVC) as StageFile]);
    expect(guards.map((g) => g.kind)).toEqual(['soft', 'orElse', 'throw']);
    expect(guards[0]?.line.n).toBe(34);
    expect(guards[0]?.ok).toContain('90행');
  });

  test('cut 카드 — 정답은 그 가드의 결과, 「안 달라진다」에는 막던 입력이 붙는다', () => {
    const cuts = buildStageCards(REQ, 3).cards.filter((c) => c.type === 'cut');
    expect(cuts.length).toBe(3);
    const soft = cuts.find((c) => c.payload.track === 't3' && c.payload.kind === 'cut' && c.payload.file === MAPPER);
    if (soft?.payload.track !== 't3' || soft.payload.kind !== 'cut') throw new Error('shape');
    expect(soft.payload.options[soft.payload.answer]?.t).toContain('지운 것으로 표시된 행');
    const nothing = soft.payload.options.findIndex((o) => o.t === '아무것도 달라지지 않는다');
    expect(soft.payload.why[nothing]?.t).toContain('deleted_date');
  });

  test('reorder — 선언–사용 쌍은 「깨진다」, 무관한 쌍은 「안 달라진다」', () => {
    const pairs = swapPairs(BLOCKS[0] as StageBlock);
    expect(pairs?.map((p) => p.what)).toEqual(['breaks', 'stale', 'breaks', 'breaks']);
    expect(pairs?.[0]?.name).toBe('loginId');
    expect(pairs?.[1]?.name).toBe('user');
    const cards = buildStageCards(REQ, 3).cards.filter((c) => c.type === 'reorder');
    expect(cards).toHaveLength(2);
    const first = cards[0];
    if (first?.payload.track !== 't3' || first.payload.kind !== 'reorder') throw new Error('shape');
    expect(first.payload.q).toBe('77행과 78행을 뒤집으면 무엇이 달라질까요?');
    expect(first.payload.options[first.payload.answer]?.t).toContain('아직 없어서 깨진다');
  });

  test('contract — 정답은 이름을 읽는 첫 자리, 둘째 물음은 이유 4지', () => {
    const contracts = buildStageCards(REQ, 3).cards.filter((c) => c.type === 'contract');
    expect(contracts).toHaveLength(2);
    const token = contracts[0];
    if (token?.payload.track !== 't3' || token.payload.kind !== 'contract') throw new Error('shape');
    expect(token.payload.options[token.payload.answer]?.l).toBe(24);
    expect(token.payload.reason?.options).toHaveLength(4);
    expect(token.payload.reason?.options[token.payload.reason.answer]?.t).toContain('JSON');
  });
});

describe('4단 · 수정', () => {
  test('fix 커밋의 hunk 셋이 patch-line · patch-place · rollback 이 된다', () => {
    const { cards } = buildStageCards(REQ, 4);
    expect(cards.map((c) => c.type).sort()).toEqual(['patch-line', 'patch-place', 'rollback']);
    const line = cards.find((c) => c.type === 'patch-line');
    if (line?.payload.kind !== 'repair') throw new Error('shape');
    expect(line.payload.expected).toEqual(['        String role = user.getRole() != null ? user.getRole() : "USER";']);
    expect(line.payload.lines[line.payload.target]).toBe('        String role = "USER";');
    expect(line.payload.goal).toBe('사용자 정보 조회 시 role 값 추가');
    expect(line.payload.q).toBe('「사용자 정보 조회 시 role 값 추가」이 되도록 86행을 고쳐 보세요.');
    expect(line.commitId).toBe(1);
    expect(line.payload.promptLines.length).toBeLessThanOrEqual(9);
    const place = cards.find((c) => c.type === 'patch-place');
    if (place?.payload.kind !== 'repair') throw new Error('shape');
    expect(place.payload.target).toBe(4);
    expect(place.payload.lines).toHaveLength(5);
    const back = cards.find((c) => c.type === 'rollback');
    if (back?.payload.kind !== 'repair') throw new Error('shape');
    expect(back.payload.expected).toHaveLength(4);
    expect(back.payload.lines).toHaveLength(5);
  });

  test('fix 가 아닌 커밋은 정답지가 아니다', () => {
    const out = buildStageCards({ ...REQ, commits: [COMMITS[2] as StageCommit] }, 4);
    expect(out.cards).toHaveLength(0);
    expect(out.dropped[0]?.reason).toContain('fix');
    expect(fixSubject('fix(auth)!: 제목')).toBe('제목');
  });
});

describe('5단 · 재구현', () => {
  test('reimpl-spec · handoff 는 같은 블록, reimpl-layer 는 이웃 층과의 연결을 든다', () => {
    const { cards } = buildStageCards(REQ, 5);
    // 뒤 둘은 5단의 1겹 — 섞기(`order`)가 페이딩 앞에 선다 (D187 ⑱ · `pedagogy.md` §2.2).
    expect(cards.map((c) => c.type)).toEqual(['reimpl-spec', 'handoff', 'reimpl-layer', 'order', 'order']);
    const spec = cards[0];
    if (spec?.payload.kind !== 'reimpl') throw new Error('shape');
    expect(spec.payload.original).toHaveLength(14);
    expect(spec.payload.fn).toBe('login');
    const layer = cards[2];
    if (layer?.payload.kind !== 'reimpl') throw new Error('shape');
    expect(layer.payload.links.length).toBeGreaterThan(0);
    expect(layer.payload.context.length).toBeGreaterThan(0);
  });

  test('linksBetween — 매퍼 id 와 호출 이름이 연결이다', () => {
    const links = linksBetween(
      ['    <select id="findByLoginId" resultMap="UserResultMap">', '        WHERE login_id = #{loginId}'],
      ['    Optional<User> findByLoginId(@Param("loginId") String loginId);'],
    );
    expect(links).toContain('findByLoginId');
    expect(links).toContain('loginId');
  });
});

describe('결정성 · 원장', () => {
  test('같은 입력이면 다섯 단 전부 같은 카드다 — 해시·보기 순서까지', () => {
    const a = buildCourseCards(REQ);
    const b = buildCourseCards(REQ);
    expect(a).toEqual(b);
    const hashes = a.flatMap((s) => s.cards.map((c) => c.contentHash));
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  test('attempt 가 바뀌면 보기 순서만 바뀌고 정답 내용은 같다', () => {
    const a = buildStageCards(REQ, 3).cards.find((c) => c.type === 'contract');
    const b = buildStageCards({ ...REQ, attempt: 1 }, 3).cards.find((c) => c.type === 'contract');
    if (a?.payload.track !== 't3' || a.payload.kind !== 'contract' || b?.payload.track !== 't3' || b.payload.kind !== 'contract') throw new Error('shape');
    expect(a.payload.options[a.payload.answer]).toEqual(b.payload.options[b.payload.answer]);
  });

  test('모든 코스 카드는 track t3 · stage_no 가 있고 kind 가 CHECK 목록 안이다', () => {
    const kinds = new Set(['meaning', 'blank', 'point', 'transcribe', 'placement', 'radius', 'flow', 'direction', 'entry', 'role', 'repair', 'reimpl', 'twin', 'origin', 'cut', 'reorder', 'contract']);
    for (const stage of buildCourseCards(REQ)) {
      for (const c of stage.cards) {
        expect(c.track).toBe('t3');
        expect(c.stageNo).toBe(stage.stageNo);
        expect(kinds.has(c.kind)).toBe(true);
      }
    }
  });

  test('줄기가 없으면 사유와 함께 아무것도 안 낸다', () => {
    const out = buildStageCards({ ...REQ, paths: [] }, 2);
    expect(out.cards).toHaveLength(0);
    expect(out.dropped.some((d) => d.type === 'hop')).toBe(true);
  });
});
