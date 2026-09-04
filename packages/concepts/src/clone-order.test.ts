/**
 * 클론 코스 순서 (D120). 규칙 자체와 **결정성**을 본다.
 *
 * 결정성 골든은 `fixtures/repos/*.steps` 를 재료로 쓴다. `.steps` 는 픽스처 리포의 정본이고
 * (06 §1.2 — 생성물은 커밋하지 않는다) 여기서는 그것을 읽어 「어떤 커밋이 어떤 파일을
 * 만들었나」만 뽑는다. git 을 돌리지 않으므로 sha·시각은 실제 리포의 것이 아니다 —
 * 이 테스트가 재는 것은 「같은 재료면 같은 순서」이지 「git 과 같은 순서」가 아니다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  COMMIT_ORDER_MIN, commitOrder, courseOrder, depOrder,
  type CommitTouch, type CourseEdge, type CourseFile, type CourseUnit,
} from './clone-order.js';
import { resolveImports } from './resolve-imports.js';

const file = (fileId: number, path: string, unitId: number | null = null): CourseFile =>
  ({ fileId, path, unitId });

const paths = (steps: readonly { path: string }[]): string[] => steps.map((s) => s.path);

// ───────── 커밋 순 (clone-order-commit) ─────────

describe('커밋 순', () => {
  const files = [file(1, 'a.ts'), file(2, 'b.ts'), file(3, 'c.ts')];
  const touch = (sha: string, at: number, path: string, fileId: number): CommitTouch =>
    ({ sha, authoredAt: at, path, fileId });

  test('파일은 처음 나온 커밋 자리에 놓인다 — 다시 고쳐도 뒤로 밀리지 않는다', () => {
    const order = commitOrder(files, [
      touch('c1', 10, 'b.ts', 2),
      touch('c2', 20, 'a.ts', 1),
      touch('c3', 30, 'b.ts', 2),
      touch('c3', 30, 'c.ts', 3),
    ]);
    expect(paths(order)).toEqual(['b.ts', 'a.ts', 'c.ts']);
  });

  test('한 커밋 안에서는 경로 사전순이다', () => {
    const order = commitOrder(files, [
      touch('c1', 10, 'c.ts', 3),
      touch('c1', 10, 'a.ts', 1),
      touch('c1', 10, 'b.ts', 2),
    ]);
    expect(paths(order)).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  test('같은 시각 커밋은 sha 로 깬다 — 난수도 입력 순서도 타지 않는다', () => {
    const rows = [touch('zz', 10, 'a.ts', 1), touch('aa', 10, 'b.ts', 2)];
    // c.ts 는 어떤 커밋도 안 만졌으므로 뒤에 붙는다.
    expect(paths(commitOrder(files, rows))).toEqual(['b.ts', 'a.ts', 'c.ts']);
    expect(paths(commitOrder(files, [...rows].reverse()))).toEqual(['b.ts', 'a.ts', 'c.ts']);
  });

  test('어떤 커밋도 안 만진 파일은 버리지 않고 경로 순으로 뒤에 붙인다', () => {
    const order = commitOrder(files, [touch('c1', 10, 'c.ts', 3)]);
    expect(paths(order)).toEqual(['c.ts', 'a.ts', 'b.ts']);
  });

  test('목차 밖 파일을 만진 커밋은 자리를 만들지 않는다', () => {
    const order = commitOrder([file(1, 'a.ts')], [
      touch('c1', 10, 'gone.ts', 99),
      touch('c2', 20, 'a.ts', 1),
    ]);
    expect(paths(order)).toEqual(['a.ts']);
  });
});

// ───────── 위상 폴백 (clone-order-dep · -cycle) ─────────

describe('위상 폴백', () => {
  const edge = (from: number, to: number): CourseEdge => ({ fromFileId: from, toFileId: to });
  const unit = (id: number, name: string, orderIdx: number): CourseUnit => ({ id, name, orderIdx });

  test('불리는 쪽이 먼저 나온다 — 남이 쓰는 것을 먼저 읽는다', () => {
    const files = [file(1, 'app.ts'), file(2, 'util.ts')];
    expect(paths(depOrder(files, [], [edge(1, 2)]))).toEqual(['util.ts', 'app.ts']);
  });

  test('kind 가 달라 두 번 온 같은 짝을 두 번 세지 않는다', () => {
    const files = [file(1, 'app.ts'), file(2, 'util.ts')];
    // `import_edge` 의 PK 는 (from, to, kind) 라 static·type 이 같은 짝을 두 행으로 낸다.
    expect(paths(depOrder(files, [], [edge(1, 2), edge(1, 2)]))).toEqual(['util.ts', 'app.ts']);
  });

  test('간선이 없으면 경로 사전순이다', () => {
    const files = [file(3, 'c.ts'), file(1, 'a.ts'), file(2, 'b.ts')];
    expect(paths(depOrder(files, [], []))).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  test('대지가 바깥 순서이고 대지 없는 파일이 마지막이다', () => {
    const files = [file(1, 'z.ts', null), file(2, 'b/x.ts', 20), file(3, 'a/y.ts', 10)];
    const units = [unit(10, 'a', 0), unit(20, 'b', 1)];
    expect(paths(depOrder(files, units, []))).toEqual(['a/y.ts', 'b/x.ts', 'z.ts']);
  });

  test('대지를 넘는 간선은 무시한다 — 대지 순서가 이긴다', () => {
    const files = [file(1, 'a/one.ts', 10), file(2, 'b/two.ts', 20)];
    const units = [unit(10, 'a', 0), unit(20, 'b', 1)];
    // a/one.ts 가 b/two.ts 를 import 하지만 대지 순서를 뒤집지 않는다.
    expect(paths(depOrder(files, units, [edge(1, 2)]))).toEqual(['a/one.ts', 'b/two.ts']);
  });

  test('순환은 경로가 가장 앞선 파일에서 끊고 계속 간다', () => {
    const files = [file(1, 'b.ts'), file(2, 'c.ts'), file(3, 'a.ts')];
    // a → b → c → a 고리. 끊는 자리는 경로 사전순으로 a.ts 다.
    const cycle = [edge(3, 1), edge(1, 2), edge(2, 3)];
    expect(paths(depOrder(files, [], cycle))).toEqual(['a.ts', 'c.ts', 'b.ts']);
    expect(paths(depOrder(files, [], [...cycle].reverse()))).toEqual(['a.ts', 'c.ts', 'b.ts']);
  });

  test('순환 밖 파일은 위상 관계를 지킨다 — 남은 것을 통째로 뒤에 붙이지 않는다', () => {
    const files = [file(1, 'b.ts'), file(2, 'c.ts'), file(3, 'tail.ts')];
    // b ↔ c 고리 + tail 이 c 를 부른다. tail 은 c 뒤여야 한다.
    const order = depOrder(files, [], [edge(1, 2), edge(2, 1), edge(3, 2)]);
    expect(paths(order)).toEqual(['b.ts', 'c.ts', 'tail.ts']);
  });
});

// ───────── 갈래 ─────────

describe('갈래', () => {
  const files = [file(1, 'a.ts'), file(2, 'b.ts')];
  const touches: CommitTouch[] = [{ sha: 'c1', authoredAt: 1, path: 'b.ts', fileId: 2 }];

  test(`커밋 ${COMMIT_ORDER_MIN}개 미만이면 위상 폴백이다`, () => {
    const out = courseOrder({ files, commitCount: COMMIT_ORDER_MIN - 1, touches, units: [], edges: [] });
    expect(out.mode).toBe('dep');
    expect(paths(out.steps)).toEqual(['a.ts', 'b.ts']);
  });

  test(`커밋 ${COMMIT_ORDER_MIN}개부터는 커밋 순이다`, () => {
    const out = courseOrder({ files, commitCount: COMMIT_ORDER_MIN, touches, units: [], edges: [] });
    expect(out.mode).toBe('commit');
    expect(paths(out.steps)).toEqual(['b.ts', 'a.ts']);
  });
});

// ───────── 픽스처 결정성 골든 (clone-order-golden) ─────────

interface Repo { files: CourseFile[]; touches: CommitTouch[]; commitCount: number; edges: CourseEdge[] }

/**
 * `.steps` 를 읽어 「커밋이 어떤 파일을 A/M 로 만졌나」를 뽑는다.
 * `gen wave <n> <경로틀> …` 은 n 커밋이고 회마다 파일 하나를 쓴다 — 본문은 합성기가
 * 만들므로 여기서는 경로만 안다(합성 파일은 import 가 없어 간선도 없다).
 */
