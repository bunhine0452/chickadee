/**
 * T2 성능 게이트 (04 §9 · 00 §5). **헤드리스로 잴 수 있는 것만** 잰다 — 해석과 배치는 순수
 * 계산이라 여기서 뜻이 있고, 지도의 프레임은 WKWebView 안에서만 뜻이 있어 `devtools` 가 잰다.
 *
 * `packages/scheduler/src/perf.test.ts` 와 같은 규칙이다: 임계는 문서가 정한 값 그대로이고,
 * 이 테스트가 잡으려는 것은 「20 % 느려짐」이 아니라 **자릿수가 바뀌는 사고**다 — 해석기가
 * 파일마다 전체 경로 목록을 다시 훑는 코드로 바뀌는 것 같은.
 *
 * 해석기는 `@chickadee/concepts` 것이지만 게이트를 T2 한자리에 모은다 — 04 §9 가 「2,000 파일
 * 해석 < 1.5s」와 「24 노드 배치 < 5ms」를 한 문단에 적었고, 둘 다 지도 하나를 세우는 값이다.
 */
import { resolveImports, type FileImports } from '@chickadee/concepts';
import { describe, expect, test } from 'vitest';

import { buildGraph } from './t2-graph.js';
import type { GraphEdge, GraphFile } from './t2-types.js';

/** 04 §9 「2,000 파일 · 5만 조회 < 1.5s」. */
const RESOLVE_BUDGET_MS = 1_500;
const RESOLVE_FILES = 2_000;
const IMPORTS_PER_FILE = 25;
/** 04 §9 「24 노드 배치 < 5ms」. */
const LAYOUT_BUDGET_MS = 5;

/** 40개 폴더에 2,000 파일. 상대 경로로 서로를 가리켜 해석기가 실제로 파일 집합을 뒤진다. */
function repo(): { paths: string[]; files: FileImports[] } {
  const paths = Array.from({ length: RESOLVE_FILES }, (_, i) =>
    `src/features/f${String(i % 40).padStart(2, '0')}/mod${String(i).padStart(4, '0')}.ts`);
  const files = paths.map((path, i) => ({
    path,
    imports: Array.from({ length: IMPORTS_PER_FILE }, (_, k) => {
      const target = paths[(i * 7 + k * 13) % RESOLVE_FILES] as string;
      const [, , dir, base] = target.split('/');
      return {
        specifier: `../${dir as string}/${(base as string).replace('.ts', '')}`,
        form: 'static',
        line: k + 1,
      };
    }),
  }));
  return { paths, files };
}

describe('T2 성능 (04 §9)', () => {
  test(`2,000 파일 · ${RESOLVE_FILES * IMPORTS_PER_FILE} 조회 해석이 ${RESOLVE_BUDGET_MS}ms 안에 끝난다`, () => {
    const { paths, files } = repo();
    const at = performance.now();
    const edges = resolveImports({ paths, files });
    const ms = performance.now() - at;
    // 해석이 실제로 되고 있는지 먼저 본다 — 0건이면 빠른 게 아니라 안 도는 것이다.
    expect(edges.length).toBeGreaterThan(1_000);
    expect(ms).toBeLessThan(RESOLVE_BUDGET_MS);
  });

  test(`24 노드 배치가 ${LAYOUT_BUDGET_MS}ms 안에 끝난다`, () => {
    const files: GraphFile[] = Array.from({ length: 24 }, (_, i) => ({
      fileId: i + 1,
      path: `features/cart/${['app', 'features', 'hooks', 'lib'][i % 4] as string}/n${i}.tsx`,
      inUnit: true,
    }));
    const edges: GraphEdge[] = files.slice(0, -1).map((f, i) => ({
      from: f.path, to: (files[i + 1] as GraphFile).path,
      kind: 'static' as const, confidence: 'syntactic' as const,
    }));
    const at = performance.now();
    const graph = buildGraph({ files, edges, unitRoot: 'features/cart' });
    const ms = performance.now() - at;
    expect(graph.files.length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(LAYOUT_BUDGET_MS);
  });

  test('2,000 파일 지도도 24 노드로 끝난다 — 상한은 상한이다 (D102)', () => {
    const { paths } = repo();
    const files: GraphFile[] = paths.map((path, i) => ({ fileId: i + 1, path, inUnit: i < 100 }));
    const edges: GraphEdge[] = files.slice(0, -1).map((f, i) => ({
      from: f.path, to: (files[i + 1] as GraphFile).path,
      kind: 'static' as const, confidence: 'syntactic' as const,
    }));
    const at = performance.now();
    const graph = buildGraph({ files, edges, unitRoot: 'src/features/f00' });
    const ms = performance.now() - at;
    expect(graph.files.length).toBeLessThanOrEqual(24);
    // 배치 자체는 24 노드짜리지만 입력을 훑는 값이 있다 — 그래도 프레임 하나 안이어야 한다.
    expect(ms).toBeLessThan(100);
  });
});
