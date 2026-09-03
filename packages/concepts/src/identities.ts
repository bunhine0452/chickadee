/**
 * 내 커밋 가르기 (03 §1.2 · D46). `settings.identities` 가 진실이고 이 파일이 그것을
 * 원장에 반영한다.
 *
 * 인제스트 안에서 한 번(`runIngest`), 설정에서 identity 를 고칠 때 또 한 번 돈다.
 * **두 번째 자리가 있어야 하는 이유**: identity 를 바꿨다고 리포를 다시 읽게 하면 수천 파일을
 * 다시 파싱하는데, 실제로 바뀌는 것은 `git_commit` 두 열뿐이다.
 */
import { ipc } from '@chickadee/ipc-client';

import { inBatches } from './batch.js';
import { classify, isMine, suggestIdentities, type CommitFacts, type Identity } from './commits.js';

function factsOf(row: {
  sha: string; parent_count: number; author_email: string | null; author_name: string | null;
  message: string; files_n: number; insertions: number;
}): CommitFacts {
  return {
    sha: row.sha,
    parentCount: row.parent_count,
    authorEmail: row.author_email,
    authorName: row.author_name,
    message: row.message,
    filesN: row.files_n,
    insertions: row.insertions,
  };
}

/**
 * 이 리포의 커밋 전부를 다시 가른다. 돌려주는 값은 **몇 건 중 몇 건이 내 것이 되었나**다 —
 * 설정 화면이 그 자리에서 그것을 말한다.
 *
 * `identities` 가 비면 `isMine` 이 언제나 거짓이라 전부 0 이 된다. 그것이 기본 상태이고,
 * T2 정답지(`isAnswerKey`)가 「내 것 + normal」을 요구하므로 **비어 있으면 정답지가 0장**이다.
 */
export interface ClassifyCount { mine: number; all: number }

export async function reclassifyCommits(
  repoId: number, identities: readonly Identity[],
): Promise<ClassifyCount> {
  const rows = await ipc.store.query('derive.commits', { repoId });
  let mine = 0;
  const ops = rows.map((row) => {
    const facts = factsOf(row);
    const authorMatched = isMine(facts, identities);
    if (authorMatched) mine += 1;
    return {
      name: 'derive.commit_classify' as const,
      params: { repoId, sha: row.sha, kind: classify(facts), authorMatched },
    };
  });
  await inBatches(ops);
  return { mine, all: rows.length };
}

/**
 * 이 리포의 커밋 author 상위 `top` 명 (03 §1.2).
 *
 * **`git config user.email` 은 읽지 않는다** — 그 값은 Rust 명령이 있어야 닿는데 줄 예산이
 * 0 이다(D68 · D121). 대신 커밋에 실제로 남은 author 를 빈도순으로 낸다. 리포에 커밋이
 * 없으면 빈 목록이고, 화면은 손으로 넣는 길을 남겨 둔다.
 */
export async function suggestIdentitiesFor(repoId: number, top = 5): Promise<Identity[]> {
  const rows = await ipc.store.query('derive.commits', { repoId });
  return suggestIdentities(rows.map(factsOf), top);
}
