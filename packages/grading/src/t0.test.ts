import { describe, expect, it } from 'vitest';

import { gradeT0, pickDiag, type T0Card } from './t0.js';

/** 목업 `design/src/ink/data.js` 의 `CARDS` 모양을 최소로 줄인 픽스처. */
function t0Card(over: Partial<T0Card> = {}): T0Card {
  return {
    track: 't0',
    kind: 'blank',
    file: 'src/features/cart/useCart.ts',
    focus: 41,
    lines: [{ n: 41, seg: [{ t: '    prev.' }, { hole: true }, { t: '((i) => i)' }], target: true }],
    q: '빈칸에 들어갈 것을 고르세요.',
    hint: '고르는 즉시 코드에 써집니다.',
    options: [
      { t: 'map', mono: true },
      { t: 'forEach', mono: true },
      { t: 'filter', mono: true },
      { t: 'push', mono: true },
    ],
    answer: 0,
    why: [
      null,
      { t: '<code>forEach</code> 는 아무것도 돌려주지 않습니다.' },
      { t: '<code>filter</code> 는 조건을 통과한 것만 남깁니다.' },
      { t: '<code>push</code> 는 원래 배열을 직접 바꿉니다.' },
    ],
    ok: '<code>map</code> 은 돌려준 값으로 새 배열을 만듭니다.',
    rule: '새 배열이 필요하면 <b>map</b>, 골라내려면 <b>filter</b>.',
    prereq: [],
    uses: [],
    promptLines: [],
    ...over,
  } as T0Card;
}

describe('gradeT0 — 판정 (04 §2.1)', () => {
  it('correct 는 sel === answer 하나로 정해진다', () => {
    const card = t0Card();
    expect(gradeT0(card, 0).correct).toBe(true);
    expect(gradeT0(card, 1).correct).toBe(false);
  });

  it('정답이면 진단은 없고 ok · rule · result 가 실린다', () => {
    const card = t0Card({ result: { label: 'setQty 뒤', value: '[a, b]', note: '길이 그대로' } });
    const v = gradeT0(card, 0);
    expect(v.diag).toBeNull();
    expect(v.ok).toBe(card.ok);
    expect(v.rule).toBe(card.rule);
    expect(v.result).toEqual({ label: 'setQty 뒤', value: '[a, b]', note: '길이 그대로' });
  });

  it('result 가 없는 카드는 result 키 자체가 없다', () => {
    expect('result' in gradeT0(t0Card(), 0)).toBe(false);
  });
});

describe('진단 선택 — kind 3종과 폴백 (04 §2.1 표)', () => {
  it('blank — 고른 보기의 진단 하나만 (edge 포함)', () => {
    const card = t0Card({
      why: [
        null,
        { t: 'forEach 진단', edge: { h: '돌려주는 게 있나', code: ['[1].forEach(f) // undefined'] } },
        { t: 'filter 진단' },
        { t: 'push 진단' },
      ],
    });
    expect(pickDiag(card, 1)).toEqual({
      t: 'forEach 진단',
      edge: { h: '돌려주는 게 있나', code: ['[1].forEach(f) // undefined'] },
    });
    expect(pickDiag(card, 2)?.t).toBe('filter 진단');
  });

  it('point — 짚은 pick 의 진단. 정답 자리는 null', () => {
    const card = t0Card({
      kind: 'point',
      answer: 1,
      why: [{ t: 'res.user 진단' }, null, { t: '?? 진단' }, { t: "'손님' 진단" }],
    });
    expect(pickDiag(card, 0)?.t).toBe('res.user 진단');
    expect(pickDiag(card, 1)).toBeNull();
    expect(pickDiag(card, 2)?.t).toBe('?? 진단');
  });

  it('meaning — 보기 배열과 같은 자리의 진단', () => {
    const card = t0Card({ kind: 'meaning', why: [null, { t: '첫 렌더 값 진단' }, { t: 'item 진단' }, { t: 'undefined 진단' }] });
    expect(pickDiag(card, 3)?.t).toBe('undefined 진단');
  });

  it('폴백 — 오답인데 진단이 없으면 rule 을 그대로 쓴다', () => {
    const card = t0Card({ kind: 'point', answer: 1, why: [null, null, null, null] });
    expect(pickDiag(card, 0)).toEqual({ t: card.rule });
    // 보기 배열보다 큰 인덱스(굽다 만 판)에도 그물이 있다
    expect(pickDiag(card, 9)).toEqual({ t: card.rule });
  });
});

describe('아래층 판의 「이어보기」 (04 §2.1)', () => {
  const child = t0Card({ bridge: '선행 개념이 가진 이어보기' });
  const parent = t0Card({ bridge: '부모 개념이 가진 이어보기' });

  it('부모 payload 를 넘기면 부모의 bridge 를 덧붙인다', () => {
    expect(gradeT0(child, 0, parent).bridge).toBe('부모 개념이 가진 이어보기');
  });

  it('부모에 bridge 가 없으면 이 판의 것을 쓴다 (목업 t0.js · 04 §2.4)', () => {
    expect(gradeT0(child, 0, t0Card()).bridge).toBe('선행 개념이 가진 이어보기');
  });

  it('아래층 판이 아니면 bridge 키가 없다', () => {
    expect('bridge' in gradeT0(child, 0)).toBe(false);
  });
});
