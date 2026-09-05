/**
 * 규약 카드 (D159 `proto/`). 짚을 노드가 없는 개념이 **근거 낱말**로 자리를 얻는지 본다.
 */
import { describe, expect, test } from 'vitest';

import { loadDict } from '@chickadee/dictionary';
import type { ConceptSite } from '@chickadee/store-sql';
import { genMeaning } from './t0-meaning.js';
import { PROTO_SITE_ID, makeProtoCard } from './t0-proto.js';
import type { FocusLine, SiteInput } from './types.js';

const dict = loadDict();
const lines = (...t: string[]): FocusLine[] => t.map((s, i) => ({ n: i + 10, t: s }));
const WINDOW = { from: 10, to: 20 };

const req = (id: string, ls: FocusLine[]) => ({
  repoId: 1, dictVersion: 'x', attempt: 0, ly: 0,
  concept: dict.concepts.get(id)!, concepts: dict.concepts,
  lines: ls, path: 'BACK/src/main/java/JwtUtil.java', window: WINDOW, blockHash: 'deadbeef',
});

describe('근거 낱말로 자리를 얻는다', () => {
  test('블록에 근거가 보이면 그 줄이 자리가 된다', () => {
    const out = makeProtoCard(req('proto/jwt', lines(
      'public String createToken(Long userId) {',
      '  return Jwts.builder().signWith(key).compact();',
    )));
    if ('reason' in out) throw new Error(`판이 안 나왔다: ${out.reason}`);
    expect(out.card.siteId).toBe(PROTO_SITE_ID);
    expect(out.card.kind).toBe('meaning');
    expect(out.card.payload.track).toBe('t0');
    // 자리는 근거가 **처음 보인** 줄이다.
    expect(out.card.payload.focus).toBe(11);
  });

  test('근거가 없으면 이 블록은 이 개념의 자리가 아니다', () => {
    const out = makeProtoCard(req('proto/jwt', lines('int n = 1;', 'return n;')));
    expect('reason' in out).toBe(true);
  });

  test('상태 코드도 같은 길로 선다', () => {
    const out = makeProtoCard(req('proto/status-code', lines(
      'if (user == null) {',
      '  return ResponseEntity.status(HttpStatus.NOT_FOUND).build();',
    )));
    if ('reason' in out) throw new Error(`판이 안 나왔다: ${out.reason}`);
    expect(out.card.payload.focus).toBe(11);
  });

  test('사용처 id 셋이 안 겹친다 — 합성 −1 · 추적 −2 · 규약 −3', () => {
    expect(PROTO_SITE_ID).toBe(-3);
  });
});

/**
 * 기계 카드 (D157 `cs/` · D167). 규약과 다른 점은 **자리를 얻는 방법**뿐이다 —
 * 규약은 근거 낱말을 보고, 기계는 자기를 `prereq` 로 가리키는 언어 개념의 창을 빌린다.
 * 빌리는 코드는 아직 없다(`bestSiteOf` 의 역방향 조회가 다음 판이다). 여기서 못박는 것은
 * **빌린 창을 손에 쥐면 43장이 전부 평소 생성기로 구워진다**는 것이다.
 */
describe('빌린 창으로 기계 카드가 구워진다 (D157)', () => {
  /** 언어 개념이 찾아 준 창. `t0-proto` 의 합성 사용처와 같은 모양이다. */
  const borrowed = (conceptId: string, ls: FocusLine[]): SiteInput => ({
    site: {
      id: PROTO_SITE_ID, repoId: 1, fileId: 0,
      conceptId: conceptId as ConceptSite['conceptId'], siteKey: 'borrowed',
      lineStart: ls[0]?.n ?? 1, lineEnd: ls[0]?.n ?? 1, colStart: 0, colEnd: 0,
      tsNodeKind: null, form: null, shape: 'proto', occurrence: 0,
      excerpt: (ls[0]?.t ?? '').trim(),
      picks: {}, hole: null, ctx: {}, lineConcepts: [], uncoveredRatio: 0,
      confidence: 'syntactic', parseQuality: 'ok', isDirty: false, isOversize: false,
      commitId: null, unknownCount: 0, isAlive: true, updatedAt: 0,
    },
    path: 'src/cart.ts',
    lines: ls,
    block: WINDOW,
  });

  const csIds = [...dict.concepts.keys()].filter((id) => id.startsWith('cs/')).sort();

  test('사전에 기계 개념 43장이 들어 있다', () => {
    expect(csIds.length).toBeGreaterThanOrEqual(43);
  });

  test('43장 전부가 뜻 고르기 판으로 나온다 — 드롭이 하나도 없다', () => {
    const ls = lines('const total = items.reduce((n, it) => n + it.price, 0);', 'return total;');
    const dropped: string[] = [];
    for (const id of csIds) {
      const input = borrowed(id, ls);
      const out = genMeaning({
        repoId: 1, dictVersion: 'x', attempt: 0, ly: 0,
        concept: dict.concepts.get(id)!, concepts: dict.concepts, sites: [input],
      }, input);
      if ('reason' in out) { dropped.push(`${id}(${out.reason})`); continue; }
      expect(out.card.kind, id).toBe('meaning');
      expect(out.card.payload.track, id).toBe('t0');
      expect(out.card.siteId, id).toBe(PROTO_SITE_ID);
      // 보기 넷 중 정답 하나, 나머지 셋에 진단이 붙는다.
      expect(out.card.payload.options?.length, id).toBe(4);
      expect(out.card.payload.why?.filter((w) => w !== null).length, id).toBe(3);
    }
    expect(dropped).toEqual([]);
  });

  test('빌린 창이 판에 그대로 실린다 — 기계에도 볼 코드가 있다 (D157 ③)', () => {
    const ls = lines('let sum = 0;', 'for (const n of nums) sum += n;');
    const input = borrowed('cs/complexity', ls);
    const out = genMeaning({
      repoId: 1, dictVersion: 'x', attempt: 0, ly: 0,
      concept: dict.concepts.get('cs/complexity')!, concepts: dict.concepts, sites: [input],
    }, input);
    if ('reason' in out) throw new Error(`판이 안 나왔다: ${out.reason}`);
    expect(out.card.payload.file).toBe('src/cart.ts');
    const text = out.card.payload.lines.map((l) => (
      't' in l ? l.t : l.seg.map((g) => ('t' in g ? g.t : '')).join('')
    ));
    expect(text).toContain('for (const n of nums) sum += n;');
  });
});
