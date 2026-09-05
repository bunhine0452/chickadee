/**
 * 코스 카드 굽기 (D172) — **진짜 sqlite** 위에서 statement 를 그대로 돌린다. 재료는 로그인 챕터를
 * 줄인 리포 하나(파일 아홉 · 줄기 둘 · fix 커밋 하나 · 스키마 한 표)이고, 파일 읽기와 파서만
 * 흉내 낸다. 여기서 재는 것은 「생성기가 낸 판이 원장에 들어가고, 두 번 굽지 않고, 사용처 없는
 * 개념이 D154 의 가지에 서는가」다.
 */
import { createRequire } from 'node:module';

import { loadDict } from '@chickadee/dictionary';
import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000;
let db: SqliteDb;

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  const stmt = db.prepare(sql);
  if (stmt.reader) return stmt.all(bound) as unknown[];
  const info = stmt.run(bound);
  return [{ changes: info.changes, lastId: Number(info.lastInsertRowid) }];
}

// ───────── 리포 (로그인 챕터를 줄인 것) ─────────

const FRONT = 'FRONT/src/services/authService.js';
const CTRL = 'BACK/src/main/java/x/controller/AuthController.java';
const SVC = 'BACK/src/main/java/x/service/AuthService.java';
const DAO = 'BACK/src/main/java/x/dao/UserDao.java';
const MAPPER = 'BACK/src/main/resources/mapper/UserMapper.xml';
const JWT = 'BACK/src/main/java/x/security/JwtUtil.java';
const ENTITY = 'BACK/src/main/java/x/entity/User.java';
const RES = 'BACK/src/main/java/x/dto/LoginResponse.java';
const DDL = 'BACK/dream_DB.sql';

const SVC_NEW = [
  'package x.service;',
  'import x.dao.UserDao;',
  'import x.security.JwtUtil;',
  'public class AuthService {',
  '    public void signup(SignupRequest request) {',
  '        userDao.insert(request.toUser());',
  '    }',
  '    public LoginResponse login(LoginRequest request) {',
  '        String loginId = request.getLoginId();',
  '        User user = userDao.findByLoginId(loginId)',
  '                .orElseThrow(() -> new UnauthorizedException("비밀번호가 일치하지 않습니다."));',
  '        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {',
  '            throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");',
  '        }',
  '        resetDailyCoinIfNeeded(user.getUserId());',
  '        String role = user.getRole() != null ? user.getRole() : "USER";',
  '        String token = jwtUtil.generateToken(user.getUserId(), loginId, role);',
  '        return LoginResponse.builder().token(token).role(role).build();',
  '    }',
  '    public void logout() {',
  '    }',
  '}',
];
const SVC_OLD = SVC_NEW.map((l) => (l.includes('new UnauthorizedException("비밀번호가 일치하지 않습니다."));')
  ? '                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));'
  : l));

