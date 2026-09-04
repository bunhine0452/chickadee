import { describe, expect, test } from 'vitest';

import type { RawImport } from './derive.js';
import { resolveImports, type ResolveInput, type ResolvedEdge } from './resolve-imports.js';

/** `_imports` 캡처 한 건. 기본 `form` 은 `.scm` 이 가장 자주 내는 값이다. */
const spec = (specifier: string, form: string | null = 'static'): RawImport =>
  ({ specifier, form, line: 1 });

/** 엣지를 눈으로 읽히는 한 줄로. 기대값을 표처럼 적으려고 쓴다. */
const lines = (edges: readonly ResolvedEdge[]): string[] =>
  edges.map((e) => `${e.from} -> ${e.to} (${e.kind})`);

/** 파일 하나가 지정자 몇 개를 낸 입력. 대부분의 케이스가 이 모양이다. */
function one(path: string, imports: RawImport[], rest: Omit<ResolveInput, 'files'>): ResolvedEdge[] {
  return resolveImports({ ...rest, files: [{ path, imports }] });
}

describe('ts/js (04 §7.1 1행)', () => {
  test('상대 지정자에 확장자를 붙여 푼다', () => {
    const edges = one('src/a.ts', [spec('./b')], { paths: ['src/a.ts', 'src/b.ts'] });
    expect(edges).toStrictEqual([
      { from: 'src/a.ts', to: 'src/b.ts', kind: 'static', confidence: 'syntactic' },
    ]);
  });

  test('디렉터리 지정자는 index 로 간다', () => {
    const edges = one('src/a.ts', [spec('./lib')], { paths: ['src/a.ts', 'src/lib/index.ts'] });
    expect(lines(edges)).toStrictEqual(['src/a.ts -> src/lib/index.ts (static)']);
  });

  test('`..` 로 위로 올라간다', () => {
    const edges = one('src/api/cart.ts', [spec('../lib/money.ts')], {
      paths: ['src/api/cart.ts', 'src/lib/money.ts'],
    });
    expect(lines(edges)).toStrictEqual(['src/api/cart.ts -> src/lib/money.ts (static)']);
  });

  test('tsconfig baseUrl + paths', () => {
    const edges = one('src/a.ts', [spec('@/shared/util')], {
      paths: ['src/a.ts', 'src/shared/util.ts'],
      tsconfig: { baseUrl: '.', paths: { '@/*': ['src/*'] } },
    });
    expect(lines(edges)).toStrictEqual(['src/a.ts -> src/shared/util.ts (static)']);
  });

  test('paths 는 선언 순 첫 매치다 — 뒤의 더 긴 패턴은 보지 않는다', () => {
    const edges = one('src/a.ts', [spec('@/shared/util')], {
      paths: ['src/a.ts', 'src/shared/util.ts'],
      tsconfig: { paths: { '@/*': ['nowhere/*'], '@/shared/*': ['src/shared/*'] } },
    });
    expect(edges).toStrictEqual([]);
  });

  test('baseUrl 만 있어도 푼다', () => {
    const edges = one('src/a.ts', [spec('shared/util')], {
      paths: ['src/a.ts', 'src/shared/util.ts'],
      tsconfig: { baseUrl: 'src' },
    });
    expect(lines(edges)).toStrictEqual(['src/a.ts -> src/shared/util.ts (static)']);
  });

  test('package.json#imports — 정확 이름과 `*` 별칭 둘 다', () => {
    const rest = {
      paths: ['src/a.ts', 'src/env.ts', 'src/lib/fmt.ts'],
      packageImports: { '#env': './src/env.ts', '#lib/*': './src/lib/*.js' },
    };
    expect(lines(one('src/a.ts', [spec('#env'), spec('#lib/fmt')], rest))).toStrictEqual([
      'src/a.ts -> src/env.ts (static)',
      'src/a.ts -> src/lib/fmt.ts (static)',
    ]);
  });

  test('bare 지정자는 external 이라 엣지가 없다', () => {
    const edges = one('src/a.ts', [spec('react'), spec('node:fs')], {
      paths: ['src/a.ts', 'src/react.ts'],
    });
    expect(edges).toStrictEqual([]);
  });

  test('form 이 kind 를 정한다 — require 는 static 과 같다', () => {
    const paths = ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'];
    const edges = one(
      'src/a.ts',
      [spec('./b'), spec('./c', 'dynamic'), spec('./d', 'require'), spec('./e', 'type')],
      { paths },
    );
    expect(lines(edges)).toStrictEqual([
      'src/a.ts -> src/b.ts (static)',
      'src/a.ts -> src/c.ts (dynamic)',
      'src/a.ts -> src/d.ts (static)',
      'src/a.ts -> src/e.ts (type)',
    ]);
  });

  test('`./x.js` 는 `x.ts` 를 가리킨다 (표에 없는 보강)', () => {
    const edges = one('src/a.ts', [spec('./b.js')], { paths: ['src/a.ts', 'src/b.ts'] });
    expect(lines(edges)).toStrictEqual(['src/a.ts -> src/b.ts (static)']);
  });
});

