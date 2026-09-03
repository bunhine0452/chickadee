/**
 * T2 책임 배치의 정답지 — 커밋 하나에서 core / sec / trap 을 뽑는다 (04 §8.1).
 *
 * 순수 함수다. 커밋·파일·엣지를 전부 인자로 받고 IPC·SQL·난수를 부르지 않는다 (04 §9).
 * `Date` 는 인자로 받은 밀리초를 UTC 로 옮길 때만 쓴다 — 지금 시각을 읽지 않으므로
 * 같은 입력이면 같은 문자열이다.
 *
 * **문장은 사실만 담는다.** 목업 `data.js` 의 core 설명(「＋ / − 버튼 두 개와 숫자 하나」)은
 * 사람이 코드를 읽고 쓴 것이라 템플릿이 낼 수 없다. 여기서 낼 수 있는 사실은 넷뿐이다 —
 * 새 파일인가 · 몇 줄이 바뀌었나 · 어느 층인가 · 무엇이 가져다 쓰나.
 */
import { isTestPath } from '@chickadee/concepts';

import { BAND_NAMES, BANDS } from './t2-types.js';
import type { AnswerKey, CommitFileRow, CommitRow } from './t2-types.js';
import { baseName } from './vars.js';

/** 04 §8.1 「소스 파일 변경 3~12개」. */
export const MIN_SOURCE_FILES = 3;
export const MAX_SOURCE_FILES = 12;
/** 04 §8.1 「접두 제거 후 메시지 ≥ 8자」. */
export const MIN_SUBJECT_CHARS = 8;
/** 04 §8.1 core 「additions+deletions ≥ 5」. */
export const CORE_CHANGED_LINES = 5;
/** 04 §8.1 sec ② 「core 파일 ≥ 2개와 함께」·「비율 ≥ 0.5」. */
export const CO_CHANGE_CORE = 2;
export const CO_CHANGE_RATIO = 0.5;

/** 04 §7.2 밴드 이름. 목업 `T2.bands` 의 `l` 그대로다 — 설명 문장이 층을 부를 때 쓴다. */

// ───────── 제외 패턴 (04 §8.1 「테스트·스냅샷·락파일·생성물 제외」) ─────────

/**
 * 정답지에서 뺄 경로. 테스트 판정은 `concepts/ingest-defaults.ts` 의 `isTestPath` 가 이미
 * 하므로(`__tests__/`·`test/`·`tests/`·`spec/`·`*.test.*`·`*.spec.*`) 여기엔 그것이 못 잡는
 * 것만 둔다.
 */
const EXCLUDE_PATTERNS: readonly RegExp[] = [
  /(^|\/)__snapshots__\//,
  /\.snap$/,
  /(^|\/)(dist|build|out|coverage)\//,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|Cargo\.lock|poetry\.lock|uv\.lock|go\.sum|pubspec\.lock)$/,
  /\.min\.[A-Za-z]+$/,
  /\.generated\.[A-Za-z]+$/,
];

export function isExcludedPath(path: string): boolean {
  return isTestPath(path) || EXCLUDE_PATTERNS.some((re) => re.test(path));
}

// ───────── 커밋 메시지 ─────────

const SKIP_TYPE = /^(chore|style|docs|ci|build)(\([^)]*\))?!?:/i;
const SKIP_VERB = /^(merge|revert)\b/i;
const PREFER_TYPE = /^(feat|fix)(\([^)]*\))?!?:/i;
const PREFIX = /^[A-Za-z][A-Za-z0-9]*(\([^)]*\))?!?:\s*/;

/** 접두(`feat(cart):`)를 뗀 제목. 접두가 없으면 메시지 그대로다. */
export function subjectOf(message: string): string {
  return message.replace(PREFIX, '').trim();
}

/** 04 §8.1 질문 템플릿. */
export function question(subject: string): string {
  return `«${subject}» 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?`;
}

// ───────── 소스 파일 ─────────

