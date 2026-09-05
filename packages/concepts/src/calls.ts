/**
 * 메서드 단위 호출 그래프 (D168 · `docs/program/exercises.md` §2 `hop`).
 *
 * 파일 간선(`import_edge`)만으로는 로그인과 회원가입이 둘째 칸부터 같은 줄기를 쓴다 —
 * 둘 다 `AuthController.java` 를 거치고, 그 안에서 어느 메서드가 어느 서비스 메서드를 부르는지가
 * 파일 간선에는 없다. 여기서는 노드가 **블록**(`_blocks` 가 잡은 함수·메서드·매퍼 문)이고
 * 간선이 **호출**이다.
 *
 * 이음매는 전부 이름이다 — 실행도 타입 검사기도 없이 문자열 일치로 닿는다 (D159 와 같은 근거).
 * - 자바: `private final AuthService authService;` 가 `authService` → `AuthService` 를 주고,
 *   `AuthService` 는 파일 이름(`AuthService.java`)이다. `authService.login(…)` 은 그 파일의
 *   `login` 블록으로 간다. DAO 메서드는 매퍼의 `id` 와 글자 그대로 같아 SQL 까지 닿는다.
 * - JS·파이썬: 수신자의 타입이 없다. **이 파일이 import 한 파일들** 중 같은 이름의 블록을
 *   찾고, 둘 이상이면 수신자 이름과 파일 이름(`authStore` ↔ `authStore.js`)으로 가른다.
 *   그래도 둘이면 잇지 않는다 — 틀린 간선은 없는 간선보다 나쁘다.
 *
 * 재료는 캡처뿐이다. 파생 층은 파일 본문을 못 본다(Rust 가 읽고 캡처만 넘긴다) — 그래서
 * 수신자·타입·이름이 `_imports.scm` 의 `@ctx.*` 로 실려 온다 (`RawImport.ctx`).
 *
 * 순수 함수다 (04 §9). 같은 입력에 같은 배열이 나오도록 정렬은 전부 코드포인트 비교다.
 */
import type { RawBlock } from './derive.js';
import type { FileImports, ResolvedEdge } from './resolve-imports.js';

/** 파일 하나의 `_blocks` 캡처. */
export interface FileBlocks { path: string; blocks: readonly RawBlock[] }

/** 그래프의 노드 — 함수·메서드·매퍼 문 하나. */
export interface BlockRef {
  path: string;
  name: string;
  lineStart: number;
  lineEnd: number;
  /** `_blocks.scm` 의 `form` — `class`·`method`·`def`·`statement`. 모르면 `null`. */
  form: string | null;
}

/** 간선의 종류. `http` 는 프론트→라우트, `mapper` 는 DAO 메서드→매퍼 문. */
export type CallKind = 'call' | 'http' | 'mapper';

export interface CallEdge {
  from: BlockRef;
  to: BlockRef;
  /** 부르는 글자가 적힌 줄 (`from` 기준 1-based). `mapper` 는 DAO 메서드의 정의 줄이다. */
  line: number;
  kind: CallKind;
}

/** 밖에서 들어오는 문 — 라우트 메서드, `@Scheduled` 메서드. */
export interface EntryPoint {
  block: BlockRef;
  kind: 'route' | 'scheduled';
  line: number;
  /** `POST /api/auth/login` · `scheduled`. */
  label: string;
}

export interface CallGraph {
  /** 경로·시작 줄 오름차순. */
  blocks: BlockRef[];
  /** `from` 경로·줄·`to` 경로 오름차순. */
  edges: CallEdge[];
  entries: EntryPoint[];
  /** 블록으로 못 푼 호출 캡처 수 — 라이브러리 호출이 대부분이라 보고용이다. */
  unresolved: number;
}

export interface CallGraphInput {
  files: readonly FileImports[];
  blocks: readonly FileBlocks[];
  /** 파일 간선 — `resolveImports` 의 결과. import 한 파일과 HTTP 짝을 여기서 읽는다. */
  edges: readonly ResolvedEdge[];
}

