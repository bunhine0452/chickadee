/**
 * blame 2차 패스 (03 §1.5). 1차 패스는 blame 없이 끝나고 카드가 만들어진다 —
 * 여기가 늦게 와서 출처를 채운다. 실패해도 카드는 살아야 한다.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

type Site = { site_key: string; path: string; line_start: number };
type Hunk = { start: number; end: number; sha: string };

let sites: Site[] = [];
let blame: (path: string) => { hunks: Hunk[] };
let filled: { siteKey: string; sha: string }[] = [];
let calls: string[] = [];

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string) => {
        if (name !== 'derive.sites_for_rank') throw new Error(`뜻밖의 이름: ${name}`);
        return Promise.resolve(sites);
      },
      batch: (ops: { name: string; params: { siteKey: string; sha: string } }[]) => {
        for (const op of ops) filled.push({ siteKey: op.params.siteKey, sha: op.params.sha });
        return Promise.resolve(ops.map(() => ({ changes: 1, lastId: 0 })));
      },
    },
    git: {
      blameLines: (_root: string, path: string) => {
        calls.push(path);
        try {
          return Promise.resolve(blame(path));
        } catch (e) {
          return Promise.reject(e as Error);
        }
      },
    },
  },
  on: () => Promise.resolve(() => undefined),
  IpcError: class extends Error {},
}));

const { fillCommits, BLAME_BUDGET_MS } = await import('./blame.js');

beforeEach(() => {
  filled = [];
  calls = [];
  sites = [
    { site_key: 'a', path: 'src/a.ts', line_start: 2 },
    { site_key: 'b', path: 'src/a.ts', line_start: 9 },
    { site_key: 'c', path: 'src/b.ts', line_start: 1 },
  ];
  blame = () => ({ hunks: [{ start: 1, end: 5, sha: 'sha1' }, { start: 6, end: 12, sha: 'sha2' }] });
});

const now = () => 0;

describe('출처 채우기', () => {
  test('줄이 든 hunk 의 커밋이 붙는다', async () => {
    const n = await fillCommits({ repoId: 1, rootPath: '/r', now });
    expect(n).toBe(3);
    expect(filled).toContainEqual({ siteKey: 'a', sha: 'sha1' });
    expect(filled).toContainEqual({ siteKey: 'b', sha: 'sha2' });
  });

  test('파일마다 한 번만 부른다 — blame 은 비싸다', async () => {
    await fillCommits({ repoId: 1, rootPath: '/r', now });
    expect(calls).toEqual(['src/a.ts', 'src/b.ts']);
  });

  test('어느 hunk 에도 안 드는 줄은 그냥 비워 둔다', async () => {
    sites = [{ site_key: 'z', path: 'src/a.ts', line_start: 99 }];
    expect(await fillCommits({ repoId: 1, rootPath: '/r', now })).toBe(0);
  });

  test('한 파일이 실패해도 나머지는 채운다', async () => {
    blame = (path) => {
      if (path === 'src/a.ts') throw new Error('GIT_BLAME_TIMEOUT');
      return { hunks: [{ start: 1, end: 3, sha: 'sha3' }] };
    };
    const n = await fillCommits({ repoId: 1, rootPath: '/r', now });
    expect(n).toBe(1);
    expect(filled).toEqual([{ siteKey: 'c', sha: 'sha3' }]);
  });

  test('예산을 넘으면 남은 파일은 다음 인제스트로 미룬다', async () => {
    let clock = 0;
    const tick = (): number => {
      clock += BLAME_BUDGET_MS;
      return clock;
    };
    await fillCommits({ repoId: 1, rootPath: '/r', now: tick });
    expect(calls.length).toBeLessThan(2);
  });
});