const FILES: Record<string, string[]> = {
  [FRONT]: [
    'import api from "./api";',
    '',
    'export async function signup(form) {',
    '  const response = await api.post("/auth/signup", form);',
    '  return response.data;',
    '}',
    '',
    'export async function login(credentials) {',
    '  const response = await api.post("/auth/login", credentials);',
    '  if (!response) return null;',
    '  if (response.data.token) {',
    '    localStorage.setItem("accessToken", response.data.token);',
    '  }',
    '  const total = credentials.count + 1;',
    '  return { role: response.data.role, total };',
    '}',
  ],
  [CTRL]: [
    'package x.controller;',
    '@RequestMapping("/api/auth")',
    'public class AuthController {',
    '    private final AuthService authService;',
    '    @PostMapping("/signup")',
    '    public ResponseEntity<Void> signup(@RequestBody SignupRequest request) {',
    '        authService.signup(request);',
    '        return ResponseEntity.ok().build();',
    '    }',
    '    @PostMapping("/login")',
    '    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {',
    '        LoginResponse response = authService.login(request);',
    '        return ResponseEntity.ok(response);',
    '    }',
    '}',
  ],
  [SVC]: SVC_NEW,
  [DAO]: [
    'package x.dao;',
    'import org.apache.ibatis.annotations.Mapper;',
    '@Mapper',
    'public interface UserDao {',
    '    Optional<User> findByLoginId(@Param("loginId") String loginId);',
    '    void insert(User user);',
    '}',
  ],
  [MAPPER]: [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mapper namespace="x.dao.UserDao">',
    '    <resultMap id="UserResultMap" type="x.entity.User">',
    '        <result property="userId" column="user_id"/>',
    '        <result property="role" column="role"/>',
    '    </resultMap>',
    '    <insert id="insert">',
    '        INSERT INTO users (login_id, role) VALUES (#{loginId}, DEFAULT)',
    '    </insert>',
    '    <select id="findByLoginId" resultMap="UserResultMap">',
    '        SELECT * FROM users',
    '        WHERE login_id = #{loginId}',
    '          AND deleted_date IS NULL',
    '    </select>',
    '    <update id="deleteUser">',
    '        UPDATE users',
    '        SET deleted_date = NOW()',
    '        WHERE user_id = #{userId}',
    '    </update>',
    '</mapper>',
  ],
  [JWT]: [
    'package x.security;',
    'public class JwtUtil {',
    '    private final Key secretKey;',
    '    public String generateToken(Long userId, String loginId, String role) {',
    '        Date now = new Date();',
    '        JwtBuilder builder = Jwts.builder();',
    '        builder.setSubject(String.valueOf(userId));',
    '        builder.claim("role", role);',
    '        builder.signWith(secretKey, SignatureAlgorithm.HS256);',
    '        return builder.compact();',
    '    }',
    '}',
  ],
  [ENTITY]: ['package x.entity;', 'public class User {', '    private Long userId;', '    private String role;', '}'],
  [RES]: ['package x.dto;', 'public class LoginResponse {', '    private String token;', '    private String role;', '}'],
  [DDL]: [
    'CREATE TABLE users (',
    '  user_id BIGINT PRIMARY KEY,',
    '  login_id VARCHAR(50) NOT NULL,',
    "  role VARCHAR(20) NOT NULL DEFAULT 'USER',",
    '  deleted_date DATETIME',
    ');',
  ],
};
const REVS: Record<string, string[]> = { [`base0sha:${SVC}`]: SVC_OLD, [`fix1sha:${SVC}`]: SVC_NEW };

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(ops.map((op) => run(op.name, op.params)[0])),
    },
    file: {
      readLines: (req: { relPath: string; from: number; to: number; rev?: string }) => {
        const text = req.rev === undefined ? FILES[req.relPath] : REVS[`${req.rev}:${req.relPath}`];
        if (text === undefined) return Promise.reject(new Error(`no file: ${req.relPath}@${req.rev ?? 'wt'}`));
        return Promise.resolve({
          relPath: req.relPath, rev: req.rev ?? null, from: req.from, to: req.to,
          lines: text.slice(req.from - 1, req.to), totalLines: text.length, hadInvalidUtf8: false,
        });
      },
    },
    // vitest 에는 파서가 없다 — AST 가 필요한 유형(exec·reorder)은 여기서 빠진다.
    parse: { snippet: () => Promise.reject(new Error('no parser')) },
  },
  on: () => Promise.resolve(() => undefined),
  log: { info: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined },
  IpcError: class extends Error {},
}));

const { materializeDict } = await import('@chickadee/concepts');
const { bakeChapter, bakeSiteless, ensureChapterBaked } = await import('./bake.js');

const dict = loadDict();
const deps = { repoId: 1, rootPath: '/repo', dict, now: T };

const PATHS = [FRONT, CTRL, SVC, DAO, MAPPER, JWT, ENTITY, RES, DDL];
const fileId = (path: string): number => PATHS.indexOf(path) + 1;
const lineOf = (path: string, needle: string): number => {
  const i = (FILES[path] as string[]).findIndex((l) => l.includes(needle));
  if (i < 0) throw new Error(`fixture: ${needle}`);
  return i + 1;
};