function readSteps(name: string): Repo {
  const text = readFileSync(join(process.cwd(), 'fixtures/repos', `${name}.steps`), 'utf8');
  const lines = text.split('\n');
  const bodies = new Map<string, string>();
  const alive = new Set<string>();
  let pending: string[] = [];
  let commit = 0;
  const touches: CommitTouch[] = [];
  const record = (): void => {
    commit += 1;
    for (const path of pending) {
      touches.push({ sha: `c${String(commit).padStart(4, '0')}`, authoredAt: commit, path, fileId: 0 });
    }
    pending = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const write = /^write\s+(\S+)\s+<<EOS\s*$/.exec(line);
    if (write?.[1] !== undefined) {
      const path = write[1];
      const body: string[] = [];
      for (i += 1; i < lines.length && lines[i] !== 'EOS'; i += 1) body.push(lines[i] ?? '');
      bodies.set(path, body.join('\n'));
      alive.add(path);
      pending.push(path);
      continue;
    }
    const del = /^delete\s+(\S+)\s*$/.exec(line);
    if (del?.[1] !== undefined) { alive.delete(del[1]); bodies.delete(del[1]); continue; }
    const ren = /^rename\s+(\S+)\s+(\S+)\s*$/.exec(line);
    if (ren?.[1] !== undefined && ren[2] !== undefined) {
      alive.delete(ren[1]);
      const body = bodies.get(ren[1]) ?? '';
      bodies.delete(ren[1]);
      bodies.set(ren[2], body);
      alive.add(ren[2]);
      // 이름 바꾸기는 `R` 이라 코스 재료가 아니다 — 새 경로는 다음 `write` 에서 A/M 로 온다.
      continue;
    }
    if (/^commit\s+/.test(line)) { record(); continue; }
    const gen = /^gen\s+wave\s+(\d+)\s+(\S+)\s/.exec(line);
    if (gen?.[1] !== undefined && gen[2] !== undefined) {
      for (let n = 1; n <= Number(gen[1]); n += 1) {
        const path = gen[2].replace('{i}', String(n).padStart(2, '0'));
        alive.add(path);
        pending.push(path);
        record();
      }
    }
  }
  if (pending.length > 0) record();

  const sorted = [...alive].sort();
  const idOf = new Map(sorted.map((path, i) => [path, i + 1]));
  const files = sorted.map((path) => file(idOf.get(path) ?? 0, path));
  const edges = resolveImports({
    paths: sorted,
    files: sorted.map((path) => ({
      path,
      imports: [...(bodies.get(path) ?? '').matchAll(/from\s+["']([^"']+)["']/g)]
        .map((m) => ({ specifier: m[1] ?? '', form: 'static', line: 1 })),
    })),
  }).map((e) => ({ fromFileId: idOf.get(e.from) ?? 0, toFileId: idOf.get(e.to) ?? 0 }));

  return {
    files,
    touches: touches
      .filter((t) => idOf.has(t.path))
      .map((t) => ({ ...t, fileId: idOf.get(t.path) ?? 0 })),
    commitCount: commit,
    edges,
  };
}