const cmp = (a: string, b: string): number => (a < b ? -1 : Number(a > b));
const byRef = (a: BlockRef, b: BlockRef): number =>
  cmp(a.path, b.path) || a.lineStart - b.lineStart || a.lineEnd - b.lineEnd;

/** 확장자. `a/b.vue` → `vue`. */
const extOf = (path: string): string => {
  const dot = path.lastIndexOf('.');
  return dot === -1 || dot < path.lastIndexOf('/') ? '' : path.slice(dot + 1);
};
/** `a/AuthService.java` → `AuthService`. */
const stemOf = (path: string): string => {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? base : base.slice(0, dot);
};

const isJava = (path: string): boolean => extOf(path) === 'java';
const isMapper = (path: string): boolean => extOf(path) === 'xml';

/** 파일 하나의 블록 색인 — 줄로 안쪽 블록을 찾고 이름으로 블록을 찾는다. */
class FileIndex {
  readonly blocks: BlockRef[];

  constructor(readonly path: string, raw: readonly RawBlock[]) {
    this.blocks = raw
      .filter((b) => b.name !== null && b.name !== '')
      .map((b) => ({
        path, name: b.name as string, lineStart: b.lineStart, lineEnd: b.lineEnd, form: b.form ?? null,
      }))
      .sort(byRef);
  }

  /** 줄을 감싸는 **가장 안쪽** 블록. 클래스 안의 메서드면 메서드다. */
  at(line: number): BlockRef | null {
    let best: BlockRef | null = null;
    for (const b of this.blocks) {
      if (line < b.lineStart || line > b.lineEnd) continue;
      if (best === null || b.lineEnd - b.lineStart < best.lineEnd - best.lineStart) best = b;
    }
    return best;
  }

  /** 이 이름의 블록들. 클래스 블록은 부를 수 없으므로 뺀다. */
  named(name: string): BlockRef[] {
    return this.blocks.filter((b) => b.name === name && b.form !== 'class');
  }

  /** 파일 맨 위에서 도는 코드의 자리. 범위는 이 파일에서 본 마지막 줄까지다. */
  module(): BlockRef {
    if (this.moduleRef === null) {
      const end = Math.max(1, ...this.blocks.map((b) => b.lineEnd), this.lastLine);
      this.moduleRef = { path: this.path, name: MODULE_BLOCK, lineStart: 1, lineEnd: end, form: 'module' };
    }
    return this.moduleRef;
  }

  private moduleRef: BlockRef | null = null;

  /** 캡처가 본 마지막 줄 — 모듈 블록의 끝. */
  lastLine = 1;
}

/** 모듈 블록의 이름. 화면은 이것을 「파일 맨 위」로 읽는다. */
export const MODULE_BLOCK = '(module)';

interface Ctx {
  index: Map<string, FileIndex>;
  /** 파일 → import 한 파일들 (static·dynamic·type). */
  imports: Map<string, string[]>;
  /** 자바 파일 이름(`AuthService`) → 그 이름의 파일들. */
  byStem: Map<string, string[]>;
}

/**
 * 호출 그래프를 세운다. 파일 간선과 달리 **노드가 블록**이라 `authService.js` 의 `login` 과
 * `signup` 이 서로 다른 노드다 — 2단 추적이 둘을 가르는 근거다.
 */
