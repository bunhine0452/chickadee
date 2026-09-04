/**
 * 생성기 **집합 품질 게이트** (D132 · 04 §1~§2).
 *
 * 골든(`packages/cards/src/t0.test.ts`)은 카드 **한 장**을 박제한다. 그 검사는 한 장이
 * 어제와 같은지를 지키지만 「낸 문제 전체가 쓸 만한가」는 아무도 안 본다 — 정답이 늘 2번인
 * 것(D128)도, `result.value` 가 `&quot;0&quot;` 로 새는 것도 사람이 눈으로 먼저 찾았다.
 *
 * 여기서는 시드 리포 × 사전 × 시드 `ATTEMPTS` 번으로 판을 대량으로 굽고 두 길을 따로 잰다.
 *   - **새 판**(`generateT0`) — 유형을 생성기가 고르고 사용처 사슬을 탄다. 사용자가 매일 만나는 길.
 *   - **재출제**(`generateKind`) — 유형을 고정하고 **첫 사용처**에만 건다 (04 §2.3).
 * 임계를 넘으면 실패하고, 통과해도 표를 찍는다 — 사람이 수준을 눈으로 보는 자리가 그 표다.
 */
import { createRequire } from 'node:module';

import { loadDict } from '@chickadee/dictionary';
import { ipc } from '@chickadee/ipc-client';
import type { ConceptId, Layer } from '@chickadee/store-sql';
import { expect, test } from 'vitest';
import type BetterSqlite3 from 'better-sqlite3';

import { buildSeed, statementRunner } from './build-seed.js';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

/** 개념·유형마다 몇 번의 시드로 굽나. 04 §0 의 `attempt` 가 곧 카드 시드다. */
const ATTEMPTS = 20;
/** 2026-09-03 09:00 KST. 시각이 결과를 바꾸지 않도록 굳힌다. */
const NOW = 1_772_755_200_000;
const KINDS = ['point', 'blank', 'meaning'] as const;

/**
 * 새 판 경로에서 허용하는 드롭률 상한. **사용자가 매일 만나는 길이라 이쪽이 정본이다.**
 * 시드(`fixtures/ipc/tiny`)의 실측이 0% 이므로 여유를 조금만 둔다.
 */
const MAX_DROP_AUTO = 0.05;
/**
 * 한 유형이 새 판을 독차지해도 되는 몫 — **목표**다. 넘으면 화면에 사실상 한 유형만 나오고,
 * 04 §1.4 의 「유형 선호」가 선호가 아니라 고정이 된다.
 */
const KIND_SHARE_TARGET = 0.8;
/**
 * 실측(`fixtures/ipc/tiny`) — 의미형 **76.4%**(2026-09-04 두 번째 패스). 하루 전에는 99.5%
 * 였다. 게이트는 이 값을 래칫으로 쓴다: 더 나빠지면 실패하고, 좋아지면 이 상수를 내린다.
 * 목표까지의 거리는 표가 매번 찍는다 — 임계를 오늘 값에 맞춰 두고 목표를 지우면 그 거리가
 * 안 보인다. 지금은 래칫이 목표보다 **더 좁다**. 그것이 래칫의 일이다.
 *
 * 무엇이 99.5 를 76.4 로 내렸나: 사전이다. `ts/const-declaration`·`ts/optional-chaining`·
 * `ts/array-push-mutate`·`ts/nullish-coalescing` 에 `blank:`+`@hole` 이 생겨 그 개념들이
 * 의미형에서 빈칸형으로 넘어갔고, `ts/generics` 의 `.scm` 이 `@pick.3` 을 내면서 지목형이
 * 하나 섰다. 생성기 코드는 한 줄도 안 고쳤다 (D145).
 *
 * 남은 쏠림의 원인도 사전이다: 지목형은 「짚을 후보가 3개에 못 미친다」로, 빈칸형은 「이
 * 사용처에는 구멍(@hole)이 없다」로 떨어진다. 표의 「재출제」 줄이 그 사유다.
 *
 * 그 원인을 개념 단위로 세는 표가 따로 있다 — `pnpm dict:lint` 의 「사전 저작 부채」(D145).
 * `@pick.N` 이 3개 미만인 개념 수와 `blank:`+`@hole` 이 없는 개념 수가 여기 두 유형의
 * 드롭률로 그대로 나온다. **이 상수를 내리는 일은 저쪽 표를 채우는 일이다.**
 */
