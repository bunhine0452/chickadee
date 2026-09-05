/**
 * 재료 → `StageRequest` (D172 ①·④). 순수 함수 — IPC 는 `bake.ts` 가 한다.
 *
 * 생성기(D164)가 요구하는 것 중 저장소에 **그대로 있는 것**(파일 줄 · 줄기 · 간선 · 사용처 ·
 * 블록 · 커밋)은 모양만 옮기고, **없는 것** 둘은 여기서 글자로 만든다 — `origin` 의 이름 자리
 * (누가 정하고 · 옮겨 싣고 · 읽나)와 `contract` 의 응답 키(백엔드가 만드는 이름을 프런트가
 * 어디서 읽나). 둘 다 정규식이다: 이음매가 글자라는 D159 의 근거를 그대로 쓴다.
 */
import type {
  FocusLine, Hop, LineWindow, NameUse, ResponseKey, StageBlock, StageCommit, StageEdge, StageFile,
  StageRequest, StageSite,
} from './deps.js';
import type { Concept } from '@chickadee/dictionary';
import type { AstLite } from '@chickadee/ipc-client';
import type { BlockConcept } from '@chickadee/cards';

/** 읽어 온 파일 하나. `lines` 는 **부분**일 수 있다 — 큰 파일은 줄기의 칸 근처만 읽는다. */
export interface FileText {
  path: string;
  fileId: number;
  grammar: string | null;
  lineCount: number;
  lines: readonly FocusLine[];
}

export interface BlockRow {
  path: string;
  blockId: number;
  name: string | null;
  from: number;
  to: number;
  hash: string;
  ast: AstLite | null;
}

/** `schema.bindings` 의 행 — 매퍼 `column` ↔ `property` ↔ 엔티티 필드 (D169). */
export interface BindingRow {
  path: string;
  line: number;
  column: string;
  property: string;
  entity: string;
  entityPath: string | null;
  table: string | null;
}

/** DDL 의 열 하나 — 어느 파일 어느 줄인가. */
export interface ColumnRow {
  table: string;
  column: string;
  path: string;
  line: number;
}

export interface Materials {
  repoId: number;
  unitId: number;
  unitName: string;
  dictVersion: string;
  attempt: number;
  concepts: ReadonlyMap<string, Concept>;
  files: readonly FileText[];
  paths: readonly Hop[][];
  edges: readonly StageEdge[];
  sites: readonly StageSite[];
  blocks: readonly BlockRow[];
  bindings: readonly BindingRow[];
  columns: readonly ColumnRow[];
  commits: readonly StageCommit[];
  layerOf: (conceptId: string) => number;
}

/** 전부 읽는 파일 크기 상한(줄). 넘으면 줄기의 칸 근처만 읽는다 — `LandingView.vue` 1,527줄이 그 경우다. */
export const FULL_READ_MAX = 800;
/** 큰 파일에서 칸 앞뒤로 더 읽는 줄 수. 이웃 칸의 사양(±6)과 프롬프트 창(±4)이 안에 든다. */
export const RANGE_PAD = 8;
/** AST 를 파싱하는 블록의 크기 상한(줄)과 개수 상한 — `reorder`·`exec` 는 작은 블록이 낫다. */
export const AST_MAX_LINES = 120;
export const AST_MAX_BLOCKS = 24;

/**
 * 파일 문법 → 문항이 쓰는 문법 키. `.vue` 의 스크립트는 `javascript` 이고(`langs.rs` 가 같은
 * 문법을 쓴다), 매퍼 XML 은 파싱 문법이 `xml` 이다. `vue_style` 은 문항 대상이 아니다.
 */
export function stageGrammar(grammar: string | null): string | null {
  if (grammar === null) return null;
  if (grammar === 'vue') return 'javascript';
  if (grammar === 'mybatis') return 'xml';
  if (grammar === 'vue_style' || grammar === 'mybatis_sql') return null;
  return grammar;
}