/**
 * 그 커밋의 「소스 파일 변경분」 F.
 *
 * `fileId === null` 인 행은 인제스트가 읽지 않은 파일이라 지도에 노드가 없다 — 정답지에
 * 넣으면 고를 수 없는 답이 된다(`t2-types.ts` 의 주석 그대로). `additions+deletions === 0`
 * 은 공백만 바뀐 행이다(통계가 이미 공백을 무시한다).
 */
function sourceFiles(files: readonly CommitFileRow[]): CommitFileRow[] {
  return files.filter(
    (f) => f.fileId !== null && f.additions + f.deletions > 0 && !isExcludedPath(f.path),
  );
}

/**
 * 04 §8.1 의 후보 필터를 통과한 커밋만.
 *
 * 순서는 **`feat|fix` 가 앞, 그 안에서 최근 순**이다. §8.1 의 「(`feat|fix` 우선)」은 거르는
 * 조건이 아니라 고르는 순서이고, 순서 말고는 그 우선을 담을 자리가 없다.
 */
export function candidates(input: {
  commits: readonly CommitRow[];
  filesOf: ReadonlyMap<number, readonly CommitFileRow[]>;
  /** 대지에 든 파일 경로 — 「유닛 폴더에 닿음」 판정. */
  unitPaths: readonly string[];
}): CommitRow[] {
  const unit = new Set(input.unitPaths);
  const kept = input.commits.filter((c) => {
    if (SKIP_TYPE.test(c.message) || SKIP_VERB.test(c.message)) return false;
    if (subjectOf(c.message).length < MIN_SUBJECT_CHARS) return false;
    const src = sourceFiles(input.filesOf.get(c.id) ?? []);
    if (src.length < MIN_SOURCE_FILES || src.length > MAX_SOURCE_FILES) return false;
    return src.some((f) => unit.has(f.path));
  });
  const rank = (c: CommitRow): number => (PREFER_TYPE.test(c.message) ? 0 : 1);
  return kept.sort((a, b) => rank(a) - rank(b) || b.authoredAt - a.authoredAt || b.id - a.id);
}

// ───────── core / sec / trap ─────────

/** 04 §7.2 의 진입점(`page.*`·`main.*`·`index.*`)을 대지 안에서 찾은 것. */
const ENTRY_NAME = /^(page|main|index)\.[A-Za-z]+$/;

function isUnitEntry(path: string, unitRoot: string, unitPaths: ReadonlySet<string>): boolean {
  const inUnit = unitPaths.has(path) || (unitRoot !== '' && path.startsWith(`${unitRoot}/`));
  return inUnit && ENTRY_NAME.test(baseName(path));
}