describe('Next HTTP 엣지 (04 §7.1 2행)', () => {
  test('`/api/cart` → app/api/cart/route.ts', () => {
    const edges = one('features/cart/cartApi.ts', [spec('/api/cart')], {
      paths: ['features/cart/cartApi.ts', 'app/api/cart/route.ts'],
    });
    expect(edges).toStrictEqual([
      {
        from: 'features/cart/cartApi.ts',
        to: 'app/api/cart/route.ts',
        kind: 'http',
        confidence: 'syntactic',
      },
    ]);
  });

  test('pages 라우터도 본다', () => {
    const edges = one('lib/api.ts', [spec('/api/cart?id=1')], {
      paths: ['lib/api.ts', 'pages/api/cart.ts'],
    });
    expect(lines(edges)).toStrictEqual(['lib/api.ts -> pages/api/cart.ts (http)']);
  });

  test('라우트 파일이 없으면 엣지가 없다', () => {
    expect(one('lib/api.ts', [spec('/api/cart')], { paths: ['lib/api.ts'] })).toStrictEqual([]);
  });
});

describe('py (04 §7.1 3행)', () => {
  test('소스 루트 기준 `a/b/c.py`', () => {
    const edges = one('src/app/main.py', [spec('app.db.session')], {
      paths: ['src/app/main.py', 'src/app/db/session.py'],
      pySourceRoots: ['src'],
    });
    expect(lines(edges)).toStrictEqual(['src/app/main.py -> src/app/db/session.py (static)']);
  });

  test('`from a.b import c` 의 c 가 이름이면 `a/b.py` 로 떨어진다', () => {
    const edges = one('src/app/main.py', [spec('app.db.session.get_db')], {
      paths: ['src/app/main.py', 'src/app/db/session.py'],
      pySourceRoots: ['src'],
    });
    expect(lines(edges)).toStrictEqual(['src/app/main.py -> src/app/db/session.py (static)']);
  });

  test('패키지는 `__init__.py`', () => {
    const edges = one('src/main.py', [spec('pkg')], {
      paths: ['src/main.py', 'src/pkg/__init__.py'],
      pySourceRoots: ['src'],
    });
    expect(lines(edges)).toStrictEqual(['src/main.py -> src/pkg/__init__.py (static)']);
  });

  test('상대 `from ..a`', () => {
    const edges = one('app/api/routes.py', [spec('..models')], {
      paths: ['app/api/routes.py', 'app/models.py'],
    });
    expect(lines(edges)).toStrictEqual(['app/api/routes.py -> app/models.py (static)']);
  });

  test('외부 모듈은 엣지가 없다', () => {
    const edges = one('src/main.py', [spec('fastapi')], {
      paths: ['src/main.py'],
      pySourceRoots: ['src'],
    });
    expect(edges).toStrictEqual([]);
  });
});

