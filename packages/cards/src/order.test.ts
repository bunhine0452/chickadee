/**
 * `order` 생성 (D187 ⑱). 재는 것 — 조각의 **사실**이 재료에서 계산되나 · 덱이 결정론인가 ·
 * 0부 사다리로도 판이 서나.
 */
import { describe, expect, test } from 'vitest';

import type { Hop } from '@chickadee/concepts';

import { buildLadderOrders, hopPieces, shuffleDeck, ORDER_MIN } from './order.js';

const hop = (path: string, line: number | null, kind: Hop['kind']): Hop => ({ path, line, kind });

const LOGIN: Hop[] = [
  hop('FRONT/src/services/authService.js', 21, 'http'),
  hop('BACK/AuthController.java', 56, 'static'),
  hop('BACK/AuthService.java', 78, 'static'),
  hop('BACK/UserMapper.xml', null, null),
];

describe('조각의 사실은 재료에서 나온다', () => {
  test('칸 i 의 줄이 칸 i+1 을 부른다 — 그것이 곧 「왜 먼저인가」다', () => {
    const pieces = hopPieces(LOGIN);
    expect(pieces).toHaveLength(4);
    expect(pieces[0]?.id).toBe('FRONT/src/services/authService.js:21');
    expect(pieces[0]?.t).toBe('authService.js:21');
    expect(pieces[0]?.fact).toContain('AuthController.java');
    // 간선 종류가 낱말로 실린다 — 프런트→백은 HTTP 다.
    expect(pieces[0]?.fact).not.toBe(pieces[1]?.fact);
    // 마지막 칸은 부르는 곳이 없다.
    expect(pieces[3]?.fact).toContain('끝');
  });

  test('줄을 모르는 칸은 경로만으로 식별된다', () => {
    expect(hopPieces(LOGIN)[3]?.id).toBe('BACK/UserMapper.xml');
  });
});

describe('덱 — 결정론이고 정답과 같은 순서로는 안 낸다', () => {
  const answer = ['a', 'b', 'c', 'd', 'e'];

  test('같은 시드면 같은 덱이다', () => {
    expect(shuffleDeck(answer, 12_345)).toEqual(shuffleDeck(answer, 12_345));
  });

  test('덱은 정답의 순열이다 — 빠지거나 는 조각이 없다', () => {
    const deck = shuffleDeck(answer, 7);
    expect([...deck].sort()).toEqual([...answer].sort());
  });

  test('정답과 같은 순서가 나오면 양 끝을 바꾼다', () => {
    // 두 장짜리는 섞어도 절반이 제자리다 — 그 자리를 이 규칙이 잡는다.
    const two = shuffleDeck(['a', 'b'], 1);
    expect(two).not.toEqual(['a', 'b']);
  });
});

describe('0부 사다리로도 판이 선다', () => {
  test('걸음이 세 칸 이상인 식만 판이 된다', () => {
    const cards = buildLadderOrders('java');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.kind).toBe('order');
      expect(card.stage).toBe(5);
      expect(card.pieces.length).toBeGreaterThanOrEqual(ORDER_MIN);
      expect(card.answer).toEqual(card.pieces.map((p) => p.id));
      expect([...card.deck].sort()).toEqual([...card.answer].sort());
      // 사실은 그때의 타입이다 — 사람이 적은 해설이 아니다.
      for (const piece of card.pieces) expect(piece.fact.length).toBeGreaterThan(0);
    }
  });

  test('언어마다 걸음이 다르다 — 파이썬의 사다리는 자바의 것이 아니다', () => {
    const java = buildLadderOrders('java').map((c) => c.pieces.map((p) => p.t).join('|'));
    const py = buildLadderOrders('py').map((c) => c.pieces.map((p) => p.t).join('|'));
    expect(java).not.toEqual(py);
  });

  test('순수 함수다 — 두 번 부르면 같은 것이 나온다', () => {
    expect(buildLadderOrders('rs')).toEqual(buildLadderOrders('rs'));
  });
});