const KIND_SHARE_RATCHET = 0.765;
/** 정답 위치 네 칸 중 한 칸이 가져가도 되는 몫의 상한. 균등은 .25 다 (D128). */
const MAX_ANSWER_SHARE = 0.45;

/**
 * 합성 판은 **예고 없이 존재할 수 없다** (D137 · 방안 E-4). `site_id IS NULL` 인 카드는
 * 전부 payload 에 `previewSiteId` 를 들고 있어야 한다 — 없으면 「곧 네 코드 어디에서 이걸
 * 보게 된다」의 **어디**가 없고, 그 순간 이 앱은 남의 예제를 내는 일반 튜토리얼이 된다.
 * 타입이 이미 막지만(`makeSyntheticCard` 의 필수 인자) 원장에 남은 것으로도 한 번 더 센다.
 */
const MAX_PREVIEWLESS_SYNTHETIC = 0;

/** 치환값이 HTML 로 이스케이프된 채 **글자로** 새는 자리. 평문으로 그려지는 필드만 본다. */
const ENTITY = /&(?:quot|apos|amp|lt|gt|#39);/;

interface Payload {
  answer?: number;
  options?: { t: string; mono?: boolean }[];
  why?: ({ t: string; edge?: { h: string; code: string[] } } | null)[];
}

interface Pass {
  made: number;
  dropped: number;
  /** 사유 → 횟수. 「사유 없는 불가는 없다」(04 §1.4)가 여기서 표가 된다. */
  reasons: Map<string, number>;
  /** 유형 → 새로 생긴 **고유 판** 수. 새 판 경로에서만 뜻이 있다. */
  byKind: Map<string, number>;
  /** 이 경로가 굽기 직전의 마지막 `card.id`. 이 뒤의 행만 이 경로의 것이다. */
  from: number;
}

const emptyPass = (): Pass => ({ made: 0, dropped: 0, reasons: new Map(), byKind: new Map(), from: 0 });

const bump = (m: Map<string, number>, k: string): void => { m.set(k, (m.get(k) ?? 0) + 1); };

/** 균등에서 가장 멀리 떨어진 칸의 몫. 표본이 없으면 0. */
function maxShare(counts: readonly number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  return total === 0 ? 0 : Math.max(...counts) / total;
}

const pct = (x: number): string => `${(100 * x).toFixed(1).padStart(5)}%`;

/** 사유 상위 셋. 표에 한 줄로 들어간다. */
function topReasons(reasons: Map<string, number>): string {
  return [...reasons.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([why, n]) => `${n}× ${why}`)
    .join(' · ') || '없음';
}

test('생성기 품질 — 드롭률 · 유형 쏠림 · 정답 위치 · 보기 · 엔티티 누출 (D132)', async () => {
  const out = `${process.env['TMPDIR'] ?? '/tmp/'}chickadee-quality.sqlite`;
  await buildSeed(Database, out);
  const db = new Database(out);
  const run = statementRunner(db);

  /** 지금 굽고 있는 경로의 집계. `card.gap_reason` 을 가로채 사유를 여기 쌓는다. */
  let pass = emptyPass();

  // IPC 를 시드 DB 로 돌린다 — `pipeline.test.ts` 와 같은 다리다 (D108).
  const target = ipc as unknown as Record<string, Record<string, unknown>>;
  target['store'] = {
    ...target['store'],
    query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
    exec: (name: string, params: unknown) => {
      if (name === 'card.gap_reason') bump(pass.reasons, String((params as { reason: string }).reason));
      return Promise.resolve(run(name, params)[0]);
    },
    batch: (ops: { name: string; params: unknown }[]) =>
      Promise.resolve(db.transaction(() => ops.map((op) => run(op.name, op.params)))()),
  };
  // 원문 읽기는 없다 — 맥락 줄은 시드가 이미 들고 있다.
  target['file'] = { readLines: () => Promise.reject(new Error('no file')) };

  const { makeCard } = await import('../../apps/desktop/src/data/cards.js');
  const dict = loadDict();
  const concepts = (db.prepare('SELECT DISTINCT concept_id AS c FROM concept_site').all() as { c: string }[])
    .map((r) => r.c);

  const deps = (attempt: number) => ({
    repoId: 1,
    rootPath: '/w/tiny',
    dict,
    dictVersion: `q${attempt}`,
    layerOf: () => 0 as Layer,
    now: NOW,
  });

  const idNow = (): number =>
    ((db.prepare("SELECT COALESCE(MAX(id), 0) AS n FROM card WHERE track = 't0'").get() as { n: number }).n);

  /**
   * 한 경로를 다 굽고 그 집계를 돌려준다. **같은 판은 한 행이다**(`content_hash` 가 유일) —
   * 그래서 「만듦」과 「고유 판」이 다르고, 유형 쏠림은 고유 판으로 세야 뜻이 있다.
   */
  async function bake(kind?: typeof KINDS[number]): Promise<Pass> {
    pass = emptyPass();
    const from = idNow();
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      for (const conceptId of concepts) {
        const made = await makeCard(deps(attempt), conceptId as ConceptId, null, 1, attempt, kind);
        if (made === null) pass.dropped += 1;
        else pass.made += 1;
      }
    }
    const rows = db.prepare("SELECT kind FROM card WHERE track = 't0' AND id > ?")
      .all(from) as { kind: string }[];
    for (const row of rows) bump(pass.byKind, row.kind);
    pass.from = from;
    return pass;
  }

  const auto = await bake();
  const forced = new Map<string, Pass>();
  for (const kind of KINDS) forced.set(kind, await bake(kind));

  // ── 판정: 새 판 경로가 낸 것만 뜯어본다. 사용자가 매일 만나는 판이 그것이다.
  const rows = db.prepare("SELECT kind, payload_json FROM card WHERE track = 't0' AND id > ?")
    .all(auto.from) as { kind: string; payload_json: string }[];
  const answers = [0, 0, 0, 0];
  const dupOptions: string[] = [];
  const entities: string[] = [];
  for (const row of rows) {
    const p = JSON.parse(row.payload_json) as Payload;
    if (typeof p.answer === 'number' && p.answer >= 0 && p.answer < 4) {
      answers[p.answer] = (answers[p.answer] ?? 0) + 1;
    }
    const seen = new Set<string>();
    for (const o of p.options ?? []) {
      if (seen.has(o.t)) dupOptions.push(`${row.kind}: ${o.t}`);
      seen.add(o.t);
      // `mono` 보기는 코드라 텍스트 노드로 그려진다 — 이스케이프가 남으면 글자로 보인다.
      if (o.mono === true && ENTITY.test(o.t)) entities.push(`option ${o.t}`);
    }
    // 「가장 날카로운 자리」의 코드도 `CodePlate` 가 텍스트로 그린다.
    for (const diag of p.why ?? []) {
      for (const line of diag?.edge?.code ?? []) {
        if (ENTITY.test(line)) entities.push(`edge.code ${line}`);
      }
    }
  }

  // ── 표. 통과해도 찍는다 — 사람이 수준을 보는 자리다.
  const tried = concepts.length * ATTEMPTS;
  const unique = [...auto.byKind.values()].reduce((a, b) => a + b, 0);
  const kindShare = (k: string): number => (auto.byKind.get(k) ?? 0) / Math.max(1, unique);
  const worstShare = Math.max(...KINDS.map(kindShare));
  const lines = [
    `개념 ${concepts.length} · 시드 ${ATTEMPTS} · 경로마다 ${tried} 시도`,
    `새 판   만듦 ${auto.made} · 고유 판 ${unique} · 드롭 ${auto.dropped} (${pct(auto.dropped / tried)})`,
    `        유형 ${KINDS.map((k) => `${k} ${auto.byKind.get(k) ?? 0} (${pct(kindShare(k))})`).join(' · ')}`,
    `        최대 유형 ${pct(worstShare)} · 래칫 ${pct(KIND_SHARE_RATCHET)} · 목표 ${pct(KIND_SHARE_TARGET)}`
    + ` — 목표까지 ${pct(Math.max(0, worstShare - KIND_SHARE_TARGET))} 남음`,
    '        원인은 사전이다 — `pnpm dict:lint` 의 「사전 저작 부채」 표와 함께 읽는다 (D145)',
    `        정답 위치 ${answers.join(' ')} — 최대칸 ${pct(maxShare(answers))} (임계 ${pct(MAX_ANSWER_SHARE)})`,
    `        드롭 사유 ${topReasons(auto.reasons)}`,
    '재출제  유형    만듦   드롭   드롭률  사유 상위',
    ...KINDS.map((k) => {
      const p = forced.get(k) as Pass;
      return `        ${k.padEnd(8)}${String(p.made).padStart(5)}${String(p.dropped).padStart(7)}`
        + `  ${pct(p.dropped / tried)}  ${topReasons(p.reasons)}`;
    }),
  ];
  // 합성 판의 예고 (D137). 원장을 직접 센다 — 생성기를 거치지 않고 들어온 행도 잡는다.
  const previewless = (db.prepare(
    "SELECT id, concept_id, payload_json FROM card WHERE track = 't0' AND site_id IS NULL",
  ).all() as { id: number; concept_id: string; payload_json: string }[])
    .filter((row) => {
      const parsed = JSON.parse(row.payload_json) as { previewSiteId?: number };
      return parsed.previewSiteId === undefined;
    })
    .map((row) => `card ${row.id} (${row.concept_id})`);
  lines.push(`합성    site_id 없는 판 중 예고 없는 것 ${previewless.length} (임계 ${MAX_PREVIEWLESS_SYNTHETIC})`);

  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));

  db.close();

  // ── 게이트.
  expect(previewless.length,
    '합성 판(site_id 없음)에 「곧 여기서 봅니다」 예고가 없다 — 방안 E-4 위반 (D137)')
    .toBeLessThanOrEqual(MAX_PREVIEWLESS_SYNTHETIC);
  expect(entities, '치환값이 이스케이프된 채 글자로 샜다 — 평문으로 그리는 자리는 escape 를 끈다').toEqual([]);
  expect(dupOptions, '같은 글자의 보기가 둘이다 — 오답이 오답으로 보이지 않는다').toEqual([]);
  expect(auto.dropped / tried, '새 판을 이만큼 못 만든다').toBeLessThanOrEqual(MAX_DROP_AUTO);
  expect(maxShare(answers), '정답이 한 칸에 쏠렸다 (D128)').toBeLessThanOrEqual(MAX_ANSWER_SHARE);
  for (const kind of KINDS) {
    // 래칫이다 — 목표(KIND_SHARE_TARGET)까지의 거리는 표가 찍고, 여기서는 **오늘보다 나빠지는
    // 것**만 막는다. 사전 질의가 지목형·빈칸형을 더 내면 이 상수를 내린다.
    expect(kindShare(kind), `${kind} 한 유형이 새 판을 독차지한다 — 04 §1.4 의 유형 선호가 고정이 됐다`)
      .toBeLessThanOrEqual(KIND_SHARE_RATCHET);
  }
}, 300_000);