describe('go (04 §7.1 4행)', () => {
  // 사전순(`db.go`)과 입력 순서(`query.go`)가 다르게 둔다 — 대표를 무엇이 정하는지 갈린다.
  const paths = [
    'cmd/server/main.go',
    'internal/store/query.go',
    'internal/store/db.go',
  ];

  test('패키지 import 는 그 패키지의 대표 파일로 간다', () => {
    const edges = one('cmd/server/main.go', [spec('github.com/me/app/internal/store')], {
      paths,
      goModule: 'github.com/me/app',
    });
    expect(edges).toStrictEqual([
      {
        from: 'cmd/server/main.go',
        to: 'internal/store/db.go',
        kind: 'static',
        confidence: 'syntactic',
      },
    ]);
  });

  test('대표는 입력 순서가 아니라 경로 사전순으로 정해진다', () => {
    const forward = one('cmd/server/main.go', [spec('github.com/me/app/internal/store')], {
      paths,
      goModule: 'github.com/me/app',
    });
    const reversed = one('cmd/server/main.go', [spec('github.com/me/app/internal/store')], {
      paths: [...paths].reverse(),
      goModule: 'github.com/me/app',
    });
    expect(forward).toStrictEqual(reversed);
    // 디렉터리(`internal/store`)가 아니라 `paths` 안에 실제로 있는 파일이어야 한다.
    expect(paths).toContain(forward[0]?.to);
  });

  test('표준·외부는 엣지가 없다', () => {
    const edges = one('cmd/server/main.go', [spec('fmt'), spec('github.com/gin-gonic/gin')], {
      paths,
      goModule: 'github.com/me/app',
    });
    expect(edges).toStrictEqual([]);
  });
});

describe('rs (04 §7.1 5행)', () => {
  test('`mod x;` → 형제 `x.rs`', () => {
    const edges = one('src/main.rs', [spec('routes')], { paths: ['src/main.rs', 'src/routes.rs'] });
    expect(lines(edges)).toStrictEqual(['src/main.rs -> src/routes.rs (static)']);
  });

  test('`mod x;` → `x/mod.rs`', () => {
    const edges = one('src/lib.rs', [spec('store')], { paths: ['src/lib.rs', 'src/store/mod.rs'] });
    expect(lines(edges)).toStrictEqual(['src/lib.rs -> src/store/mod.rs (static)']);
  });

  test('`use crate::a::b` 는 가장 긴 파일 접두로 떨어진다', () => {
    const edges = one('crates/store/src/lib.rs', [spec('crate::rows::Row')], {
      paths: ['crates/store/src/lib.rs', 'crates/store/src/rows.rs'],
    });
    expect(lines(edges)).toStrictEqual([
      'crates/store/src/lib.rs -> crates/store/src/rows.rs (static)',
    ]);
  });

  test('`super::` 는 한 칸 위, `self::` 는 제자리', () => {
    const paths = ['src/api/mod.rs', 'src/api/handlers.rs', 'src/api/util.rs'];
    expect(lines(one('src/api/handlers.rs', [spec('super::util::slug')], { paths })))
      .toStrictEqual(['src/api/handlers.rs -> src/api/util.rs (static)']);
    expect(lines(one('src/api/mod.rs', [spec('self::util')], { paths })))
      .toStrictEqual(['src/api/mod.rs -> src/api/util.rs (static)']);
  });

  test('외부 크레이트는 엣지가 없다', () => {
    const edges = one('src/main.rs', [spec('serde::Serialize'), spec('std::fs')], {
      paths: ['src/main.rs', 'src/serde.rs'],
    });
    expect(edges).toStrictEqual([]);
  });
});

describe('dart (04 §7.1 6행)', () => {
  const paths = ['lib/main.dart', 'lib/widgets/cart.dart', 'lib/models/item.dart'];

  test('`package:app/x.dart` → `lib/x.dart`', () => {
    const edges = one('lib/main.dart', [spec('package:app/widgets/cart.dart')], { paths });
    expect(lines(edges)).toStrictEqual(['lib/main.dart -> lib/widgets/cart.dart (static)']);
  });

  test('상대 경로', () => {
    const edges = one('lib/widgets/cart.dart', [spec('../models/item.dart')], { paths });
    expect(lines(edges)).toStrictEqual(['lib/widgets/cart.dart -> lib/models/item.dart (static)']);
  });

  test('`dart:` 는 엣지가 없다', () => {
    expect(one('lib/main.dart', [spec('dart:async')], { paths })).toStrictEqual([]);
  });
});