function seed(): void {
  db.exec(`INSERT INTO repo (id, root_path, name, added_at) VALUES (1, '/repo', 'mm', ${T})`);
  const file = db.prepare('INSERT INTO file (id, repo_id, path, grammar, line_count, updated_at) VALUES (?, 1, ?, ?, ?, ?)');
  const grammarOf: Record<string, string> = {
    [FRONT]: 'javascript', [CTRL]: 'java', [SVC]: 'java', [DAO]: 'java', [MAPPER]: 'mybatis', [JWT]: 'java',
    [ENTITY]: 'java', [RES]: 'java', [DDL]: 'sql',
  };
  for (const p of PATHS) file.run(fileId(p), p, grammarOf[p], (FILES[p] as string[]).length, T);

  db.exec("INSERT INTO unit (id, repo_id, name, source, order_idx) VALUES (1, 1, 'auth', 'dir', 0)");
  const uf = db.prepare('INSERT INTO unit_file (unit_id, file_id) VALUES (1, ?)');
  for (const p of [FRONT, CTRL, SVC, DAO, MAPPER, JWT, ENTITY, RES]) uf.run(fileId(p));
  db.exec(`INSERT INTO chapter (unit_id, origin, updated_at) VALUES (1, 'entry', ${T})`);

  const path = db.prepare('INSERT INTO request_path (id, repo_id, unit_id, entry_file_id, entry_line, label, hop_count, updated_at) VALUES (?, 1, 1, ?, ?, ?, ?, ?)');
  const hop = db.prepare('INSERT INTO request_hop (path_id, ord, file_id, name, line_start, line_end, called_line, depth, kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const login = lineOf(FRONT, '"/auth/login"');
  path.run(1, fileId(FRONT), login, 'POST /auth/login', 6, T);
  hop.run(1, 0, fileId(FRONT), 'login', lineOf(FRONT, 'function login'), 16, null, 0, null);
  hop.run(1, 1, fileId(CTRL), 'login', lineOf(CTRL, '@PostMapping("/login")'), 14, login, 1, 'http');
  hop.run(1, 2, fileId(SVC), 'login', lineOf(SVC, 'LoginResponse login('), 19, lineOf(CTRL, 'authService.login('), 2, 'call');
  hop.run(1, 3, fileId(DAO), 'findByLoginId', lineOf(DAO, 'findByLoginId'), lineOf(DAO, 'findByLoginId'), lineOf(SVC, 'userDao.findByLoginId'), 3, 'call');
  hop.run(1, 4, fileId(MAPPER), 'findByLoginId', lineOf(MAPPER, 'id="findByLoginId"'), 14, lineOf(DAO, 'findByLoginId'), 4, 'mapper');
  hop.run(1, 5, fileId(JWT), 'generateToken', lineOf(JWT, 'generateToken('), 11, lineOf(SVC, 'jwtUtil.generateToken'), 3, 'call');
  const signup = lineOf(FRONT, '"/auth/signup"');
  path.run(2, fileId(FRONT), signup, 'POST /auth/signup', 5, T);
  hop.run(2, 0, fileId(FRONT), 'signup', lineOf(FRONT, 'function signup'), 6, null, 0, null);
  hop.run(2, 1, fileId(CTRL), 'signup', lineOf(CTRL, '@PostMapping("/signup")'), 9, signup, 1, 'http');
  hop.run(2, 2, fileId(SVC), 'signup', lineOf(SVC, 'void signup('), 7, lineOf(CTRL, 'authService.signup('), 2, 'call');
  hop.run(2, 3, fileId(DAO), 'insert', lineOf(DAO, 'void insert'), lineOf(DAO, 'void insert'), lineOf(SVC, 'userDao.insert'), 3, 'call');
  hop.run(2, 4, fileId(MAPPER), 'insert', lineOf(MAPPER, 'id="insert"'), 9, lineOf(DAO, 'void insert'), 4, 'mapper');

  const site = db.prepare('INSERT INTO concept_site (repo_id, file_id, concept_id, site_key, line_start, line_end, col_start, col_end, shape, excerpt, picks_json, updated_at) VALUES (1, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)');
  const sites: [string, string, string][] = [
    [SVC, 'common/absent-value', '.orElseThrow('],
    [FRONT, 'common/absent-value', 'return null'],
    [SVC, 'common/comparison', 'passwordEncoder.matches'],
    [CTRL, 'common/function-call', 'authService.login('],
    [FRONT, 'common/async-await', 'await api.post("/auth/login"'],
    [FRONT, 'ts/arithmetic', 'credentials.count + 1'],
  ];
  sites.forEach(([p, concept, needle], i) => {
    const n = lineOf(p, needle);
    site.run(fileId(p), concept, `k${i}`, n, n, 's', (FILES[p] as string[])[n - 1], '{"1":"+"}', T);
  });

  const block = db.prepare("INSERT INTO block (repo_id, file_id, name, kind, line_start, line_end, text_hash, updated_at) VALUES (1, ?, ?, 'function', ?, ?, ?, ?)");
  block.run(fileId(SVC), 'login', lineOf(SVC, 'LoginResponse login('), 19, 'h-svc-login', T);
  block.run(fileId(SVC), 'signup', lineOf(SVC, 'void signup('), 7, 'h-svc-signup', T);
  block.run(fileId(FRONT), 'login', lineOf(FRONT, 'function login'), 16, 'h-front-login', T);
  block.run(fileId(FRONT), 'signup', lineOf(FRONT, 'function signup'), 6, 'h-front-signup', T);
  block.run(fileId(CTRL), 'login', lineOf(CTRL, '@PostMapping("/login")'), 14, 'h-ctrl-login', T);
  block.run(fileId(JWT), 'generateToken', lineOf(JWT, 'generateToken('), 11, 'h-jwt', T);
  block.run(fileId(MAPPER), 'findByLoginId', lineOf(MAPPER, 'id="findByLoginId"'), 14, 'h-map-find', T);

  db.exec(`INSERT INTO git_commit (id, repo_id, sha, parent_sha, parent_count, authored_at, message, files_n, insertions, deletions, is_reachable, kind, author_matched)
           VALUES (1, 1, 'fix1sha', 'base0sha', 1, ${T}, 'fix: 없는 아이디도 401 로', 1, 1, 1, 1, 'normal', 1)`);
  db.prepare("INSERT INTO commit_file (commit_id, path, status, additions, deletions, touched_json) VALUES (1, ?, 'M', 1, 1, '[[11,11]]')").run(SVC);

  db.prepare('INSERT INTO db_table (id, repo_id, name, file_id, line) VALUES (1, 1, ?, ?, 1)').run('users', fileId(DDL));
  const col = db.prepare('INSERT INTO db_column (table_id, ord, name, type, not_null, default_value, line) VALUES (1, ?, ?, ?, 1, ?, ?)');
  col.run(0, 'user_id', 'BIGINT', null, 2);
  col.run(3, 'role', 'VARCHAR(20)', "'USER'", lineOf(DDL, 'role VARCHAR'));
  db.prepare('INSERT INTO db_binding (repo_id, file_id, line, column_name, property, entity, entity_file_id, table_id) VALUES (1, ?, ?, ?, ?, ?, ?, 1)')
    .run(fileId(MAPPER), lineOf(MAPPER, 'property="role"'), 'role', 'role', 'x.entity.User', fileId(ENTITY));
}

const count = (sql: string): number => (db.prepare(sql).get() as { n: number }).n;

beforeEach(async () => {
  db = new Database(':memory:');
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');
  await materializeDict(dict, T);
  seed();
});

describe('bakeChapter', () => {
  test('로그인 챕터에 다섯 단의 판이 구워진다', async () => {
    const bake = await bakeChapter(deps, 1);
    expect(bake.unitName).toBe('auth');
    const by = new Map(bake.stages.map((s) => [s.stageNo, s]));
    // 2단 — 줄기 둘(로그인·회원가입)에서 hop 둘. 노드는 `path:line`.
    expect(by.get(2)?.byType['hop']).toBe(2);
    // 1단 — 쌍둥이: `absent-value` 가 서비스와 프런트에 하나씩.
    expect(by.get(1)?.byType['twin']).toBeGreaterThanOrEqual(1);
    // 3단 — 가드: 매퍼의 soft delete + 서비스의 if/throw.
    expect(by.get(3)?.byType['cut']).toBeGreaterThanOrEqual(2);
    // 4단 — fix 커밋 한 줄 바꿈 → patch-line.
    expect(by.get(4)?.byType['patch-line']).toBe(1);
    // 5단 — 12줄짜리 login 블록 → reimpl-spec + handoff.
    expect(by.get(5)?.byType['reimpl-spec']).toBe(1);
    expect(by.get(5)?.byType['handoff']).toBe(1);

    const total = bake.stages.reduce((n, s) => n + s.baked, 0);
    expect(count("SELECT COUNT(*) AS n FROM card WHERE unit_id = 1 AND track = 't3' AND stage_no IS NOT NULL")).toBe(total);
    // 생성기의 자리표(음수)는 원장에 안 들어간다 — 외래키가 켜진 채 통과했다.
    expect(count('SELECT COUNT(*) AS n FROM card WHERE site_id IS NOT NULL AND site_id < 0')).toBe(0);
    const counts = run('card.stage_counts', { unitId: 1 }) as { stage_no: number; n: number }[];
    expect(counts.reduce((n, c) => n + c.n, 0)).toBe(total);
  });

  test('hop 의 정답은 등뼈의 path:line 이고 곁가지(JwtUtil)는 없다', async () => {
    await bakeChapter(deps, 1);
    const rows = db.prepare("SELECT payload_json FROM card WHERE unit_id = 1 AND kind = 'flow' ORDER BY id").all() as { payload_json: string }[];
    const answers = rows.map((r) => (JSON.parse(r.payload_json) as { flow: { answer: string[] } }).flow.answer);
    const login = answers.find((a) => a[0] === `${FRONT}:${lineOf(FRONT, '"/auth/login"')}`);
    expect(login).toEqual([
      `${FRONT}:${lineOf(FRONT, '"/auth/login"')}`, `${CTRL}:${lineOf(CTRL, 'authService.login(')}`,
      `${SVC}:${lineOf(SVC, 'userDao.findByLoginId')}`, `${DAO}:${lineOf(DAO, 'findByLoginId')}`, MAPPER,
    ]);
    expect(answers.flat().some((id) => id.startsWith(JWT))).toBe(false);
  });

  test('두 번 구우면 새 판이 0 이고 전부 건너뛴다 — 증분 인제스트가 챕터를 안 겹친다', async () => {
    const first = await bakeChapter(deps, 1);
    const again = await bakeChapter(deps, 1);
    expect(again.stages.reduce((n, s) => n + s.baked, 0)).toBe(0);
    expect(again.stages.reduce((n, s) => n + s.skipped, 0)).toBe(first.stages.reduce((n, s) => n + s.baked, 0));
    expect(await ensureChapterBaked(deps, 1)).toBeNull();
  });

  test('판이 없는 챕터는 ensureChapterBaked 가 굽는다', async () => {
    const made = await ensureChapterBaked(deps, 1);
    expect(made?.stages.reduce((n, s) => n + s.baked, 0)).toBeGreaterThan(0);
  });

  test('4단 정답지는 두 판의 diff 다 — 뺀 줄이 옛 판, 기대 줄이 새 판', async () => {
    await bakeChapter(deps, 1);
    const row = db.prepare("SELECT payload_json, commit_id FROM card WHERE unit_id = 1 AND kind = 'repair'").get() as { payload_json: string; commit_id: number };
    const p = JSON.parse(row.payload_json) as { type: string; lines: string[]; expected: string[]; target: number };
    expect(row.commit_id).toBe(1);
    expect(p.type).toBe('patch-line');
    expect(p.lines[p.target]).toContain('ResourceNotFoundException');
    expect(p.expected[0]).toContain('UnauthorizedException');
  });
});

describe('bakeSiteless — 규약과 기계 (D154 의 가지가 찬다)', () => {
  test('JWT 는 줄기 위 JwtUtil 블록에, cs/floating-point 는 ts/arithmetic 의 창을 빌려 선다', async () => {
    const out = await bakeSiteless(deps);
    expect(out.proto).toBeGreaterThanOrEqual(1);
    expect(out.cs).toBeGreaterThanOrEqual(1);
    const rows = db.prepare("SELECT concept_id, track, kind, site_id, unit_id FROM card WHERE track = 't0' ORDER BY concept_id")
      .all() as { concept_id: string; track: string; kind: string; site_id: number | null; unit_id: number | null }[];
    expect(rows.some((r) => r.concept_id === 'proto/jwt')).toBe(true);
    expect(rows.some((r) => r.concept_id === 'cs/floating-point')).toBe(true);
    for (const r of rows) {
      expect(r.kind).toBe('meaning');
      expect(r.site_id).toBeNull();
      expect(r.unit_id).toBeNull();
    }
    // 큐의 가지(D154)가 집는 조건 — 사용처 없는 t0 카드가 은퇴 안 한 채 있다.
    const branch = run('queue.new_candidates', { repoId: 1 }) as { id: string; site_count: number }[];
    expect(branch.some((c) => c.id === 'proto/jwt' && c.site_count === 0)).toBe(true);
    expect(branch.some((c) => c.id === 'cs/floating-point' && c.site_count === 0)).toBe(true);
  });

  test('두 번 구우면 전부 건너뛴다', async () => {
    const first = await bakeSiteless(deps);
    const again = await bakeSiteless(deps);
    expect(again.proto + again.cs).toBe(0);
    expect(again.skipped).toBe(first.proto + first.cs);
  });
});
