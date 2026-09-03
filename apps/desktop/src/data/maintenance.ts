/**
 * 유지 보수 — 내보내기 · 전부 지우기 · 재인제스트 판별 (06 §6.3 · §6.4).
 *
 * 조회는 카탈로그 statement 로만 한다. 파일 쓰기는 `app_write_json` 하나뿐이고 경로를
 * 인자로 받지 않는다 (D109) — 「어디에 저장할까요」 대화상자 대신 `<app_data>/exports/`
 * 에 쓰고 그 폴더를 연다.
 */
import { GEN_VERSION } from '@chickadee/cards';
import { SUPPORTED_SCHEMA, type Dict } from '@chickadee/dictionary';
import { ipc, log } from '@chickadee/ipc-client';
import { dayKey } from '@chickadee/scheduler';
import type { Settings } from '@chickadee/store-sql';
import { fnv1a64 } from '@chickadee/text';

import { LLM_ACCOUNT } from './accounts.js';
import { forgetKeyStore } from './llmKey.js';
import { loadSettings } from './settings.js';

export { LLM_ACCOUNT };

// ───────── 재인제스트 판별 (06 §6.3) ─────────

/** 06 §6.3 의 네 값. **리포 동일성 해시(`repo.fingerprint`)와는 다른 것**이다. */
export interface IngestBuild {
  /** `{grammar: version}` 을 직렬화한 것. Rust 가 `ingest_run` 에 넣는 문자열 그대로. */
  grammarVersionsJson: string;
  /** 문법 쿼리(.scm) 묶음의 해시. */
  queryHash: string;
  /** 카드 생성기 버전 (`card.gen_version`). */
  genVersion: number;
  /** 사전 스키마 번호 (06 §6.2 `SUPPORTED_DICT_SCHEMA`). */
  dictSchema: number;
}

/**
 * 지문의 값 구분자. 이어 붙이기만 하면 `("ab","c")` 와 `("a","bc")` 가 같은 값이 되므로
 * 네 값 어디에도 나올 수 없는 바이트를 끼운다 — JSON 문자열·해시·정수 어디에도 NUL 은 없다.
 */
const SEP = '\u0000';

