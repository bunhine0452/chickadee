/**
 * M3 「끝났다는 증거」 첫 줄 — **`projectox-like` 의 12~40줄 블록이 3단계 페이딩으로 나온다**.
 *
 * 후보는 Rust 가 실제로 뱉은 것이다(`fixtures/ipc/projectox/blocks.json` —
 * `pipeline.rs` 의 `projectox_block_dump_is_stable` 가 굽는다). 그 덤프에는 **코드가 없다**:
 * 줄 범위와 그 범위에 걸린 개념뿐이고, 원문은 픽스처 리포에서 읽는다. 리포에 코드 두 벌을
 * 두면 하나가 조용히 낡는다.
 *
 * 여기서만 확인되는 것: 블록 순위(04 §3.1) → 대표 개념(D27) → 2단계 유지 집합(04 §3.2) →
 * 왜 게이트 문항(04 §6) → `CardPayload` 가 02 §8.2 의 zod 를 통과한다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateT1, isT1Card, type BlockCandidate } from '@chickadee/cards';
import { loadDict } from '@chickadee/dictionary';
import { cardPayloadSchema } from '@chickadee/store-sql';
import { describe, expect, test } from 'vitest';

import { essentialOf } from './blocks.js';

const REPO = join(process.cwd(), 'fixtures/repos/projectox-like');
const DUMP = join(process.cwd(), 'fixtures/ipc/projectox/blocks.json');

interface DumpRow {
  path: string;
  name: string | null;
  lineStart: number;
  lineEnd: number;
  concepts: { conceptId: string; siteCount: number }[];
}

const dump: DumpRow[] = existsSync(DUMP)
  ? (JSON.parse(readFileSync(DUMP, 'utf8')) as DumpRow[])
  : [];

/**
 * 「이미 배운 개념」 집합. 덤프 전체에서 가장 자주 나오는 25개를 2겹으로 둔다.
 *
 * 왜 이것이 필요한가: 04 §3.1 의 순위 ②는 「ly 0 개념 ≤ 3개」다. 갓 등록한 리포는 모든
 * 개념이 0겹이라 **어떤 블록도 후보가 되지 않는다** — 그것이 규칙의 뜻이고(못 읽는 코드를
 * 필사시키면 타자 연습이 된다) 실제로도 T1 슬롯은 T0 를 며칠 돌린 뒤에 열린다. 이 테스트는
 * 그 「며칠 뒤」를 흉내 낸다: T0 큐가 미지 최소 순으로 고르므로 가장 흔한 개념이 먼저 배워진다.
 */
const KNOWN_TOP = 25;

function knownConcepts(rows: readonly DumpRow[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const c of row.concepts) counts.set(c.conceptId, (counts.get(c.conceptId) ?? 0) + c.siteCount);
  }
  return new Set(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, KNOWN_TOP)
      .map(([id]) => id),
  );
}

const known = knownConcepts(dump);

/** 덤프 한 행 + 픽스처 리포의 원문 → 생성기의 후보. */
function toCandidate(row: DumpRow, index: number): BlockCandidate {
  const text = readFileSync(join(REPO, row.path), 'utf8').split('\n');
  return {
    blockId: index + 1,
    fileId: index + 1,
    path: row.path,
    rev: null,
    name: row.name,
    kind: 'function',
    lineStart: row.lineStart,
    lineEnd: row.lineEnd,
    textHash: `h${index}`,
    // 최근 커밋 시각은 순위 ③ 이 보는 값이다. 덤프에 없으므로 없는 것으로 둔다.
    lastCommitAt: null,
    concepts: row.concepts.map((c, i) => ({
      conceptId: c.conceptId,
      layer: known.has(c.conceptId) ? 2 : 0,
      siteCount: c.siteCount,
      siteId: index * 100 + i + 1,
    })),
    lines: text.slice(row.lineStart - 1, row.lineEnd),
  };
}

const dict = loadDict();

const generate = (stage: 1 | 2 | 3, candidates: readonly BlockCandidate[]) =>
  generateT1({
    repoId: 1,
    dictVersion: 'ts@1.0.0',
    concepts: dict.concepts,
    essential: essentialOf(dict),
    grammar: 'tsx',
    candidates,
    stage,
  });