const IMPORT_RULES: Record<string, { comment: readonly string[]; lines: readonly RegExp[] }> = {
  ts: {
    comment: ['//', '/*', '*'],
    lines: [/^import[\s{'"(]/, /^export\s[^;]*\sfrom\s/, /require\(/],
  },
  py: { comment: ['#'], lines: [/^(import|from)\s/] },
  // go 의 import 는 괄호 블록이라 `import (` · `"fmt"` · `)` 세 모양이 한 덩어리다.
  go: { comment: ['//', '/*', '*'], lines: [/^import\b/, /^[()]$/, /^([\w.]+\s+|_\s+)?"[^"]+"$/] },
  rs: { comment: ['//', '/*', '*'], lines: [/^(pub\s+)?use\s/] },
};

const LANG_BY_EXT: Record<string, string> = {
  ts: 'ts', tsx: 'ts', js: 'ts', jsx: 'ts', mjs: 'ts', cjs: 'ts',
  py: 'py', go: 'go', rs: 'rs',
};

/**
 * 「추가 줄이 전부 import 문」인가 (04 §8.1). `added` 가 없으면(머지·잘린 커밋) 거짓 —
 * 없다고 core 가 되지도, sec 가 되지도 않는다.
 *
 * 뜻이 있는 줄이 하나도 없으면(지우기만 한 커밋) 거짓으로 둔다. 빈 집합을 「전부 import」로
 * 세면 20줄을 지운 파일이 sec 로 내려간다.
 */
function importOnly(file: CommitFileRow): boolean {
  if (file.added === undefined) return false;
  const ext = file.path.slice(file.path.lastIndexOf('.') + 1);
  const rules = IMPORT_RULES[LANG_BY_EXT[ext] ?? ''];
  if (rules === undefined) return false;

  const body = file.added
    .map((line) => line.trim())
    .filter((line) => line !== '' && !rules.comment.some((c) => line.startsWith(c)));
  if (body.length === 0) return false;
  return body.every((line) => rules.lines.some((re) => re.test(line)));
}

/**
 * sec ② — 최근 커밋에서 core 파일 ≥ 2개와 함께 바뀐 비율 ≥ 0.5 인 파일.
 *
 * 분모는 **그 파일이 바뀐 커밋 수**다. 최근 50 커밋 전체를 분모로 잡으면 0.5 를 넘는 파일이
 * 사실상 없어 규칙이 죽는다. 지도 밖 파일은 고를 수 없으므로 `mapPaths` 안으로 좁힌다.
 */
function coChanged(input: {
  core: ReadonlySet<string>;
  changed: ReadonlySet<string>;
  inMap: ReadonlySet<string>;
  recent: ReadonlyMap<number, readonly string[]>;
}): string[] {
  const total = new Map<string, number>();
  const withCore = new Map<string, number>();

  for (const paths of input.recent.values()) {
    const hits = new Set(paths.filter((p) => input.core.has(p))).size;
    for (const path of new Set(paths)) {
      if (input.core.has(path) || input.changed.has(path)) continue;
      if (!input.inMap.has(path) || isExcludedPath(path)) continue;
      total.set(path, (total.get(path) ?? 0) + 1);
      if (hits >= CO_CHANGE_CORE) withCore.set(path, (withCore.get(path) ?? 0) + 1);
    }
  }

  const out: string[] = [];
  for (const [path, n] of total) {
    if ((withCore.get(path) ?? 0) / n >= CO_CHANGE_RATIO) out.push(path);
  }
  return out.sort();
}

// ───────── 문장 ─────────

const stat = (f: CommitFileRow): string => `+${f.additions} −${f.deletions}`;

function changeClause(file: CommitFileRow): string {
  if (file.status === 'A') return '새로 만든 파일입니다.';
  if (file.status === 'D') return '지워진 파일입니다.';
  if (file.status === 'R') return '이름이 바뀌면서 함께 고쳐졌습니다.';
  const n = file.additions + file.deletions;
  return n >= CORE_CHANGED_LINES ? `${n}줄이 바뀌었습니다.` : '몇 줄만 고쳐졌습니다.';
}

/** 이 커밋이 바꾼 다른 파일과의 관계 한 문장. 없으면 층 이름, 그것도 없으면 빈 문자열. */
function relationClause(
  path: string,
  changed: ReadonlySet<string>,
  edges: readonly { from: string; to: string }[],
  bandOf?: (path: string) => number,
): string {
  const users = edges.filter((e) => e.to === path && changed.has(e.from)).map((e) => e.from).sort();
  const first = users[0];
  if (first !== undefined) return `«${baseName(first)}» 가 이 파일을 가져다 씁니다.`;

  const used = edges.filter((e) => e.from === path && changed.has(e.to)).map((e) => e.to).sort();
  const second = used[0];
  if (second !== undefined) return `«${baseName(second)}» 를 가져다 씁니다.`;

  if (bandOf === undefined) return '';
  const band = BAND_NAMES[Math.min(Math.max(bandOf(path), 0), BANDS - 1)];
  return band === undefined ? '' : `${band} 층입니다.`;
}

/** 이름으로 「상태를 들고 있는 파일」을 좁힌다 — `use*.ts` · `*Store.*` · `*State.*`. */
const STATE_FILE = /(^|\/)(use[A-Z][^/]*|[^/]*(Store|State))\.[A-Za-z]+$/;

/**
 * trap 사유 (04 §8.1, 앞의 것이 이긴다). 넷이 다 나온다 — trap 집합을 넓혔기 때문이다(D101).
 *
 * ①은 **아래로 이어지는 쪽**을 본다. core 를 직접 놓는 파일만이 아니라 다른 trap 을 거쳐
 * core 에 닿는 파일도 「놓기만 한다」가 맞는 말이다 — 목업의 `page.tsx` 가 `CartSheet` 를
 * 놓는다고 적힌 것이 그 경우다(`CartSheet` 자신도 trap 이다).
 */
export function trapReason(input: {
  path: string;
  core: ReadonlySet<string>;
  edges: readonly { from: string; to: string }[];
  newFiles: readonly string[];
}): string {
  const { path, core, edges } = input;
  const self = baseName(path);

  // ① 이 파일이 놓기만 하는 것 — core 를 직접 가리키면 그것이, 아니면 아래로 이어지는
  // 아무 파일이나(그 파일이 또 trap 이어도 문장은 참이다).
  const down = edges.filter((e) => e.from === path).map((e) => e.to).sort();
  const child = down.find((p) => core.has(p)) ?? down[0];
  if (child !== undefined) {
    return `«${self}» 는 «${baseName(child)}» 를 놓기만 합니다. 안쪽이 바뀌어도 «${self}» 는 모릅니다`;
  }

  const user = edges.filter((e) => e.to === path && core.has(e.from)).map((e) => e.from).sort()[0];
  if (user !== undefined) return `공용 부품. «${baseName(user)}» 가 가져다 쓸 뿐입니다`;

  if (STATE_FILE.test(path)) {
    const dir = path.slice(0, path.lastIndexOf('/') + 1);
    const sibling = input.newFiles.filter((p) => p.startsWith(dir) && !p.slice(dir.length).includes('/'));
    const taker = (sibling.length > 0 ? sibling : [...input.newFiles].sort())[0];
    if (taker !== undefined) {
      return `«${self}» 에 상태가 있지만 이번엔 새 파일 «${baseName(taker)}» 이 그 일을 맡았습니다`;
    }
  }
  return '이번 커밋에서는 바뀌지 않은 파일입니다';
}

/** 힌트 3단 (목업 `T2.hints`). 밴드 수를 못 세면 1단을 층 수 없이 낮춘다. */
function hintsOf(input: { coreN: number; secN: number; newN: number; bandN: number | null }): string[] {
  const spread = input.bandN === null
    ? '이 기능은 여러 층에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.'
    : `이 기능은 ${BANDS}개 층 중 <b>${input.bandN}개 층</b>에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.`;
  const made = input.newN === 0
    ? '이번 커밋에서 새로 만들어진 파일은 없습니다. 있던 파일만 고쳤어요.'
    : `<b>새로 만들어진 파일이 ${input.newN}개</b> 있습니다. 지도에 「새 판」 표시가 있어요.`;
  const count = `꼭 고쳐야 하는 파일은 <b>${input.coreN}개</b>입니다.`;
  return [spread, made, input.secN === 0 ? count : `${count} (＋ 보너스 ${input.secN}개)`];
}

/** 커밋 출처 블록 (목업 `T2.commit`). 날짜는 UTC 로 굳힌다 — 시간대가 바뀌어도 같은 카드다. */
function commitOf(commit: CommitRow): AnswerKey['commit'] {
  const at = commit.authoredAt;
  return {
    h: commit.sha.slice(0, 7),
    d: Number.isFinite(at) ? new Date(at).toISOString().slice(0, 10) : '',
    m: commit.message,
    // 목업은 `7 files changed, +181 −23` 이지만 사용자에게 보이는 문구는 한국어다 (D61).
    // 숫자와 부호는 목업 그대로 두고 낱말만 옮긴다 — 시각은 안 바뀐다.
    n: `파일 ${commit.filesN}개 · +${commit.insertions} −${commit.deletions}`,
  };
}

// ───────── 정답지 ─────────

export interface KeyInput {
  commit: CommitRow;
  files: readonly CommitFileRow[];
  /** 지도 안 노드 경로 전부 — trap 은 이 안에서만 나온다. */
  mapPaths: readonly string[];
  /** 지도 엣지 — trap 사유 템플릿이 관계를 본다. 방향은 「가져다 쓴다」. */
  edges: readonly { from: string; to: string }[];
  /** 대지 뿌리와 파일 — 「유닛 진입점」 판정. */
  unitRoot: string;
  unitPaths: readonly string[];
  /** 공변경 이력 (sec ②). 커밋 id → 바뀐 경로들. */
  recent: ReadonlyMap<number, readonly string[]>;
  /** 밴드를 아는 호출자만 넘긴다. 없으면 힌트 1단이 층 수를 말하지 않는다. */
  bandOf?: (path: string) => number;
}

/** 04 §8.1 의 core / sec / trap 도출. */
export function buildKey(input: KeyInput): AnswerKey {
  const files = sourceFiles(input.files);
  const byPath = new Map(files.map((f) => [f.path, f]));
  const changed = new Set(byPath.keys());
  const unit = new Set(input.unitPaths);
  const inMap = new Set(input.mapPaths);

  // core — 새 파일 · 5줄 이상 · 유닛 진입점.
  const core = new Set(
    files
      .filter((f) => f.status === 'A' || f.additions + f.deletions >= CORE_CHANGED_LINES
        || isUnitEntry(f.path, input.unitRoot, unit))
      .map((f) => f.path),
  );
  // 추가 줄이 전부 import 문이면 core 에서 빼서 sec 로 내린다.
  for (const path of [...core]) {
    const file = byPath.get(path);
    if (file !== undefined && importOnly(file)) core.delete(path);
  }

  const sec = new Set([...changed].filter((p) => !core.has(p)));
  for (const path of coChanged({ core, changed, inMap, recent: input.recent })) sec.add(path);

  // trap — 지도 안 ∖ (core ∪ sec) 전부다. 04 §8.1 의 「core 의 1-hop 이웃」 단서는 뺐다 (D101).
  const trapPaths = [...inMap].filter((p) => !core.has(p) && !sec.has(p)).sort();

  const newFiles = files.filter((f) => f.status === 'A').map((f) => f.path).sort();
  const bands = input.bandOf;
  const bandN = bands === undefined ? null : new Set([...core].map((p) => bands(p))).size;

  const describe = (path: string): [string, string] => {
    const file = byPath.get(path);
    const relation = relationClause(path, changed, input.edges, input.bandOf);
    if (file === undefined) {
      return ['—', '이번 커밋에서는 안 바뀌었지만, 최근 커밋에서 이 파일들과 함께 자주 바뀌었습니다.'];
    }
    const change = changeClause(file);
    return [stat(file), relation === '' ? change : `${change} ${relation}`];
  };

  // 키 순서는 경로 사전순으로 굳힌다 — `contentHash` 가 JSON 직렬화를 해싱한다.
  const record = (paths: string[]): Record<string, [string, string]> =>
    Object.fromEntries(paths.sort().map((p) => [p, describe(p)]));

  return {
    commit: commitOf(input.commit),
    subject: subjectOf(input.commit.message),
    core: record([...core]),
    sec: record([...sec]),
    trap: Object.fromEntries(
      trapPaths.map((p) => [p, trapReason({ path: p, core, edges: input.edges, newFiles })]),
    ),
    hints: hintsOf({ coreN: core.size, secN: sec.size, newN: newFiles.length, bandN }),
    newFiles,
  };
}
