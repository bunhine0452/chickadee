/**
 * 커밋 판정 (03 §1.2 · §1.3). Rust 는 `parent_count`·`author_*`·`subject`·통계만 저장하고,
 * 「내 커밋인가」와 「어떤 종류인가」는 여기서 정한다 — 정규식과 identity 는 도메인이다 (D21).
 */

export type CommitKind = 'normal' | 'merge' | 'revert' | 'bot' | 'bulk';

/** 사용자가 확인한 내 신원 목록 (`settings.identities`, D46). */
export interface Identity {
  email: string;
  name: string;
}

export interface CommitFacts {
  sha: string;
  parentCount: number;
  authorEmail: string | null;
  authorName: string | null;
  message: string;
  filesN: number;
  insertions: number;
}

/** 스캐폴딩·초기 커밋의 경계 (03 §1.3). 라인 귀속엔 쓰되 T2 정답지에선 뺀다. */
export const BULK_FILES = 200;
export const BULK_INSERTIONS = 5_000;

const BOT_ACTOR = /dependabot|renovate|\[bot\]|github-actions|noreply@github\.com/i;
const BOT_SUBJECT = /^(chore\(release\)|Bump version|Merge (branch|pull request))/;
const REVERT_SUBJECT = /^Revert "/;
/** `NNN+login@users.noreply.github.com` — GitHub 이 숨긴 주소 뒤의 로그인 이름. */
const GITHUB_NOREPLY = /^\d+\+([^@]+)@users\.noreply\.github\.com$/i;

export function classify(commit: CommitFacts): CommitKind {
  if (commit.parentCount > 1) return 'merge';
  const actor = `${commit.authorEmail ?? ''} ${commit.authorName ?? ''}`;
  if (BOT_ACTOR.test(actor) || BOT_SUBJECT.test(commit.message)) return 'bot';
  if (REVERT_SUBJECT.test(commit.message)) return 'revert';
  if (commit.filesN >= BULK_FILES || commit.insertions >= BULK_INSERTIONS) return 'bulk';
  return 'normal';
}

/**
 * 이 커밋을 내가 썼는가. **완전 일치만** 본다 — 「Kim」 이 「Kim Hyunbin」 을 잡으면
 * 남의 커밋이 T2 정답지가 되고, 그 오탐이 부분 일치가 주는 편의보다 비싸다 (03 §1.2).
 *
 * mailmap 은 Rust 가 이미 적용했다. 여기서 보는 것은 (2) 메일 완전 일치 →
 * (3) GitHub noreply 의 로그인 이름 → (4) 정규화한 이름 완전 일치 순이다.
 */
export function isMine(commit: CommitFacts, identities: readonly Identity[]): boolean {
  if (identities.length === 0) return false;
  const email = commit.authorEmail?.toLowerCase() ?? '';
  if (identities.some((i) => i.email.toLowerCase() === email)) return true;

  const login = GITHUB_NOREPLY.exec(email)?.[1]?.toLowerCase();
  if (login !== undefined) {
    const names = identities.flatMap((i) => [i.name, i.email.split('@')[0] ?? '']);
    if (names.some((n) => n.toLowerCase() === login)) return true;
  }
  const name = normalizeName(commit.authorName);
  return name !== '' && identities.some((i) => normalizeName(i.name) === name);
}

/** 공백과 점을 지우고 소문자로 — 「Kim Hyunbin」 과 「kim.hyunbin」 은 같은 사람이다. */
function normalizeName(raw: string | null): string {
  return (raw ?? '').replace(/[\s.]/g, '').toLowerCase();
}

/**
 * T2 정답지 후보인가 (03 §1.3 표). 머지는 diff 가 없고, 봇은 남이 썼고,
 * revert 와 bulk 는 「무엇을 왜 바꿨나」를 묻기에 적합하지 않다.
 */
export function isAnswerKey(kind: CommitKind, mine: boolean): boolean {
  return mine && kind === 'normal';
}

/** 첫 열기 때 보여 줄 identity 후보 — 커밋 author 상위 5명 (03 §1.2). */
export function suggestIdentities(commits: readonly CommitFacts[], top = 5): Identity[] {
  const seen = new Map<string, { identity: Identity; n: number }>();
  for (const commit of commits) {
    const email = commit.authorEmail?.toLowerCase();
    if (email === undefined || email === '') continue;
    const at = seen.get(email);
    if (at) at.n += 1;
    else seen.set(email, { identity: { email, name: commit.authorName ?? '' }, n: 1 });
  }
  return [...seen.values()].sort((a, b) => b.n - a.n).slice(0, top).map((v) => v.identity);
}