/** `sha256(grammar_versions_json ‖ query_hash ‖ gen_version ‖ dict_schema)` (06 §6.3). */
export async function ingestFingerprint(build: IngestBuild): Promise<string> {
  const joined = [
    build.grammarVersionsJson, build.queryHash, String(build.genVersion), String(build.dictSchema),
  ].join(SEP);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(joined));
  return [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

/**
 * 지금 빌드의 네 값. 인제스트 직후 `stampRun` 이 이것을 `ingest_run` 에 적고, 홈은 다음
 * 실행 때 그것과 이것을 견준다 (06 §6.3).
 *
 * **문법 판본은 파서에게 묻는다**(`parse_langs`) — 사전이 아는 것은 어떤 문법을 요구하는지
 * 뿐이고, 실제로 어떤 판본이 파일을 팠는지는 Rust 만 안다. 문법이 올라가면 캡처가 달라지고
 * 그것이 재인제스트가 필요한 첫째 이유다.
 */
export async function currentBuild(dict: Dict): Promise<IngestBuild> {
  const langs = await ipc.parse.langs();
  const grammarVersions = Object.fromEntries(
    [...langs].sort((a, b) => a.grammar.localeCompare(b.grammar))
      .map((l) => [l.grammar, `${l.grammarVersion}/${l.abi}`]),
  );
  // 쿼리는 원문 전체를 해시한다 — 한 글자만 달라져도 캡처가 달라질 수 있다. 키를 정렬해
  // 맵의 순회 순서에 기대지 않는다.
  const queryHash = fnv1a64(
    [...dict.queries.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([k, scm]) => `${k}\u0000${scm}`).join('\u0000'),
  );
  return {
    grammarVersionsJson: JSON.stringify(grammarVersions),
    queryHash,
    genVersion: GEN_VERSION,
    dictSchema: SUPPORTED_SCHEMA[0],
  };
}

/** 사전 판본 표시값 — `<lang>@<version>` 을 정렬해 이은 것 (06 §6.2). */
function dictVersionOf(dict: Dict): string {
  return [...dict.langs.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([lang, meta]) => `${lang}@${meta.version}`).join(' ');
}

/**
 * 인제스트가 끝난 뒤 그 실행에 다섯 값과 지문을 적는다 (06 §6.3).
 *
 * 여기가 앱 층인 이유: 지문은 사전(`dictionary`)과 **카드 생성기**(`cards`) 판본을 함께
 * 요구하는데, 파생 층(`concepts`)은 `cards` 를 import 할 수 없다(01 §2 의 의존 방향이
 * `cards → concepts` 다). 두 패키지를 다 아는 가장 낮은 층이 앱이다.
 */
export async function stampRun(repoId: number, dict: Dict, sitesN: number): Promise<string> {
  const build = await currentBuild(dict);
  const fingerprint = await ingestFingerprint(build);
  await ipc.store.exec('facts.run_stamp', {
    repoId,
    sitesN,
    grammarVersionsJson: build.grammarVersionsJson,
    queryHash: build.queryHash,
    dictVersion: dictVersionOf(dict),
    dictSchema: build.dictSchema,
    genVersion: build.genVersion,
    fingerprint,
  });
  return fingerprint;
}

/**
 * 홈에 「재인제스트 필요」 배너를 낼지 (06 §6.3).
 *
 * 지문이 없는 마지막 인제스트(실패했거나, 지문을 적기 전 판으로 읽은 DB)는 **비교할 것이
 * 없으므로 배너를 내지 않는다** — 모르는 것을 「바뀌었다」로 말하면 배너가 상시 켜진다.
 * 숙련도는 개념 단위라 재인제스트해도 보존된다(06 §6.3) — 배너는 경고가 아니라 안내다.
 */
export function needsReingest(stored: string | null | undefined, current: string): boolean {
  if (stored === null || stored === undefined || stored === '') return false;
  return stored !== current;
}

// ───────── 내보내기 (06 §6.4) ─────────

/** 기본 제외인 두 덩이. 체크박스가 켜진 것만 파일에 담긴다 (06 §6.4). */
export interface ExportOptions {
  /** 카드에 찍히는 내 코드 발췌. */
  cardExcerpts: boolean;
  /** T1 필사 초안(내가 친 글). */
  t1Drafts: boolean;
}

export const EXPORT_DEFAULTS: ExportOptions = { cardExcerpts: false, t1Drafts: false };

export interface ExportedConcept {
  conceptId: string;
  layer: number;
  state: number;
  stability: number | null;
  difficulty: number | null;
  dueAt: number | null;
  lastReviewAt: number | null;
  reps: number;
  lapses: number;
  dunnoTotal: number;
}

export interface ExportedSession {
  sessionId: number;
  dayKey: string;
  plates: number;
  ok: number;
  dunno: number;
  durationMs: number;
}

export interface ExportBundle {
  kind: 'chickadee-export';
  /** DB 의 `PRAGMA user_version` (06 §6.1). 되읽는 쪽이 판을 먼저 본다. */
  schemaVersion: number;
  appVersion: string;
  exportedAt: number;
  included: ExportOptions;
  settings: Settings;
  /** **경로는 담지 않는다** — 절대 경로는 산출 파일에 나가지 않는다 (01 §6). */
  repos: { id: number; name: string; addedAt: number; lastIngestAt: number | null }[];
  concepts: ExportedConcept[];
  sessions: ExportedSession[];
  /** 하루에 인쇄한 분. `stats.days` 그대로. */
  days: { repoId: number; dayKey: string; mins: number }[];
  cardExcerpts?: { conceptId: string; excerpt: string }[];
  t1Drafts?: { sessionId: number; pos: number; conceptId: string; draft: string }[];
}

/** `buildExport` 가 받는 것 = statement 가 돌려준 행 그대로(열 이름은 snake_case 다, D57). */
export interface ExportInput {
  schemaVersion: number;
  appVersion: string;
  exportedAt: number;
  settings: Settings;
  repos: readonly { id: number; name: string; added_at: number; last_ingest_at: number | null }[];
  mastery: readonly {
    concept_id: string; state: number; stability: number | null; difficulty: number | null;
    due_at: number | null; last_review_at: number | null; reps: number; lapses: number;
    layer: number; dunno_total: number;
  }[];
  logs: readonly {
    session_id: number; day_key: string; ok: number; dunno: number; duration_ms: number;
  }[];
  days: readonly { repoId: number; day_key: string; mins: number }[];
  cardExcerpts: readonly { conceptId: string; excerpt: string }[];
  t1Drafts: readonly { sessionId: number; pos: number; conceptId: string; draft: string }[];
}

/**
 * 파일에 담길 모양을 만든다 — **순수 함수**다. IPC 는 `exportRecords` 가 한다.
 *
 * 세션 요약은 원장(`review_log`)을 세션별로 합산해 만든다. `detail_json` 은 손대지 않는다 —
 * T1 의 「왜」 문장과 필사 결과가 그 안에 있고 그것은 체크박스가 켜져야 나가는 것이다.
 */
export function buildExport(input: ExportInput, opts: ExportOptions): ExportBundle {
  const sessions = new Map<number, ExportedSession>();
  for (const row of input.logs) {
    const at = sessions.get(row.session_id) ?? {
      sessionId: row.session_id, dayKey: row.day_key, plates: 0, ok: 0, dunno: 0, durationMs: 0,
    };
    at.plates += 1;
    at.ok += row.ok;
    at.dunno += row.dunno;
    at.durationMs += row.duration_ms;
    sessions.set(row.session_id, at);
  }

  return {
    kind: 'chickadee-export',
    schemaVersion: input.schemaVersion,
    appVersion: input.appVersion,
    exportedAt: input.exportedAt,
    included: { cardExcerpts: opts.cardExcerpts, t1Drafts: opts.t1Drafts },
    settings: input.settings,
    repos: input.repos.map((r) => ({
      id: r.id, name: r.name, addedAt: r.added_at, lastIngestAt: r.last_ingest_at,
    })),
    concepts: input.mastery.map((m) => ({
      conceptId: m.concept_id,
      layer: m.layer,
      state: m.state,
      stability: m.stability,
      difficulty: m.difficulty,
      dueAt: m.due_at,
      lastReviewAt: m.last_review_at,
      reps: m.reps,
      lapses: m.lapses,
      dunnoTotal: m.dunno_total,
    })),
    sessions: [...sessions.values()].sort((a, b) => a.sessionId - b.sessionId),
    days: input.days.map((d) => ({ repoId: d.repoId, dayKey: d.day_key, mins: d.mins })),
    ...(opts.cardExcerpts ? { cardExcerpts: [...input.cardExcerpts] } : {}),
    ...(opts.t1Drafts ? { t1Drafts: [...input.t1Drafts] } : {}),
  };
}

/**
 * `chickadee-export-<YYYY-MM-DD>.json` (06 §6.4).
 *
 * 여기의 날짜는 **달력 날짜**다 — 하루 경계(D12 의 04:00)를 적용하지 않는다. 파일 이름은
 * 학습 하루가 아니라 사람이 파일 목록에서 찾는 날짜여야 한다. `app_write_json` 이 이름을
 * `[A-Za-z0-9._-]` 로 좁히므로 이 모양을 벗어나면 거부된다 (D109).
 */
export function exportFileName(now: number, tz: string): string {
  return `chickadee-export-${dayKey(now, tz, 0)}.json`;
}

/** 지난 기록 전부를 담기 위한 하한. `stats.days` 는 `day_key >= :fromDay` 로 자른다. */
const FROM_EVER = '0000-00-00';
/** 사용처 발췌를 몇 줄까지 담을지. 체크박스를 켰을 때만 쓴다. */
const EXCERPT_LIMIT = 2000;

async function gatherOptional(
  opts: ExportOptions,
  repoIds: readonly number[],
  sessionIds: readonly number[],
): Promise<{ cardExcerpts: ExportInput['cardExcerpts']; t1Drafts: ExportInput['t1Drafts'] }> {
  const cardExcerpts: { conceptId: string; excerpt: string }[] = [];
  const t1Drafts: { sessionId: number; pos: number; conceptId: string; draft: string }[] = [];

  if (opts.cardExcerpts) {
    for (const repoId of repoIds) {
      const rows = await ipc.store.query('queue.retake_pending', { repoId, limit: EXCERPT_LIMIT });
      for (const r of rows) {
        if (r.excerpt !== null) cardExcerpts.push({ conceptId: r.concept_id, excerpt: r.excerpt });
      }
    }
  }

  if (opts.t1Drafts) {
    for (const sessionId of sessionIds) {
      const rows = await ipc.store.query('session.items', { sessionId });
      for (const r of rows) {
        if (r.state_json === null) continue;
        const draft = (JSON.parse(r.state_json) as { t1Draft?: string }).t1Draft;
        if (draft !== undefined && draft !== '') {
          t1Drafts.push({ sessionId, pos: r.pos, conceptId: r.concept_id, draft });
        }
      }
    }
  }

  return { cardExcerpts, t1Drafts };
}

/**
 * 「내 기록 내보내기」 (06 §6.4). 만든 파일의 **디렉터리**를 돌려준다 — 화면은 그것을
 * 문장에 넣고 `app_reveal` 로 폴더를 연다.
 */
export async function exportRecords(
  opts: ExportOptions,
  now = Date.now(),
): Promise<{ dir: string; name: string }> {
  const [settings, info, version, repos, mastery, logs] = await Promise.all([
    loadSettings(),
    ipc.store.info(),
    ipc.app.version(),
    ipc.store.query('repo.list', {}),
    ipc.store.query('review.mastery_all', {}),
    ipc.store.query('review.all_logs', {}),
  ]);

  const days: { repoId: number; day_key: string; mins: number }[] = [];
  for (const repo of repos) {
    const rows = await ipc.store.query('stats.days', { repoId: repo.id, fromDay: FROM_EVER });
    for (const row of rows) days.push({ repoId: repo.id, day_key: row.day_key, mins: row.mins });
  }

  const sessionIds = [...new Set(logs.map((l) => l.session_id))].sort((a, b) => a - b);
  const optional = await gatherOptional(opts, repos.map((r) => r.id), sessionIds);

  const bundle = buildExport(
    {
      schemaVersion: info.userVersion,
      appVersion: version.app,
      exportedAt: now,
      settings,
      repos,
      mastery,
      logs,
      days,
      ...optional,
    },
    opts,
  );

  const name = exportFileName(now, settings.tz);
  const dir = await ipc.app.writeJson('exports', name, JSON.stringify(bundle, null, 2));
  log.info('기록을 내보냈다', {
    concepts: bundle.concepts.length,
    sessions: bundle.sessions.length,
    cardExcerpts: opts.cardExcerpts,
    t1Drafts: opts.t1Drafts,
  });
  return { dir, name };
}

// ───────── 전부 지우기 (06 §6.4 · E8) ─────────

/**
 * DB · 백업 · 캐시 · 로그 · 크래시 · 설정 · **키체인 항목** 순으로 지운다 (06 §6.4).
 *
 * 앞의 여섯은 `app_wipe` 가 파일로 지운다(설정은 DB 안에 있으므로 DB 와 함께 사라진다).
 * 키체인은 계정 이름을 아는 쪽이 화면이라 여기서 따로 지운다. 지운 뒤 앱을 닫는 것은
 * 부르는 쪽의 몫이다 — 반쯤 지워진 DB 위에서 계속 돌지 않기 위해서다.
 */
export async function wipeAll(): Promise<void> {
  await ipc.app.wipe();
  await ipc.secret.delete(LLM_ACCOUNT);
  // 「키 저장소가 고장 났다」는 판단은 파일이 아니라 메모리에 있다 — 지우고 나면 그 기억도
  // 버려야 다음 시도가 옛 상태를 보이지 않는다.
  forgetKeyStore();
  log.warn('전부 지우기를 마쳤다');
}
