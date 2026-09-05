import { describe, expect, test } from 'vitest';

import { buildCallGraph, type FileBlocks } from './calls.js';
import { deadBranches } from './dead.js';
import type { RawBlock } from './derive.js';
import type { FileImports, ResolvedEdge } from './resolve-imports.js';

const VIEW = 'FRONT/src/views/MyPageView.vue';
const STORAGE = 'FRONT/src/composables/useUserStorage.js';
const IMG = 'FRONT/src/services/imageService.js';
const MONTHLY = 'FRONT/src/services/monthlyAnalysisService.js';
const CTRL = 'BACK/src/main/java/com/a/controller/EmotionController.java';
const MAIN = 'FRONT/src/main.js';

const block = (name: string, lineStart: number, lineEnd: number): RawBlock =>
  ({ name, lineStart, lineEnd, startByte: 0, endByte: 0, form: null });
const edge = (from: string, to: string, kind: ResolvedEdge['kind'] = 'static', extra: Partial<ResolvedEdge> = {}): ResolvedEdge =>
  ({ from, to, kind, confidence: 'syntactic', line: 1, ...extra });

function repo(): { paths: string[]; files: FileImports[]; blocks: FileBlocks[]; edges: ResolvedEdge[] } {
  const files: FileImports[] = [
    { path: VIEW, imports: [
      { specifier: 'useUserStorage', form: 'call-self', line: 166 },
      { specifier: 'clearSessionUser', form: 'call-self', line: 170 },
    ] },
    { path: STORAGE, imports: [] },
    { path: IMG, imports: [] },
    { path: MONTHLY, imports: [{ specifier: '/emotions/stats', form: 'http-get', line: 65 }] },
    { path: CTRL, imports: [
      { specifier: '/api/emotions', form: 'route-base', line: 20 },
      { specifier: '/list', form: 'route-get', line: 30 },
    ] },
    { path: MAIN, imports: [] },
  ];
  const blocks: FileBlocks[] = [
    { path: VIEW, blocks: [block('onSave', 160, 175)] },
    { path: STORAGE, blocks: [
      block('useUserStorage', 6, 100), block('getSessionUser', 10, 12), block('clearSessionUser', 14, 16), block('saveUser', 20, 30),
    ] },
    { path: IMG, blocks: [block('upload', 1, 5)] },
    { path: MONTHLY, blocks: [block('stats', 60, 70)] },
    { path: CTRL, blocks: [block('list', 30, 35)] },
    { path: MAIN, blocks: [block('boot', 1, 5)] },
  ];
  const edges = [edge(VIEW, STORAGE), edge(MAIN, VIEW, 'dynamic')];
  const paths = files.map((f) => f.path);
  return { paths, files, blocks, edges };
}

const lines = (r: ReturnType<typeof repo>): string[] => {
  const graph = buildCallGraph({ files: r.files, blocks: r.blocks, edges: r.edges });
  return deadBranches({ paths: r.paths, files: r.files, edges: r.edges, graph })
    .map((d) => `${d.kind} ${d.path.slice(d.path.lastIndexOf('/') + 1)}:${d.line ?? '-'} ${d.label}`);
};

describe('deadBranches (D168)', () => {
  test('라우트 없는 호출 · 부르는 곳 없는 라우트 · 호출 0 인 함수 · 고아 파일', () => {
    expect(lines(repo())).toStrictEqual([
      'orphan-file imageService.js:- imageService.js',
      'orphan-file monthlyAnalysisService.js:- monthlyAnalysisService.js',
      'uncalled-export useUserStorage.js:10 getSessionUser',
      'uncalled-export useUserStorage.js:20 saveUser',
      'uncalled-export imageService.js:1 upload',
      'uncalled-export monthlyAnalysisService.js:60 stats',
      'uncalled-route EmotionController.java:30 GET /api/emotions/list',
      'unreached-call monthlyAnalysisService.js:65 GET /emotions/stats',
    ]);
  });

  test('불린 함수는 후보가 아니다 — 이름으로 import 한 파일의 블록으로 풀린다', () => {
    const out = lines(repo());
    expect(out.some((l) => l.endsWith(' clearSessionUser') || l.endsWith(' useUserStorage'))).toBe(false);
  });

  test('`.vue` 안의 함수와 `main.js` 는 세지 않는다 — 템플릿과 프레임워크가 부른다', () => {
    const out = lines(repo());
    expect(out.some((l) => l.includes('onSave') || l.includes('boot') || l.includes('main.js'))).toBe(false);
  });

  test('라우트에 닿은 호출과 불린 라우트는 죽지 않았다', () => {
    const r = repo();
    // 호출이 라우트에 닿게 바꾼다 — 접미 일치(`/emotions/list` ↔ `/api/emotions` + `/list`).
    const monthly = r.files.find((f) => f.path === MONTHLY) as FileImports;
    monthly.imports = [{ specifier: '/emotions/list', form: 'http-get', line: 65 }];
    r.edges.push(edge(MONTHLY, CTRL, 'http', { line: 65, toLine: 30 }));
    const out = lines(r);
    expect(out.some((l) => l.startsWith('unreached-call') || l.startsWith('uncalled-route'))).toBe(false);
  });
});