describe('swift · sql (04 §7.1 7·8행)', () => {
  test('swift 는 파일 import 가 없어 엣지를 만들지 않는다', () => {
    const edges = one('Sources/App/A.swift', [spec('Foundation'), spec('B')], {
      paths: ['Sources/App/A.swift', 'Sources/App/B.swift'],
    });
    expect(edges).toStrictEqual([]);
  });

  test('표에 없는 확장자는 엣지가 없다', () => {
    const edges = one('db/schema.sql', [spec('./other.sql')], {
      paths: ['db/schema.sql', 'db/other.sql'],
    });
    expect(edges).toStrictEqual([]);
  });
});

describe('공통', () => {
  test('해석 실패는 엣지 없음이다 — 추측한 노드를 만들지 않는다', () => {
    const edges = one('src/a.ts', [spec('./missing'), spec('@/nope'), spec('#none')], {
      paths: ['src/a.ts'],
      tsconfig: { baseUrl: '.', paths: { '@/*': ['src/*'] } },
      packageImports: { '#lib/*': './src/lib/*.ts' },
    });
    expect(edges).toStrictEqual([]);
  });

  test('결과는 (from, to, kind) 순이고 중복이 없다', () => {
    const edges = resolveImports({
      paths: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      files: [
        { path: 'src/c.ts', imports: [spec('./b'), spec('./a')] },
        // 같은 모듈을 두 줄에서 가져오는 것은 정상이다 — 엣지는 하나다.
        { path: 'src/a.ts', imports: [spec('./b'), spec('./b', 'require'), spec('./b', 'dynamic')] },
      ],
    });
    expect(lines(edges)).toStrictEqual([
      'src/a.ts -> src/b.ts (dynamic)',
      'src/a.ts -> src/b.ts (static)',
      'src/c.ts -> src/a.ts (static)',
      'src/c.ts -> src/b.ts (static)',
    ]);
  });

  test('두 번 불러도 같은 배열이다 (04 §9 결정성)', () => {
    const input: ResolveInput = {
      paths: ['src/a.ts', 'src/b.ts', 'app/api/cart/route.ts', 'lib/x.py', 'src/main.rs'],
      files: [
        { path: 'src/b.ts', imports: [spec('/api/cart'), spec('./a', 'type')] },
        { path: 'src/a.ts', imports: [spec('./b', 'dynamic')] },
      ],
      tsconfig: { baseUrl: '.', paths: { '@/*': ['src/*'] } },
    };
    expect(resolveImports(input)).toStrictEqual(resolveImports(input));
    expect(lines(resolveImports(input))).toStrictEqual([
      'src/a.ts -> src/b.ts (dynamic)',
      'src/b.ts -> app/api/cart/route.ts (http)',
      'src/b.ts -> src/a.ts (type)',
    ]);
  });

  test('`to` 는 언제나 paths 의 원소다 — 아니면 저장 단계에서 조용히 사라진다', () => {
    const input: ResolveInput = {
      paths: [
        'src/a.ts', 'src/b.ts', 'app/api/cart/route.ts',
        'app/api/routes.py', 'app/models.py',
        'cmd/main.go', 'internal/store/db.go', 'internal/store/query.go',
        'src/main.rs', 'src/routes.rs',
        'lib/main.dart', 'lib/models/item.dart',
      ],
      files: [
        { path: 'src/a.ts', imports: [spec('./b'), spec('/api/cart')] },
        { path: 'app/api/routes.py', imports: [spec('..models')] },
        { path: 'cmd/main.go', imports: [spec('example.com/app/internal/store')] },
        { path: 'src/main.rs', imports: [spec('routes')] },
        { path: 'lib/main.dart', imports: [spec('package:app/models/item.dart')] },
      ],
      goModule: 'example.com/app',
    };
    const edges = resolveImports(input);
    expect(edges).toHaveLength(6);
    for (const edge of edges) expect(input.paths).toContain(edge.to);
  });

  test('자기 자신을 가리키는 엣지는 버린다', () => {
    const edges = one('src/a.ts', [spec('./a')], { paths: ['src/a.ts'] });
    expect(edges).toStrictEqual([]);
  });
});

