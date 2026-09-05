/**
 * 재료 → `StageRequest` (D172 ①·④). 글자로 만드는 둘 — `origin` 의 이름 자리와 `contract` 의
 * 응답 키 — 가 로그인 표본에서 나오는지, 큰 파일의 부분 읽기가 사용처를 거르는지 본다.
 */
import { describe, expect, test } from 'vitest';

import { loadDict } from '@chickadee/dictionary';
import type { ConceptId, ConceptSite } from '@chickadee/store-sql';

import {
  assembleStageRequest, deriveNames, deriveResponseKeys, loadedSites, stageBlocks, stageGrammar,
  type FileText, type Materials,
} from './materials.js';

const dict = loadDict();

const MAPPER = 'BACK/src/main/resources/mapper/UserMapper.xml';
const DDL = 'BACK/dream_DB.sql';
const ENTITY = 'BACK/src/main/java/x/entity/User.java';
const RES = 'BACK/src/main/java/x/dto/LoginResponse.java';
const SVC = 'BACK/src/main/java/x/service/AuthService.java';
const FRONT = 'FRONT/src/services/authService.js';
const VUE = 'FRONT/src/views/LandingView.vue';

const file = (path: string, fileId: number, grammar: string | null, from: number, ...text: string[]): FileText => ({
  path, fileId, grammar, lineCount: from + text.length - 1, lines: text.map((t, i) => ({ n: from + i, t })),
});

const FILES: FileText[] = [
  file(MAPPER, 1, 'mybatis', 14, '    <resultMap id="UserResultMap" type="com.x.entity.User">', '        <result property="role" column="role"/>', '    </resultMap>'),
  file(DDL, 2, 'sql', 12, 'CREATE TABLE users (', '  user_id BIGINT PRIMARY KEY,', "  role VARCHAR(20) NOT NULL DEFAULT 'USER'", ');'),
  file(ENTITY, 3, 'java', 8, 'public class User {', '    private Long userId;', '    private String role;', '}'),
  file(RES, 4, 'java', 10, 'public class LoginResponse {', '    private String token;', '    private String role;', '    private Long id;', '}'),
  file(SVC, 5, 'java', 76, '    public LoginResponse login(LoginRequest request) {', '        String role = user.getRole() != null ? user.getRole() : "USER";', '        return LoginResponse.builder().role(role).build();', '    }'),
  file(FRONT, 6, 'javascript', 20, 'export async function login(credentials) {', '  const response = await api.post("/auth/login", credentials);', '  localStorage.setItem("accessToken", response.data.token);', '  return { role: response.data.role };', '}'),
];

const hop = (path: string, line: number | null, kind: 'http' | 'static' | null) => ({ path, line, kind });
const PATHS = [[hop(FRONT, 21, 'http'), hop(SVC, 77, 'static'), hop(MAPPER, null, null)]];

const site = (id: number, path: string, conceptId: string, line: number): { site: ConceptSite; path: string } => ({
  path,
  site: {
    id, repoId: 1, fileId: 0, conceptId: conceptId as ConceptId, siteKey: `k${id}`,
    lineStart: line, lineEnd: line, colStart: 0, colEnd: 0, tsNodeKind: null, form: null, shape: 's', occurrence: 0,
    excerpt: '', picks: {}, hole: null, ctx: {}, lineConcepts: [], uncoveredRatio: 0, confidence: 'syntactic',
    parseQuality: 'ok', isDirty: false, isOversize: false, commitId: null, unknownCount: 0, isAlive: true, updatedAt: 0,
  },
});

const M: Materials = {
  repoId: 1, unitId: 1, unitName: 'auth', dictVersion: 'd', attempt: 0, concepts: dict.concepts,
  files: FILES, paths: PATHS, edges: [], sites: [site(1, SVC, 'common/conditional-expression', 77), site(2, FRONT, 'common/async-await', 21), site(3, VUE, 'common/function-call', 999)],
  blocks: [{ path: SVC, blockId: 9, name: 'login', from: 76, to: 79, hash: 'h', ast: null }],
  bindings: [{ path: MAPPER, line: 15, column: 'role', property: 'role', entity: 'com.x.entity.User', entityPath: ENTITY, table: 'users' }],
  columns: [{ table: 'users', column: 'role', path: DDL, line: 14 }],
  commits: [], tests: [], layerOf: () => 0,
};

describe('deriveNames — 이름이 정해지고 옮겨지고 읽히는 자리', () => {
  test('매퍼·DDL 이 define, 엔티티 필드·빌더가 carry, getter·프런트 .role 이 read', () => {
    const names = deriveNames(M);
    const role = names.filter((n) => n.name === 'role');
    const at = (path: string, line: number) => role.find((n) => n.path === path && n.line === line);
    expect(at(MAPPER, 15)?.role).toBe('define');
    expect(at(DDL, 14)?.role).toBe('define');
    expect(at(ENTITY, 10)?.role).toBe('carry');
    expect(at(SVC, 77)?.role).toBe('read');
    expect(at(SVC, 78)?.role).toBe('carry');
    expect(at(FRONT, 23)?.role).toBe('read');
    expect(role.length).toBeGreaterThanOrEqual(6);
  });

  test('읽는 자리가 하나도 없는 이름은 안 낸다', () => {
    const names = deriveNames({ ...M, files: FILES.filter((f) => f.path !== SVC && f.path !== FRONT) });
    expect(names).toEqual([]);
  });
});

describe('deriveResponseKeys — 응답 클래스의 필드를 프런트가 읽는 자리', () => {
  test('token·role 은 읽히고 id 는 안 읽힌다', () => {
    const keys = deriveResponseKeys(M);
    expect(keys.map((k) => k.key).sort()).toEqual(['role', 'token']);
    const token = keys.find((k) => k.key === 'token')!;
    expect(token.maker).toEqual({ path: RES, line: 11, text: '    private String token;' });
    expect(token.reads).toEqual([{ path: FRONT, line: 22, text: '  localStorage.setItem("accessToken", response.data.token);' }]);
  });
});

describe('assembleStageRequest', () => {
  test('읽어 온 줄 밖의 사용처는 빠진다 — 창이 빈 판을 안 만든다', () => {
    expect(loadedSites(M).map((s) => s.site.id)).toEqual([1, 2]);
    const req = assembleStageRequest(M);
    expect(req.sites?.length).toBe(2);
  });

  test('블록은 범위 안 사용처의 개념을 싣고, 문법은 문항 키로 바뀐다', () => {
    const blocks = stageBlocks(M);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.concepts).toEqual([{ conceptId: 'common/conditional-expression', layer: 0, siteCount: 1, siteId: 1 }]);
    expect(blocks[0]?.grammar).toBe('java');
    expect(stageGrammar('vue')).toBe('javascript');
    expect(stageGrammar('mybatis')).toBe('xml');
    expect(stageGrammar('vue_style')).toBeNull();
    const req = assembleStageRequest(M);
    expect(req.files.get(MAPPER)?.grammar).toBe('xml');
    expect(req.names?.length).toBeGreaterThan(0);
    expect(req.responseKeys?.length).toBe(2);
  });
});