export function buildCallGraph(input: CallGraphInput): CallGraph {
  const ctx = context(input);
  const edges: CallEdge[] = [];
  const entries: EntryPoint[] = [];
  const seen = new Set<string>();
  let unresolved = 0;

  const push = (edge: CallEdge): void => {
    const key = `${edge.from.path}:${edge.from.lineStart}>${edge.to.path}:${edge.to.lineStart}@${edge.line}#${edge.kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const file of input.files) {
    const index = ctx.index.get(file.path);
    if (index === undefined) continue;
    for (const raw of file.imports) {
      const form = raw.form ?? '';
      if (form === 'call' || form === 'call-self') {
        // 블록 밖의 호출은 **모듈 자체**가 부르는 것이다 — Vue 의 `<script setup>` 은 통째로 컴포넌트의
        // 준비 함수이고, `const { getSessionUser } = useUserStorage()` 가 거기 산다. 파일 하나에
        // 모듈 블록 하나를 세운다 (`blocks` 목록에는 넣지 않는다 — 실제 줄 범위가 아니다).
        const from = index.at(raw.line) ?? index.module();
        const recv = form === 'call' ? raw.ctx?.['recv'] ?? null : null;
        const to = resolveCall(file, from, recv, raw.specifier, raw.line, ctx);
        if (to === null) {
          unresolved += 1;
          continue;
        }
        push({ from, to, line: raw.line, kind: 'call' });
        // DAO 메서드 → 매퍼 문. 이름이 글자 그대로 같다 (D159 의 `_blocks.scm`).
        for (const sql of mapperStatement(to, ctx)) push({ from: to, to: sql, line: to.lineStart, kind: 'mapper' });
        continue;
      }
      if (form === 'entry-scheduled') {
        const block = index.at(raw.line);
        if (block !== null) entries.push({ block, kind: 'scheduled', line: raw.line, label: 'scheduled' });
        continue;
      }
      const route = /^route-(bare-)?(get|post|put|patch|delete)$/.exec(form);
      if (route !== null) {
        const block = index.at(raw.line);
        if (block === null) continue;
        const verb = (route[2] as string).toUpperCase();
        const leaf = route[1] === undefined ? raw.specifier : '';
        entries.push({ block, kind: 'route', line: raw.line, label: `${verb} ${leaf}` });
      }
    }
  }

  // 프론트의 호출 → 라우트 메서드. 파일 간선이 이미 짝을 찾아 두었다 (D159).
  for (const e of input.edges) {
    if (e.kind !== 'http' || e.toLine === undefined) continue;
    const caller = ctx.index.get(e.from);
    const from = caller === undefined ? null : caller.at(e.line) ?? caller.module();
    const to = ctx.index.get(e.to)?.at(e.toLine) ?? null;
    if (from === null || to === null) continue;
    push({ from, to, line: e.line, kind: 'http' });
  }

  const blocks = [...ctx.index.values()].flatMap((i) => i.blocks).sort(byRef);
  edges.sort((a, b) => byRef(a.from, b.from) || a.line - b.line || byRef(a.to, b.to) || cmp(a.kind, b.kind));
  entries.sort((a, b) => byRef(a.block, b.block) || a.line - b.line || cmp(a.label, b.label));
  return { blocks, edges, entries, unresolved };
}

function context(input: CallGraphInput): Ctx {
  const index = new Map<string, FileIndex>();
  for (const f of input.blocks) index.set(f.path, new FileIndex(f.path, f.blocks));
  // 블록이 하나도 없는 파일도 색인에 둔다 — `at()` 이 `null` 을 돌려주면 된다.
  for (const f of input.files) {
    if (!index.has(f.path)) index.set(f.path, new FileIndex(f.path, []));
    const at = index.get(f.path) as FileIndex;
    for (const r of f.imports) at.lastLine = Math.max(at.lastLine, r.line);
  }

  const imports = new Map<string, string[]>();
  for (const e of input.edges) {
    if (e.kind === 'http') continue;
    imports.set(e.from, [...(imports.get(e.from) ?? []), e.to]);
  }
  const byStem = new Map<string, string[]>();
  for (const path of index.keys()) {
    if (!isJava(path)) continue;
    const stem = stemOf(path);
    byStem.set(stem, [...(byStem.get(stem) ?? []), path].sort(cmp));
  }
  return { index, imports, byStem };
}

/**
 * 호출 하나를 블록으로. 자바는 수신자의 **타입**으로, 나머지는 **import 한 파일의 이름**으로.
 * 어느 쪽이든 후보가 둘 이상 남으면 `null` 이다.
 */
function resolveCall(
  file: FileImports, from: BlockRef, recv: string | null, name: string, line: number, ctx: Ctx,
): BlockRef | null {
  if (isJava(file.path)) return resolveJavaCall(file, from, recv, name, line, ctx);

  const here = ctx.index.get(file.path) as FileIndex;
  const candidates: BlockRef[] = [];
  // 자기 호출은 같은 파일이 먼저다.
  if (recv === null) {
    const own = here.named(name).filter((b) => !(b.lineStart === from.lineStart && b.path === from.path));
    if (own.length === 1) return own[0] as BlockRef;
    if (own.length > 1) return null;
  }
  for (const target of ctx.imports.get(file.path) ?? []) {
    const index = ctx.index.get(target);
    if (index === undefined) continue;
    candidates.push(...index.named(name));
  }
  if (recv !== null) candidates.push(...here.named(name));
  const files = new Set(candidates.map((b) => b.path));
  if (files.size === 0) return null;
  if (files.size === 1) return first(candidates);
  if (recv === null) return null;
  // 수신자 이름으로 가른다 — `authStore.login` 은 `authStore.js` 의 것이다.
  const want = recv.toLowerCase();
  const matched = candidates.filter((b) => stemOf(b.path).toLowerCase() === want);
  const matchedFiles = new Set(matched.map((b) => b.path));
  return matchedFiles.size === 1 ? first(matched) : null;
}

function resolveJavaCall(
  file: FileImports, from: BlockRef, recv: string | null, name: string, line: number, ctx: Ctx,
): BlockRef | null {
  if (recv === null) {
    // `helper()` · `this.helper()` — 같은 파일의 메서드. 자기 자신(재귀)은 뺀다.
    const own = (ctx.index.get(file.path) as FileIndex).named(name)
      .filter((b) => b.lineStart !== from.lineStart);
    return own.length === 1 ? (own[0] as BlockRef) : null;
  }
  const type = receiverType(file, from, recv, line) ?? recv; // `SecurityUtil.get()` 은 타입이 곧 수신자
  const target = javaFile(file.path, type, ctx);
  if (target === null) return null;
  const named = (ctx.index.get(target) as FileIndex).named(name);
  // 오버로드는 첫 정의로 — 인자 타입을 안 보므로 더 가를 수 없다.
  return named.length === 0 ? null : (named[0] as BlockRef);
}

/**
 * 수신자 이름 → 타입. 같은 블록 안에서 앞서 선언된 지역 변수가 필드를 가린다.
 * `User user = userDao.findById(…)` 뒤의 `user.getUserId()` 는 `User` 의 것이다.
 */
function receiverType(file: FileImports, from: BlockRef, recv: string, line: number): string | null {
  let local: string | null = null;
  let field: string | null = null;
  for (const raw of file.imports) {
    if (raw.specifier !== recv) continue;
    const type = raw.ctx?.['type'];
    if (type === undefined) continue;
    if (raw.form === 'local' && raw.line >= from.lineStart && raw.line <= line) local = type;
    else if (raw.form === 'field') field = type;
  }
  return local ?? field;
}

/**
 * `AuthService` → `…/AuthService.java`. 이 파일이 import 하거나 같은 디렉터리에 있는 것이 먼저고,
 * 없으면 리포에 그 이름이 하나뿐일 때만 잇는다.
 */
function javaFile(from: string, type: string, ctx: Ctx): string | null {
  const all = ctx.byStem.get(type) ?? [];
  if (all.length === 0) return null;
  if (all.length === 1) return all[0] as string;
  const near = new Set([...(ctx.imports.get(from) ?? []), ...all.filter((p) => dirOf(p) === dirOf(from))]);
  const close = all.filter((p) => near.has(p));
  return close.length === 1 ? (close[0] as string) : null;
}

/** DAO 메서드가 가리키는 매퍼 문 — DAO 파일이 가리키는 `.xml` 에서 같은 `id`. */
function mapperStatement(method: BlockRef, ctx: Ctx): BlockRef[] {
  if (!isJava(method.path)) return [];
  const out: BlockRef[] = [];
  for (const target of ctx.imports.get(method.path) ?? []) {
    if (!isMapper(target)) continue;
    out.push(...(ctx.index.get(target)?.named(method.name) ?? []));
  }
  return out;
}

const first = (blocks: readonly BlockRef[]): BlockRef | null =>
  [...blocks].sort(byRef)[0] ?? null;

function dirOf(path: string): string {
  const at = path.lastIndexOf('/');
  return at === -1 ? '' : path.slice(0, at);
}