describe('픽스처 결정성', () => {
  for (const name of ['tiny', 'two-commits', 'projectox-like']) {
    test(`${name} — 같은 재료를 두 번 돌리면 order_json 이 같다`, () => {
      const repo = readSteps(name);
      const once = courseOrder({ ...repo, units: [] });
      const twice = courseOrder({
        // 입력 배열 순서를 뒤집어도 같아야 한다 — SQL 의 ORDER BY 에 기대지 않는다.
        files: [...repo.files].reverse(),
        touches: [...repo.touches].reverse(),
        edges: [...repo.edges].reverse(),
        commitCount: repo.commitCount,
        units: [],
      });
      expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
      expect(once.steps.length).toBe(repo.files.length);
      expect(new Set(paths(once.steps)).size).toBe(repo.files.length);
    });
  }

  test('tiny — 커밋 5개라 위상 폴백이고 시각 유틸이 그것을 부르는 파일보다 앞이다', () => {
    const repo = readSteps('tiny');
    const out = courseOrder({ ...repo, units: [] });
    expect(out.mode).toBe('dep');
    const at = (p: string): number => paths(out.steps).indexOf(p);
    // tiny 는 4번째 커밋에서 `src/util/time.ts` 를 `src/core/time.ts` 로 옮긴다.
    expect(at('src/core/time.ts')).toBeGreaterThanOrEqual(0);
    expect(at('src/core/time.ts')).toBeLessThan(at('src/store/repo.ts'));
  });

  test('two-commits — 파일 하나짜리 코스도 목차가 선다', () => {
    const out = courseOrder({ ...readSteps('two-commits'), units: [] });
    expect(out.mode).toBe('dep');
    expect(paths(out.steps)).toEqual(['src/index.ts']);
  });

  test('projectox-like — 커밋이 많아 커밋 순이고 씨앗 파일이 합성 파일보다 앞이다', () => {
    const repo = readSteps('projectox-like');
    // 씨앗 6 + gen wave 30+30+32. 머리 주석의 「95」는 씨앗을 3으로 센 옛 수다.
    expect(repo.commitCount).toBe(98);
    const out = courseOrder({ ...repo, units: [] });
    expect(out.mode).toBe('commit');
    const list = paths(out.steps);
    expect(list[0]).toBe('src/core/time.ts');
    expect(list.indexOf('src/core/time.ts')).toBeLessThan(list.indexOf('src/gen/service-01.ts'));
  });
});