/** AST 를 파싱할 문법 — 실행 순서·재배열은 코드 문법에서만 뜻이 있다. */
export function astGrammar(grammar: string | null): string | null {
  const g = stageGrammar(grammar);
  return g === null || g === 'xml' || g === 'css' || g === 'sql' ? null : g;
}

const FRONT = /\.(vue|jsx?|tsx?)$/i;
const JAVA = /\.java$/i;
const RESPONSE_FILE = /(Response|Res|Dto|DTO|Vo|VO)\.java$/;
const FIELD = /^\s*private\s+(?:final\s+)?[\w<>[\], ?.]+\s+(\w+)\s*(?:=|;)/;

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fileMap(m: Materials): Map<string, FileText> {
  return new Map(m.files.map((f) => [f.path, f]));
}

const lineAt = (f: FileText | undefined, n: number): FocusLine | undefined =>
  f?.lines.find((l) => l.n === n);

function onPath(m: Materials): Set<string> {
  const out = new Set<string>();
  for (const p of m.paths) for (const h of p) out.add(h.path);
  return out;
}

/** 이름 자리 (`origin`). 매퍼의 `column ↔ property` 한 쌍마다 그 이름이 어디서 정해지고 읽히나. */
export function deriveNames(m: Materials): NameUse[] {
  const files = fileMap(m);
  const path = onPath(m);
  const out: NameUse[] = [];
  const seen = new Set<string>();
  const push = (u: NameUse): void => {
    const key = `${u.name}@${u.path}:${u.line}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(u);
  };
  const columnAt = new Map(m.columns.map((c) => [`${c.table}.${c.column}`, c]));
  const props = new Map<string, BindingRow[]>();
  for (const b of m.bindings) props.set(b.property, [...(props.get(b.property) ?? []), b]);

  for (const [name, rows] of [...props.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (name.length < 3) continue;
    const reads: NameUse[] = [];
    const anchors: NameUse[] = [];
    for (const b of rows) {
      const mapper = lineAt(files.get(b.path), b.line);
      if (mapper !== undefined) anchors.push({ name, path: b.path, line: b.line, text: mapper.t, role: 'define' });
      const col = b.table === null ? undefined : columnAt.get(`${b.table}.${b.column}`);
      const ddl = col === undefined ? undefined : lineAt(files.get(col.path), col.line);
      if (col !== undefined && ddl !== undefined) anchors.push({ name, path: col.path, line: col.line, text: ddl.t, role: 'define' });
      const entity = b.entityPath === null ? undefined : files.get(b.entityPath);
      const field = entity?.lines.find((l) => new RegExp(`^\\s*(?:private|protected|public)?[\\w<>[\\], ?.]*\\s\\b${escape(name)}\\b\\s*[;=]`).test(l.t));
      if (entity !== undefined && field !== undefined) anchors.push({ name, path: entity.path, line: field.n, text: field.t, role: 'carry' });
    }
    const getter = new RegExp(`\\bget${escape(cap(name))}\\s*\\(`);
    const member = new RegExp(`\\.${escape(name)}\\b(?!\\s*\\()`);
    const builder = new RegExp(`\\.${escape(name)}\\s*\\(`);
    for (const f of m.files) {
      if (!path.has(f.path)) continue;
      let n = 0;
      for (const l of f.lines) {
        if (n >= 3) break;
        if (JAVA.test(f.path)) {
          if (getter.test(l.t)) { reads.push({ name, path: f.path, line: l.n, text: l.t, role: 'read' }); n += 1; continue; }
          if (builder.test(l.t)) { reads.push({ name, path: f.path, line: l.n, text: l.t, role: 'carry' }); n += 1; }
        } else if (FRONT.test(f.path) && member.test(l.t)) {
          reads.push({ name, path: f.path, line: l.n, text: l.t, role: 'read' });
          n += 1;
        }
      }
    }
    // 읽는 자리가 없으면 물을 것이 없다 — 정하는 자리만으로는 문항이 안 선다.
    if (reads.length === 0) continue;
    for (const a of anchors) push(a);
    for (const r of reads) push(r);
  }
  return out;
}

/** 응답 키 (`contract`). 백엔드 응답 클래스의 필드를 프런트가 `.key` 로 읽는 자리. */
export function deriveResponseKeys(m: Materials): ResponseKey[] {
  const path = onPath(m);
  const makers = m.files.filter((f) => RESPONSE_FILE.test(f.path));
  const fronts = m.files.filter((f) => FRONT.test(f.path) && path.has(f.path));
  const out: ResponseKey[] = [];
  const seenKey = new Set<string>();
  for (const maker of makers) {
    for (const l of maker.lines) {
      const hit = FIELD.exec(l.t);
      const key = hit?.[1];
      if (key === undefined || key.length < 3 || seenKey.has(key)) continue;
      const member = new RegExp(`\\.${escape(key)}\\b`);
      const reads: ResponseKey['reads'][number][] = [];
      for (const f of fronts) {
        for (const fl of f.lines) {
          if (reads.length >= 4) break;
          if (member.test(fl.t)) reads.push({ path: f.path, line: fl.n, text: fl.t });
        }
      }
      if (reads.length === 0) continue;
      seenKey.add(key);
      out.push({ key, maker: { path: maker.path, line: l.n, text: l.t }, reads });
    }
  }
  return out.sort((a, b) => b.reads.length - a.reads.length || a.key.localeCompare(b.key)).slice(0, 8);
}

/** 블록 + 그 범위의 사용처 → `StageBlock`. 문법이 없는 파일(스타일·매퍼 SQL 구간)의 블록은 뺀다. */
export function stageBlocks(m: Materials): StageBlock[] {
  const files = fileMap(m);
  const out: StageBlock[] = [];
  for (const b of m.blocks) {
    const file = files.get(b.path);
    const grammar = file === undefined ? null : stageGrammar(file.grammar);
    if (grammar === null) continue;
    const window: LineWindow = { from: b.from, to: b.to };
    const byConcept = new Map<string, BlockConcept>();
    for (const s of m.sites) {
      if (s.path !== b.path || s.site.lineStart < b.from || s.site.lineStart > b.to) continue;
      const at = byConcept.get(s.site.conceptId);
      if (at === undefined) {
        byConcept.set(s.site.conceptId, {
          conceptId: s.site.conceptId, layer: m.layerOf(s.site.conceptId), siteCount: 1, siteId: s.site.id,
        });
      } else {
        at.siteCount += 1;
        at.siteId = Math.min(at.siteId, s.site.id);
      }
    }
    out.push({
      path: b.path, blockId: b.blockId, name: b.name, window, ast: b.ast, grammar, hash: b.hash,
      concepts: [...byConcept.values()].sort((x, y) => x.conceptId.localeCompare(y.conceptId)),
    });
  }
  return out;
}

/** 읽어 온 줄 안에 있는 사용처만 — 창이 빈 판은 아무것도 못 묻는다. */
export function loadedSites(m: Materials): StageSite[] {
  const files = fileMap(m);
  return m.sites.filter((s) => lineAt(files.get(s.path), s.site.lineStart) !== undefined);
}

export function assembleStageRequest(m: Materials): StageRequest {
  const files = new Map<string, StageFile>();
  for (const f of m.files) {
    files.set(f.path, { path: f.path, fileId: f.fileId, grammar: stageGrammar(f.grammar), lines: f.lines });
  }
  return {
    repoId: m.repoId,
    unitId: m.unitId,
    unitName: m.unitName,
    dictVersion: m.dictVersion,
    attempt: m.attempt,
    files,
    paths: m.paths,
    edges: m.edges,
    concepts: m.concepts,
    sites: loadedSites(m),
    blocks: stageBlocks(m),
    names: deriveNames(m),
    responseKeys: deriveResponseKeys(m),
    commits: m.commits,
  };
}
