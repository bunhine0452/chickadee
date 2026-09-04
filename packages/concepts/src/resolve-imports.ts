/**
 * import 지정자 → `import_edge` 행 (04 §7.1).
 *
 * Rust 는 `_imports` 캡처(지정자 문자열 하나)만 낸다. `./x` 가 어느 파일인지는 언어 지식이라
 * TS 가 푼다 (D18). 여기는 순수 함수다 — 파일 시스템도 IPC 도 SQL 도 부르지 않고 **경로
 * 문자열 집합**에만 대고 맞춘다. 그래서 같은 입력에 같은 배열이 나온다 (04 §9).
 *
 * `confidence` 는 지금 전부 `'syntactic'` 이다. `'heuristic'` 이 타입에 남아 있는 이유는
 * swift 다 — swift 는 파일 import 가 없어 04 §7.1 이 「다른 파일이 선언한 타입명을 쓰면
 * 엣지」라는 휴리스틱을 적었는데, 그 판정에 필요한 타입 선언 캡처가 아직 없다.
 */
import type { EdgeKind } from '@chickadee/store-sql';

import type { RawImport } from './derive.js';

export type { EdgeKind };

/** `tsconfig.json` 의 `compilerOptions` 중 경로 해석에 쓰는 둘. */
export interface TsconfigPaths { baseUrl?: string; paths?: Record<string, string[]>; }

/** 파일 하나가 낸 import 지정자들. `path` 는 리포 상대 posix 경로다. */
export interface FileImports { path: string; imports: readonly RawImport[]; }

export interface ResolveInput {
  /** 리포의 모든 파일 경로. 해석 결과가 이 집합 안에 있어야 엣지가 선다. */
  paths: readonly string[];
  files: readonly FileImports[];
  /** 없으면 `baseUrl`·`paths` 규칙을 건너뛴다. */
  tsconfig?: TsconfigPaths | null;
  /** 리포 `package.json` 의 `imports` 필드 (`#x` 별칭). */
  packageImports?: Record<string, string> | null;
  /** `go.mod` 의 module 접두. go 파일이 없으면 불필요. */
  goModule?: string | null;
  /** 파이썬 소스 루트. 비어 있으면 리포 루트를 쓴다. */
  pySourceRoots?: readonly string[];
}

/**
 * **불변식: `to` 는 언제나 `ResolveInput.paths` 의 원소다.** 인제스트는 이 행을 「경로 →
 * `file.id`」 표로 옮겨 `import_edge` 에 넣으므로(`ingest.ts` 의 `writeEdges`), 표에 없는
 * 경로 — 디렉터리든 추측한 이름이든 — 는 오류 없이 그냥 사라진다. 그래서 해석은 언제나
 * 파일 집합에 **있는** 것만 돌려준다. `from` 은 준 `FileImports.path` 그대로다.
 */
export interface ResolvedEdge {
  from: string; to: string; kind: EdgeKind; confidence: 'syntactic' | 'heuristic';
}

/** 해석 결과 하나. `kind` 가 있으면 `form` 대신 그것이 이긴다 (http 엣지). */
interface Hit { to: string; kind?: EdgeKind; confidence?: 'syntactic' | 'heuristic'; }

type Lang = 'ts' | 'py' | 'go' | 'rs' | 'dart' | 'swift' | 'java';

/** 확장자 → 언어. 표에 없는 확장자(`.sql` 등)는 엣지가 없다. */
const LANG_OF: Readonly<Record<string, Lang>> = {
  ts: 'ts', tsx: 'ts', js: 'ts', jsx: 'ts', mjs: 'ts', cjs: 'ts', vue: 'ts',
  py: 'py', go: 'go', rs: 'rs', dart: 'dart', swift: 'swift', java: 'java',
};

/** `_imports.scm` 이 라우트로 내보내는 `form` 들 (D159). 이것들은 **나가는 엣지가 아니다.** */
const ROUTE_FORM = /^route-/;
/** 프론트가 부르는 자리. `http-post` → `POST`. */
const HTTP_FORM = /^http-(get|post|put|patch|delete)$/;

/** 상대 지정자에 붙여 보는 확장자. 순서가 곧 우선순위다 (04 §7.1). */
const TS_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.d.ts'] as const;
/** ESM 출력 규약상 소스가 아니라 **결과물** 이름으로 적히는 확장자. */
const JS_OUT_EXT = ['.js', '.jsx', '.mjs', '.cjs'] as const;
/** Next 라우트가 앉는 자리. `src/` 배치를 공식으로 허용하므로 둘 다 본다. */
const NEXT_ROOTS = ['', 'src/'] as const;
/** 이 이름의 rs 파일은 디렉터리 자체가 모듈이다 — 하위 모듈이 옆이 아니라 안에 있다. */
const RS_DIR_MODULE = new Set(['mod', 'lib', 'main']);