describe('java · Spring 라우트 (D159)', () => {
  const CTRL = 'BACK/src/main/java/com/ssafy/app/controller/AuthController.java';
  const SVC = 'BACK/src/main/java/com/ssafy/app/service/AuthService.java';
  const FRONT = 'FRONT/src/services/authService.js';

  /** 컨트롤러 하나 — 클래스 기본 경로 + 메서드 셋. */
  const controller = (): RawImport[] => [
    spec('com.ssafy.app.service.AuthService'),
    spec('/api/auth', 'route-base'),
    spec('/login', 'route-post'),
    spec('/me', 'route-get'),
    spec('/me', 'route-delete'),
  ];

  test('패키지 이름을 접미로 파일에 맞춘다 — 소스 루트를 설정에서 안 읽는다', () => {
    const edges = one(CTRL, [spec('com.ssafy.app.service.AuthService')], { paths: [CTRL, SVC] });
    expect(lines(edges)).toStrictEqual([`${CTRL} -> ${SVC} (static)`]);
  });

  test('외부 의존은 리포에 파일이 없어 엣지가 없다', () => {
    const edges = one(CTRL, [spec('org.springframework.web.bind.annotation.RestController')], { paths: [CTRL] });
    expect(edges).toStrictEqual([]);
  });

  test('같은 패키지가 두 모듈에 있으면 안 잇는다 — 틀린 간선은 없는 간선보다 나쁘다', () => {
    const other = 'other/src/main/java/com/ssafy/app/service/AuthService.java';
    const edges = one(CTRL, [spec('com.ssafy.app.service.AuthService')], { paths: [CTRL, SVC, other] });
    expect(edges).toStrictEqual([]);
  });

  test('라우트 선언 자체는 나가는 엣지가 아니다', () => {
    const edges = one(CTRL, [spec('/api/auth', 'route-base'), spec('/login', 'route-post')], { paths: [CTRL] });
    expect(edges).toStrictEqual([]);
  });

  test('클래스 경로 + 메서드 경로를 합쳐 프론트 호출과 잇는다', () => {
    const edges = resolveImports({
      paths: [CTRL, SVC, FRONT],
      files: [
        { path: CTRL, imports: controller() },
        { path: FRONT, imports: [spec('/api/auth/login', 'http-post')] },
      ],
    });
    expect(lines(edges)).toContain(`${FRONT} -> ${CTRL} (http)`);
    expect(edges.find((e) => e.kind === 'http')?.confidence).toBe('syntactic');
  });

  test('baseURL 만큼 짧게 적힌 경로는 접미로 잇고 heuristic 으로 표시한다', () => {
    // 프론트는 `axios.create({ baseURL: "/api" })` 아래에서 `/auth/login` 이라고만 쓴다.
    const edges = resolveImports({
      paths: [CTRL, FRONT],
      files: [
        { path: CTRL, imports: controller() },
        { path: FRONT, imports: [spec('/auth/login', 'http-post')] },
      ],
    });
    const http = edges.find((e) => e.kind === 'http');
    expect(http?.to).toBe(CTRL);
    expect(http?.confidence).toBe('heuristic');
  });

  test('경로가 같아도 HTTP 메서드가 다르면 다른 자리다', () => {
    // 이 리포에 `GET /api/auth/me` 와 `DELETE /api/auth/me` 가 실제로 둘 다 있다.
    const edges = resolveImports({
      paths: [CTRL, FRONT],
      files: [
        { path: CTRL, imports: [spec('/api/auth', 'route-base'), spec('/me', 'route-get')] },
        { path: FRONT, imports: [spec('/auth/me', 'http-delete')] },
      ],
    });
    expect(edges).toStrictEqual([]);
  });

  test('경로 없는 애너테이션은 클래스 기본 경로가 곧 라우트다', () => {
    const edges = resolveImports({
      paths: [CTRL, FRONT],
      files: [
        { path: CTRL, imports: [spec('/api/emotions', 'route-base'), spec('GetMapping', 'route-bare-get')] },
        { path: FRONT, imports: [spec('/emotions', 'http-get')] },
      ],
    });
    expect(edges.find((e) => e.kind === 'http')?.to).toBe(CTRL);
  });

  test('경로 변수를 자리표로 접어 템플릿 문자열과 잇는다', () => {
    // 프론트 `` `/notices/${noticeId}` `` ↔ 서버 `@GetMapping("/{noticeId}")`.
    // 안 접으면 이 둘은 영영 안 만난다 — 실리포에서 컨트롤러 셋이 그랬다.
    const NOTICE = 'BACK/src/main/java/com/ssafy/app/controller/NoticeController.java';
    const svc = 'FRONT/src/services/noticeService.js';
    const edges = resolveImports({
      paths: [NOTICE, svc],
      files: [
        { path: NOTICE, imports: [spec('/api/notices', 'route-base'), spec('/{noticeId}', 'route-get')] },
        { path: svc, imports: [spec('/notices/${noticeId}', 'http-get')] },
      ],
    });
    expect(edges.find((e) => e.kind === 'http')?.to).toBe(NOTICE);
  });

  test('클래스 기본 경로 안의 변수도 접는다', () => {
    const RESULT = 'BACK/src/main/java/com/ssafy/app/controller/DreamResultController.java';
    const svc = 'FRONT/src/services/dreamResultService.js';
    const edges = resolveImports({
      paths: [RESULT, svc],
      files: [
        { path: RESULT, imports: [spec('/api/dreams/{dreamId}/result', 'route-base'), spec('GetMapping', 'route-bare-get')] },
        { path: svc, imports: [spec('/dreams/${dreamId}/result', 'http-get')] },
      ],
    });
    expect(edges.find((e) => e.kind === 'http')?.to).toBe(RESULT);
  });

  test('어느 라우트와도 안 맞으면 간선을 지어내지 않는다', () => {
    // 실리포에서 `api.get("/emotions/stats")` 가 이랬다 — 백엔드에 `stats` 매핑이 없다.
    const EMO = 'BACK/src/main/java/com/ssafy/app/controller/EmotionController.java';
    const svc = 'FRONT/src/services/x.js';
    const edges = resolveImports({
      paths: [EMO, svc],
      files: [
        { path: EMO, imports: [spec('/api/emotions', 'route-base'), spec('GetMapping', 'route-bare-get')] },
        { path: svc, imports: [spec('/emotions/stats', 'http-get')] },
      ],
    });
    expect(edges.filter((e) => e.kind === 'http')).toStrictEqual([]);
  });

  test('접미 후보가 둘이면 안 잇는다', () => {
    const other = 'BACK/src/main/java/com/ssafy/app/controller/V2AuthController.java';
    const edges = resolveImports({
      paths: [CTRL, other, FRONT],
      files: [
        { path: CTRL, imports: [spec('/api/auth', 'route-base'), spec('/login', 'route-post')] },
        { path: other, imports: [spec('/v2/auth', 'route-base'), spec('/login', 'route-post')] },
        { path: FRONT, imports: [spec('/auth/login', 'http-post')] },
      ],
    });
    expect(edges.filter((e) => e.kind === 'http')).toStrictEqual([]);
  });
});