describe('projectox-like 의 T1 후보 (04 §3 · M3 증거)', () => {
  test('덤프가 있다 — 없으면 `cargo test -p chickadee-app --test pipeline projectox` 를 먼저 돌린다', () => {
    expect(dump.length, 'fixtures/ipc/projectox/blocks.json 이 비었다').toBeGreaterThan(10);
  });

  test('갓 등록한 리포에서는 판이 안 나온다 — 모르는 문법이 3개를 넘는다 (04 §3.1 순위 ②)', () => {
    const fresh = dump.map(toCandidate).map((c) => ({
      ...c,
      concepts: c.concepts.map((k) => ({ ...k, layer: 0 })),
    }));
    const result = generate(2, fresh);
    expect(isT1Card(result)).toBe(false);
    expect((result as { reason: string }).reason).toContain('모르는 문법');
  });

  test('후보는 전부 12~40줄이고 원문이 실제로 읽힌다', () => {
    const candidates = dump.slice(0, 40).map(toCandidate);
    for (const c of candidates) {
      const span = c.lineEnd - c.lineStart + 1;
      expect(span, `${c.path}:${c.lineStart}`).toBeGreaterThanOrEqual(12);
      expect(span).toBeLessThanOrEqual(40);
      expect(c.lines).toHaveLength(span);
      expect(c.lines.join('').trim()).not.toBe('');
    }
  });

  test('3단계가 다 나오고 페이딩이 단계마다 다르다 (04 §3.2)', () => {
    const candidates = dump.map(toCandidate);
    const made = ([1, 2, 3] as const).map((stage) => generate(stage, candidates));

    for (const [i, result] of made.entries()) {
      expect(isT1Card(result), `${i + 1}단계에서 판이 안 나왔다`).toBe(true);
    }
    const cards = made.filter(isT1Card);

    // 2단계 유지 집합은 **원본보다 짧다** — 그래야 지울 줄이 있다.
    for (const card of cards) {
      expect(card.payload.show2.length).toBeGreaterThan(0);
      expect(card.payload.show2.length).toBeLessThan(card.payload.original.length);
      // 주석·시그니처·닫힘만 남으므로 첫 줄이나 마지막 줄 중 하나는 반드시 유지된다.
      const last = card.payload.original.length - 1;
      expect(card.payload.show2.includes(0) || card.payload.show2.includes(last)).toBe(true);
      // 색인은 오름차순이고 범위 안이다 — 화면이 그대로 훑는다.
      expect([...card.payload.show2].sort((a, b) => a - b)).toStrictEqual(card.payload.show2);
      expect(Math.max(...card.payload.show2)).toBeLessThan(card.payload.original.length);
    }

    // 1단계는 첫 노출이라 ≤ 25줄만 후보다 (04 §3.1) — 그래서 고른 블록이 다를 수 있다.
    const first = cards[0] as (typeof cards)[number];
    expect(first.payload.original.length).toBeLessThanOrEqual(25);

    // 3단계는 스펙 카드만 보인다 — 시그니처와 지켜야 할 것이 비면 백지에서 쓸 근거가 없다.
    const third = cards[2] as (typeof cards)[number];
    expect(third.spec.signature.length).toBeGreaterThan(0);
    expect(third.spec.mustHold.length).toBeGreaterThan(0);
  });

  test('대표 개념은 사전에 있고 부수 개념과 겹치지 않는다 (D27)', () => {
    const result = generate(2, dump.map(toCandidate));
    expect(isT1Card(result)).toBe(true);
    const card = result as Extract<typeof result, { conceptId: string }>;
    expect(dict.concepts.has(card.conceptId)).toBe(true);
    expect(card.secondary).not.toContain(card.conceptId);
    for (const id of card.secondary) expect(dict.concepts.has(id)).toBe(true);
  });

  test('페이로드가 02 §8.2 의 zod 를 통과한다 — 원장에 그대로 들어간다', () => {
    const result = generate(2, dump.map(toCandidate));
    const card = result as Extract<typeof result, { payload: unknown }>;
    const parsed = cardPayloadSchema.safeParse(card.payload);
    expect(parsed.success, JSON.stringify(parsed.error?.issues?.slice(0, 3))).toBe(true);
    expect(card.payload.track).toBe('t1');
    expect(card.payload.blockId).toBeGreaterThan(0);
    expect(card.payload.why.choices.length === 0 || card.payload.why.choices.length === 3).toBe(true);
  });

  test('같은 입력에 같은 카드다 (04 §9 결정성)', () => {
    const candidates = dump.map(toCandidate);
    expect(generate(2, candidates)).toStrictEqual(generate(2, candidates));
  });
});