interface Ctx {
  files: ReadonlySet<string>;
  /** `"POST /api/auth/login"` → 그 라우트를 선언한 파일 (D159). */
  routes: ReadonlyMap<string, string>;
  /** go 패키지 디렉터리 → 그 패키지의 대표 파일. `resolveGo` 주석 참조. */
  goLead: ReadonlyMap<string, Hit>;
  tsconfig: TsconfigPaths | null; packageImports: Readonly<Record<string, string>> | null;
  goModule: string | null; pyRoots: readonly string[];
}

export function resolveImports(input: ResolveInput): ResolvedEdge[] {
  const pyRoots = (input.pySourceRoots ?? []).map(normalize);
  const ctx: Ctx = {
    files: new Set(input.paths),
    goLead: goLeadFiles(input.paths),
    routes: routeIndex(input.files),
    tsconfig: input.tsconfig ?? null,
    packageImports: input.packageImports ?? null,
    goModule: input.goModule ?? null,
    // 소스 루트를 모르면 리포 루트가 루트다.
    pyRoots: pyRoots.length > 0 ? pyRoots : [''],
  };

  const seen = new Set<string>();
  const edges: ResolvedEdge[] = [];
  for (const file of input.files) {
    const lang = langOf(file.path);
    if (lang === null) continue;
    for (const raw of file.imports) {
      // 라우트 선언은 색인의 재료일 뿐 나가는 엣지가 아니다 (D159).
      if (raw.form !== null && ROUTE_FORM.test(raw.form)) continue;
      const http = raw.form !== null ? HTTP_FORM.exec(raw.form) : null;
      const hit = http
        ? routeHit((http[1] as string).toUpperCase(), raw.specifier, ctx)
        : resolveOne(lang, file.path, raw.specifier, ctx);
      // 자기 자신을 가리키는 엣지는 지도에 그릴 것이 없다.
      if (hit === null || hit.to === file.path) continue;
      const kind = hit.kind ?? kindOf(raw.form);
      const key = `${file.path} ${hit.to} ${kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: file.path, to: hit.to, kind, confidence: hit.confidence ?? 'syntactic' });
    }
  }
  edges.sort(byEdge);
  return edges;
}

function resolveOne(lang: Lang, from: string, spec: string, ctx: Ctx): Hit | null {
  if (lang === 'ts') return resolveTs(from, spec, ctx);
  if (lang === 'py') return resolvePy(from, spec, ctx);
  if (lang === 'go') return resolveGo(spec, ctx);
  if (lang === 'rs') return resolveRs(from, spec, ctx);
  if (lang === 'dart') return resolveDart(from, spec, ctx);
  if (lang === 'java') return resolveJava(spec, ctx);
  // swift: 파일 import 가 없다. 타입 참조 휴리스틱은 캡처가 생기면 그때 붙인다.
  return null;
}

/**
 * `form` → `kind`. `require` 와 `export * from` 은 정적 import 와 같은 엣지다 (04 §7.1).
 *
 * `'type'` 은 아직 `dictionary/ts/_imports.scm` 이 내지 않는다 — 지금 쿼리는 `import type`
 * 을 보통 import 와 구별하지 않는다. 04 §7.1 이 `form` 값으로 `type` 을 적었으므로
 * 매핑만 먼저 둔다. 쿼리가 갈라지면 이 함수는 그대로 두고 `.scm` 만 고치면 된다.
 */
function kindOf(form: string | null): EdgeKind {
  if (form === 'type') return 'type';
  if (form === 'dynamic') return 'dynamic';
  return 'static';
}

function resolveTs(from: string, spec: string, ctx: Ctx): Hit | null {
  if (spec.startsWith('/api/')) return nextRoute(spec, ctx);
  if (spec.startsWith('./') || spec.startsWith('../')) return tsFile(joinPath(dirOf(from), spec), ctx);

  // `#x` 는 `package.json` 의 `imports` 필드 말고 갈 곳이 없다.
  if (spec.startsWith('#')) return fromAlias(spec, ctx.packageImports ?? {}, '', ctx);
  // 남은 것은 tsconfig 아니면 bare(`react`) — bare 는 external 이라 지도에 없다.
  return fromTsconfig(spec, ctx);
}

/**
 * 별칭 표를 **선언 순으로** 보고 첫 매치에서 멈춘다 (04 §7.1). 실제 tsc 는 가장 긴 접두를
 * 고르지만 표가 선언 순이라고 적었고, 그 편이 `tsconfig.json` 을 위에서 아래로 읽은 것과
 * 같은 답을 준다. 걸린 패턴의 대상 파일이 없으면 거기서 끝이다 — 뒤 패턴은 보지 않는다.
 */
function fromAlias(spec: string, table: Readonly<Record<string, string | string[]>>,
  base: string, ctx: Ctx): Hit | null {
  for (const [pattern, target] of Object.entries(table)) {
    const rest = matchAlias(pattern, spec);
    if (rest === null) continue;
    for (const one of typeof target === 'string' ? [target] : target) {
      const hit = tsFile(joinPath(base, one.replace('*', rest)), ctx);
      if (hit !== null) return hit;
    }
    return null;
  }
  return null;
}

function fromTsconfig(spec: string, ctx: Ctx): Hit | null {
  const conf = ctx.tsconfig;
  if (conf === null) return null;
  const base = conf.baseUrl === undefined ? '' : normalize(conf.baseUrl);
  const hit = fromAlias(spec, conf.paths ?? {}, base, ctx);
  if (hit !== null || conf.baseUrl === undefined) return hit;
  return tsFile(joinPath(base, spec), ctx);
}

/** 별칭 패턴에 지정자를 맞춘다. `*` 가 먹은 부분을 돌려주고, 안 맞으면 `null`. */
function matchAlias(pattern: string, spec: string): string | null {
  const star = pattern.indexOf('*');
  if (star === -1) return spec === pattern ? '' : null;
  const head = pattern.slice(0, star);
  const tail = pattern.slice(star + 1);
  if (!spec.startsWith(head) || !spec.endsWith(tail)) return null;
  if (spec.length < head.length + tail.length) return null; // `*` 가 먹을 것이 없다
  return spec.slice(head.length, spec.length - tail.length);
}

/**
 * 확장자 없는 경로 → 실제 파일. 04 §7.1 의 `확장자 → x/index.*` 순서다.
 *
 * 가운데의 `.js` 되돌리기는 표에 없다. TS 는 ESM 출력 규약 때문에 `./derive.js` 라고
 * 적고 `derive.ts` 를 가리키는데(이 리포가 그렇게 쓴다), 그대로 두면 그런 리포에서
 * 엣지가 하나도 안 선다. 정확히 그 이름의 파일이 없을 때만 돈다.
 */
function tsFile(base: string, ctx: Ctx): Hit | null {
  if (base === '') return null;
  if (ctx.files.has(base)) return { to: base };
  for (const ext of TS_EXT) if (ctx.files.has(base + ext)) return { to: base + ext };

  const out = JS_OUT_EXT.find((ext) => base.endsWith(ext));
  if (out !== undefined) {
    const stem = base.slice(0, -out.length);
    for (const ext of TS_EXT) if (ctx.files.has(stem + ext)) return { to: stem + ext };
  }

  for (const ext of TS_EXT) {
    const index = `${base}/index${ext}`;
    if (ctx.files.has(index)) return { to: index };
  }
  return null;
}

/**
 * Next HTTP 엣지 (04 §7.1 「프레임워크: Next」). `fetch('/api/cart')` → `route.ts`.
 *
 * 지금 `dictionary/ts/_imports.scm` 은 `fetch`/`axios` 인자를 잡지 않는다 — 그러니 이
 * 가지는 입력에 `/api/…` 지정자가 오기 전까지 아무 일도 하지 않는다. 캡처가 붙는 날
 * 여기는 그대로 둔다.
 */
function nextRoute(spec: string, ctx: Ctx): Hit | null {
  const clean = spec.split(/[?#]/)[0] ?? '';
  const rest = (clean.endsWith('/') ? clean.slice(0, -1) : clean).slice('/api/'.length);
  if (rest === '') return null;
  for (const root of NEXT_ROOTS) {
    for (const ext of TS_EXT) {
      const app = `${root}app/api/${rest}/route${ext}`;
      if (ctx.files.has(app)) return { to: app, kind: 'http' };
      const pages = `${root}pages/api/${rest}${ext}`;
      if (ctx.files.has(pages)) return { to: pages, kind: 'http' };
    }
  }
  return null;
}

/**
 * Spring 라우트 색인 (D159). `@RequestMapping("/api/auth")` 는 **클래스**에, `@PostMapping("/login")`
 * 은 **메서드**에 붙어 있어 캡처 하나로 못 붙는다 — `_imports.scm` 이 `form` 으로 갈라 내보내고
 * 여기서 파일 안에서 합친다. 자바는 파일 하나에 public 클래스 하나라 기본 경로도 하나다.
 *
 * 키에 HTTP 메서드를 넣는 이유: 경로만 맞고 메서드가 다른 짝을 잇지 않기 위해서다
 * (`GET /api/auth/me` 와 `DELETE /api/auth/me` 는 다른 자리다 — 이 리포에 실제로 둘 다 있다).
 */
function routeIndex(files: readonly FileImports[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const file of files) {
    if (langOf(file.path) !== 'java') continue;
    const base = file.imports.find((r) => r.form === 'route-base')?.specifier ?? '';
    for (const raw of file.imports) {
      const m = raw.form === null ? null : /^route-(bare-)?(get|post|put|patch|delete)$/.exec(raw.form);
      if (m === null) continue;
      // 경로 없는 애너테이션(`@GetMapping`)은 지정자가 애너테이션 **이름**이다 — 경로는 기본 경로다.
      const leaf = m[1] === undefined ? raw.specifier : '';
      const key = `${(m[2] as string).toUpperCase()} ${normPath(joinRoute(base, leaf))}`;
      if (!out.has(key)) out.set(key, file.path);
    }
  }
  return out;
}

/**
 * 경로 변수를 자리표 하나로 접는다 — 프론트의 `${id}` 와 Spring 의 `{dreamId}` 는 같은 자리다.
 * 접지 않으면 `` `/notices/${id}` `` 와 `/api/notices/{noticeId}` 가 영영 안 만난다.
 */
const normPath = (p: string): string => p.replace(/\$\{[^}]*\}|\{[^}]*\}/g, ':');

/** `/api/auth` + `/login` → `/api/auth/login`. 양쪽 슬래시를 한 번만 남긴다. */
function joinRoute(base: string, leaf: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const l = leaf === '' ? '' : leaf.startsWith('/') ? leaf : `/${leaf}`;
  return `${b}${l}` === '' ? '/' : `${b}${l}`;
}

/**
 * 프론트의 호출 → 그 라우트를 선언한 서버 파일 (D159 · `kind: 'http'`).
 *
 * 클라이언트는 **baseURL 을 뺀 경로**를 적는다 — `axios.create({ baseURL: "/api" })` 아래에서
 * `api.post("/auth/login")` 은 서버의 `/api/auth/login` 이다. 설정을 읽는 대신 **접미 일치**로
 * 잇는다: 설정 파일 형식(axios·fetch 래퍼·Vite proxy)마다 다른 것을 안 쫓아도 되고,
 * 정확히 맞으면 그쪽이 먼저 이긴다.
 *
 * 접미로 이은 것은 `confidence: 'heuristic'` 이다 — 문자열이 우연히 겹칠 수 있다.
 * 후보가 **둘 이상이면 아예 안 잇는다.** 틀린 간선은 없는 간선보다 나쁘다.
 */
function routeHit(verb: string, spec: string, ctx: Ctx): Hit | null {
  const path = normPath(spec.split(/[?#]/)[0] ?? '');
  const exact = ctx.routes.get(`${verb} ${path}`);
  if (exact !== undefined) return { to: exact, kind: 'http' };

  const prefix = `${verb} `;
  let found: string | null = null;
  for (const [key, to] of ctx.routes) {
    if (!key.startsWith(prefix)) continue;
    if (!key.slice(prefix.length).endsWith(path)) continue;
    if (found !== null && found !== to) return null;
    found = to;
  }
  return found === null ? null : { to: found, kind: 'http', confidence: 'heuristic' };
}

/**
 * `com.ssafy.finalproject.service.AuthService` → `…/com/ssafy/finalproject/service/AuthService.java`.
 *
 * 소스 루트(`src/main/java`)를 설정에서 읽지 않는다 — 패키지 경로가 디렉터리 구조 그대로라
 * **접미 일치**면 충분하고, 그래야 Maven·Gradle·평평한 배치를 규칙 하나로 덮는다.
 * 외부 의존(`org.springframework.…`)은 리포에 파일이 없어 자연히 안 걸린다.
 * 후보가 둘 이상이면 안 잇는다 — 모듈이 여럿인 리포에서 같은 패키지가 두 번 나올 수 있다.
 */
function resolveJava(spec: string, ctx: Ctx): Hit | null {
  const tail = `/${spec.replace(/\./g, '/')}.java`;
  let found: string | null = null;
  for (const path of ctx.files) {
    if (!path.endsWith(tail)) continue;
    if (found !== null) return null;
    found = path;
  }
  return found === null ? null : { to: found };
}

/**
 * `import a.b` · `from a.b import c` → `a/b/c.py` → `a/b.py` → `a/b/__init__.py`.
 *
 * 지정자가 모듈까지인지(`a.b`) 이름까지인지(`a.b.c`) 캡처만 보고는 알 수 없다. 그래서
 * 마지막 조각을 붙인 것과 뗀 것을 둘 다 후보로 둔다 — 표의 세 줄이 그 결과다.
 */
function resolvePy(from: string, spec: string, ctx: Ctx): Hit | null {
  let dots = 0;
  while (spec[dots] === '.') dots += 1;
  const segs = spec.slice(dots).split('.').filter((s) => s !== '');
  if (segs.length === 0) return null;

  if (dots > 0) {
    // 점 하나는 현재 패키지, 둘째부터 한 칸씩 올라간다.
    let dir = dirOf(from);
    for (let i = 1; i < dots; i += 1) dir = dirOf(dir);
    return firstHit(pyCandidates(segs).map((c) => under(dir, c)), ctx);
  }

  for (const root of ctx.pyRoots) {
    const hit = firstHit(pyCandidates(segs).map((c) => under(root, c)), ctx);
    if (hit !== null) return hit;
  }
  return null;
}

function pyCandidates(segs: readonly string[]): string[] {
  const stems = [segs.join('/')];
  if (segs.length > 1) stems.push(segs.slice(0, -1).join('/'));
  return stems.flatMap((stem) => [`${stem}.py`, `${stem}/__init__.py`]);
}

/**
 * `go.mod` 접두를 떼면 패키지 디렉터리가 나오지만, 돌려주는 것은 그 안의 **대표 파일**이다.
 * 04 §7.1 은 「패키지 디렉터리가 노드」라고 적었는데 02 DDL 의 `import_edge.to_file_id` 가
 * `file(id)` 외래키라 디렉터리를 담을 자리가 없다 — 디렉터리를 돌려주면 인제스트가 경로를
 * `file.id` 로 옮길 때 표에 없어 그 엣지가 통째로 사라진다.
 *
 * 「패키지 하나가 노드 하나」의 나머지 반, 곧 같은 패키지의 여러 파일을 한 노드로 접는 일은
 * M4 에서 하지 않는다. `import_edge` 는 파일 대 파일이고, 접는 것은 지도 층
 * (`packages/cards/src/t2-graph.ts`)의 몫인데 그쪽은 go 패키지라는 것을 모른다.
 */
function resolveGo(spec: string, ctx: Ctx): Hit | null {
  const mod = ctx.goModule;
  if (mod === null || mod === '') return null;
  if (!spec.startsWith(`${mod}/`)) return null; // 표준 라이브러리·외부 모듈
  return ctx.goLead.get(spec.slice(mod.length + 1)) ?? null;
}

/**
 * 디렉터리 → 그 안 `.go` 파일 중 **경로 사전순 첫 번째**. 사전순으로 못박는 이유는
 * 결정성이다 (04 §9) — `paths` 가 어떤 순서로 오든 같은 대표가 나와야 한다.
 */
function goLeadFiles(paths: readonly string[]): ReadonlyMap<string, Hit> {
  const lead = new Map<string, Hit>();
  for (const path of paths) {
    if (!path.endsWith('.go')) continue;
    const dir = dirOf(path);
    const held = lead.get(dir);
    if (held === undefined || path < held.to) lead.set(dir, { to: path });
  }
  return lead;
}

function resolveRs(from: string, spec: string, ctx: Ctx): Hit | null {
  const segs = spec.split('::').filter((s) => s !== '');
  const head = segs[0];
  if (head === undefined) return null;

  // `::` 가 없으면 `mod x;` 다 — 형제 파일이거나 그 이름의 디렉터리 모듈.
  if (segs.length === 1 && !spec.includes('::')) return rsDescend(rsModuleDir(from), segs, ctx);
  if (head === 'crate') return rsDescend(rsCrateRoot(from), segs.slice(1), ctx);
  if (head === 'self') return rsDescend(rsModuleDir(from), segs.slice(1), ctx);
  if (head === 'super') {
    let dir = rsModuleDir(from);
    let i = 0;
    for (; segs[i] === 'super'; i += 1) dir = dirOf(dir);
    return rsDescend(dir, segs.slice(i), ctx);
  }
  return null; // 외부 크레이트
}

/** 가장 긴 파일 접두가 이긴다 — `src/a/b.rs` 가 없으면 `src/a.rs` (04 §7.1). */
function rsDescend(base: string, segs: readonly string[], ctx: Ctx): Hit | null {
  for (let n = segs.length; n > 0; n -= 1) {
    const stem = under(base, segs.slice(0, n).join('/'));
    const hit = firstHit([`${stem}.rs`, `${stem}/mod.rs`], ctx);
    if (hit !== null) return hit;
  }
  return null;
}

/** 이 파일이 여는 모듈의 하위 모듈이 앉는 디렉터리. `src/a.rs` 의 아이들은 `src/a/` 에 있다. */
function rsModuleDir(from: string): string {
  const dir = dirOf(from);
  const stem = from.slice(dir === '' ? 0 : dir.length + 1).replace(/\.rs$/, '');
  return RS_DIR_MODULE.has(stem) ? dir : under(dir, stem);
}

/** `crate::` 의 뿌리. 워크스페이스(`crates/x/src/`)를 위해 importer 쪽 `src` 를 찾는다. */
function rsCrateRoot(from: string): string {
  const segs = from.split('/');
  const at = segs.lastIndexOf('src');
  return at === -1 ? '' : segs.slice(0, at + 1).join('/');
}

/**
 * `package:app/x.dart` → `lib/x.dart`. 지정자에 든 패키지 이름이 이 리포의 것인지는
 * `pubspec.yaml` 없이 알 수 없다 — 파일 집합에 있느냐로만 거른다. 남의 패키지가 `lib/`
 * 아래 같은 경로를 가질 일은 거의 없고, 부딪히면 그때 `pubspec` 이름을 입력에 더한다.
 */
function resolveDart(from: string, spec: string, ctx: Ctx): Hit | null {
  if (spec.startsWith('dart:')) return null;
  if (spec.startsWith('package:')) {
    const slash = spec.indexOf('/');
    if (slash === -1) return null;
    const to = dartLibRoot(from) + spec.slice(slash + 1);
    return ctx.files.has(to) ? { to } : null;
  }
  // dart 는 `./` 없는 상대 경로도 상대 경로다. 확장자를 반드시 적으므로 붙여 보지 않는다.
  const to = joinPath(dirOf(from), spec);
  return ctx.files.has(to) ? { to } : null;
}

function dartLibRoot(from: string): string {
  const at = `/${from}`.lastIndexOf('/lib/');
  return at === -1 ? 'lib/' : `${from.slice(0, at)}lib/`;
}

function langOf(path: string): Lang | null {
  const dot = path.lastIndexOf('.');
  if (dot === -1 || dot < path.lastIndexOf('/')) return null;
  return LANG_OF[path.slice(dot + 1)] ?? null;
}

function firstHit(candidates: readonly string[], ctx: Ctx): Hit | null {
  for (const to of candidates) if (ctx.files.has(to)) return { to };
  return null;
}

/** posix `dirname`. 최상위 파일은 `''`. */
function dirOf(path: string): string {
  const at = path.lastIndexOf('/');
  return at === -1 ? '' : path.slice(0, at);
}

const under = (dir: string, rest: string): string => (dir === '' ? rest : `${dir}/${rest}`);

/** `base` 에서 `rel` 을 따라간 경로. `..` 는 위로, 루트를 넘으면 그냥 버린다. */
function joinPath(base: string, rel: string): string {
  const out = base === '' ? [] : base.split('/');
  for (const seg of rel.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

const normalize = (path: string): string => joinPath('', path);

/**
 * (from, to, kind) 오름차순. `localeCompare` 를 쓰지 않는다 — 04 §9 는 같은 입력에 같은
 * 배열을 요구하는데 로케일 정렬은 기계·런타임마다 다르다. 코드포인트 비교는 어디서나 같다.
 */
const cmp = (a: string, b: string): number => (a < b ? -1 : Number(a > b));

const byEdge = (a: ResolvedEdge, b: ResolvedEdge): number =>
  cmp(a.from, b.from) || cmp(a.to, b.to) || cmp(a.kind, b.kind);