describe('mybatis 매퍼 (D159)', () => {
  const DAO = 'BACK/src/main/java/com/ssafy/app/model/dao/UserDao.java';
  const USER = 'BACK/src/main/java/com/ssafy/app/model/entity/User.java';
  const MAP = 'BACK/src/main/resources/mapper/user/UserMapper.xml';

  test('`namespace` 는 방향이 뒤집힌다 — DAO 를 열면 SQL 이 거기 있다', () => {
    const edges = one(MAP, [spec('com.ssafy.app.model.dao.UserDao', 'mapper-of')], { paths: [DAO, MAP] });
    expect(lines(edges)).toStrictEqual([`${DAO} -> ${MAP} (static)`]);
  });

  test('`type`·`resultType` 은 그대로다 — 매퍼가 그 타입을 쓴다', () => {
    const edges = one(MAP, [spec('com.ssafy.app.model.entity.User')], { paths: [USER, MAP] });
    expect(lines(edges)).toStrictEqual([`${MAP} -> ${USER} (static)`]);
  });

  test('점 없는 별칭(`string`·`map`)은 자바 파일로 안 풀려 엣지가 없다', () => {
    const edges = one(MAP, [spec('string'), spec('map'), spec('long')], { paths: [DAO, USER, MAP] });
    expect(edges).toStrictEqual([]);
  });

  test('뒤집힌 엣지도 자기 자신을 가리키면 버린다', () => {
    const edges = one(MAP, [spec('com.ssafy.app.model.dao.UserDao', 'mapper-of')], { paths: [MAP] });
    expect(edges).toStrictEqual([]);
  });
});
