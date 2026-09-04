/**
 * 규약 카드 (D159 `proto/`). 짚을 노드가 없는 개념이 **근거 낱말**로 자리를 얻는지 본다.
 */
import { describe, expect, test } from 'vitest';

import { loadDict } from '@chickadee/dictionary';
import { PROTO_SITE_ID, makeProtoCard } from './t0-proto.js';
import type { FocusLine } from './types.js';

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
