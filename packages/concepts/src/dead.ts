/**
 * 죽은 갈래 (D168 · `docs/program/README.md` §5 「졸업 과제」).
 *
 * 폐포에 든 파일이 전부 살아 있는 것은 아니다 — 실측 리포에서 `useUserStorage.js` 는 백엔드 이전의
 * localStorage 「DB」였고 함수 9개 중 7개는 아무도 안 불렀다. 프론트가 부르는 `GET /emotions/stats`
 * 는 서버 어디에도 없고, `imageService.js` 는 아무도 import 하지 않는다. 학습자가 그것도 읽으면
 * 경로가 흐려지고, 반대로 **그것을 스스로 찾아내는 것**이 앱이 답을 모르는 마지막 문항이다.
 *
 * 그래서 지우지 않고 **표시만** 한다. 넷 다 「호출 0」이 근거인데, 호출로 안 보이는 부름이 있다 —
 * 값으로 넘긴 함수(`arr.map(fmt)`), 템플릿에서 부른 핸들러(`@click="save"`), 프레임워크가 부르는
 * 생명주기. 그래서 `uncalled-export` 는 판정이 아니라 **후보**이고, 그것을 고르는 것도 문항이다.
 */
import type { BlockRef, CallGraph } from './calls.js';
import { httpMisses, routeDecls, type FileImports, type ResolvedEdge } from './resolve-imports.js';

export type DeadKind = 'unreached-call' | 'uncalled-route' | 'uncalled-export' | 'orphan-file';

export interface DeadBranch {
  kind: DeadKind;
  path: string;
  /** 파일 단위(`orphan-file`)면 `null`. */
  line: number | null;
  /** 라우트 문자열 · 함수 이름 · 파일 이름. */
  label: string;
}

export interface DeadInput {
  paths: readonly string[];
  files: readonly FileImports[];
  edges: readonly ResolvedEdge[];
  graph: CallGraph;
}

/** 이름만으로 살아 있다고 보는 파일 — 프레임워크나 빌드가 부른다. */
const ALIVE_BY_NAME = /(^|\/)(main|index|App|app|router|setup|vite\.config|vitest\.config)\.[a-z]+$|(Application|Config|Handler|Advice|Filter|Aspect|Listener|Interceptor)\.java$|Test[A-Za-z]*\.java$|\.d\.ts$/;
/** 점으로 시작하는 디렉터리(`.metadata`·`.vscode`)는 도구의 것이지 코드가 아니다. */
const TOOL_DIR = /(^|\/)\./;
/** 코드로 세는 확장자. 설정·데이터·스타일은 죽었다고 말할 근거가 없다. */
const CODE_EXT = new Set(['js', 'jsx', 'ts', 'tsx', 'vue', 'java', 'py', 'xml', 'go', 'rs']);
/** 함수 단위로 세는 확장자. `.vue` 는 뺀다 — 템플릿이 부르는 핸들러가 호출로 안 보인다. */
const FUNCTION_EXT = new Set(['js', 'jsx', 'ts', 'tsx', 'py']);

const cmp = (a: string, b: string): number => (a < b ? -1 : Number(a > b));
const extOf = (path: string): string => {
  const dot = path.lastIndexOf('.');
  return dot === -1 || dot < path.lastIndexOf('/') ? '' : path.slice(dot + 1);
};
const keyOf = (b: BlockRef): string => `${b.path}:${b.lineStart}`;

export function deadBranches(input: DeadInput): DeadBranch[] {
  const out: DeadBranch[] = [];

  // ① 라우트 없는 호출 — 부르는 쪽만 있다.
  for (const miss of httpMisses({ paths: input.paths, files: input.files })) {
    out.push({ kind: 'unreached-call', path: miss.path, line: miss.line, label: `${miss.verb} ${miss.route}` });
  }

  // ② 부르는 곳 없는 라우트 — 받는 쪽만 있다.
  const hit = new Set(input.edges.filter((e) => e.kind === 'http').map((e) => `${e.to}:${e.toLine ?? 0}`));
  for (const decl of routeDecls(input.files)) {
    if (hit.has(`${decl.path}:${decl.line}`)) continue;
    out.push({ kind: 'uncalled-route', path: decl.path, line: decl.line, label: decl.route });
  }

  // ③ 호출 0 인 함수 — 후보다.
  const called = new Set(input.graph.edges.map((e) => keyOf(e.to)));
  const entry = new Set(input.graph.entries.map((e) => keyOf(e.block)));
  for (const block of input.graph.blocks) {
    if (!FUNCTION_EXT.has(extOf(block.path)) || ALIVE_BY_NAME.test(block.path) || TOOL_DIR.test(block.path)) continue;
    if (block.form === 'class' || called.has(keyOf(block)) || entry.has(keyOf(block))) continue;
    out.push({ kind: 'uncalled-export', path: block.path, line: block.lineStart, label: block.name });
  }

  // ④ 고아 파일 — 아무도 import 하지 않고 문도 아니다.
  const imported = new Set(input.edges.map((e) => e.to));
  const entryFiles = new Set([
    ...input.edges.filter((e) => e.kind === 'http').map((e) => e.from),
    ...input.graph.entries.map((e) => e.block.path),
  ]);
  for (const path of input.paths) {
    if (!CODE_EXT.has(extOf(path)) || ALIVE_BY_NAME.test(path) || TOOL_DIR.test(path)) continue;
    if (imported.has(path) || entryFiles.has(path)) continue;
    out.push({ kind: 'orphan-file', path, line: null, label: path.slice(path.lastIndexOf('/') + 1) });
  }

  return out.sort((a, b) => cmp(a.kind, b.kind) || cmp(a.path, b.path) || (a.line ?? 0) - (b.line ?? 0) || cmp(a.label, b.label));
}
