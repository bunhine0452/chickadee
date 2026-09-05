/**
 * 「이 판의 글자가 어디서 왔나」 계수 (D143).
 *
 * 세는 규칙이 곧 화면에 뜨는 숫자라 여기서 못 박는다. **감점하지 않는 값**이지만,
 * 감점하지 않는다고 틀려도 되는 것은 아니다 — 이 숫자가 「85 가 무슨 뜻인가」에 답한다.
 */
import { describe, expect, it } from 'vitest';

import { addAssist, countChange, emptyAssist, handPct, makeAssistTally } from './assist';

const ctx = (over: Partial<{ composing: boolean; pasted: boolean; flush: boolean }> = {}) =>
  ({ composing: false, pasted: false, flush: false, ...over });

describe('countChange — 변경 하나의 분류', () => {
  it('한 글자를 치면 손이 하나다', () => {
    expect(countChange({ rangeLength: 0, text: 'a' }, ctx()))
      .toEqual({ keyed: 1, assisted: 0, pasted: 0, accepted: 0 });
  });

  it('자동 닫기 `()` 는 손이 하나 + 보조가 하나다', () => {
    expect(countChange({ rangeLength: 0, text: '()' }, ctx()))
      .toEqual({ keyed: 1, assisted: 1, pasted: 0, accepted: 0 });
  });

  it('Enter + 자동 들여쓰기는 손이 하나 + 공백만큼 보조다', () => {
    expect(countChange({ rangeLength: 0, text: '\n    ' }, ctx()))
      .toEqual({ keyed: 1, assisted: 4, pasted: 0, accepted: 0 });
  });

  it('제안 수락은 친 만큼이 손이고 나머지가 보조다', () => {
    // `to` 를 치고 `total` 을 골랐다 — 2글자를 5글자로 늘린 변경 하나.
    expect(countChange({ rangeLength: 2, text: 'total' }, ctx()))
      .toEqual({ keyed: 2, assisted: 3, pasted: 0, accepted: 1 });
  });

  it('붙여넣기는 전부 붙여넣기다 — 「보았다」와 「베꼈다」는 다른 말이다', () => {
    expect(countChange({ rangeLength: 0, text: 'const a = 1\nconst b = 2' }, ctx({ pasted: true })))
      .toEqual({ keyed: 0, assisted: 0, pasted: 23, accepted: 0 });
  });

  it('한글 조합은 전부 손이다 — 조합 글자를 보조로 세면 한국어 주석이 통째로 보조가 된다', () => {
    expect(countChange({ rangeLength: 1, text: '한' }, ctx({ composing: true })))
      .toEqual({ keyed: 1, assisted: 0, pasted: 0, accepted: 0 });
    expect(countChange({ rangeLength: 0, text: '하' }, ctx({ composing: true })))
      .toEqual({ keyed: 1, assisted: 0, pasted: 0, accepted: 0 });
  });

  it('지우기와 초안 복원은 세지 않는다', () => {
    expect(countChange({ rangeLength: 5, text: '' }, ctx())).toEqual(emptyAssist());
    expect(countChange({ rangeLength: 0, text: 'aaa' }, ctx({ flush: true }))).toEqual(emptyAssist());
  });

  it('고른 곳을 짧게 덮어쓰면 전부 손이다 — 늘어난 것이 없으면 보조도 없다', () => {
    expect(countChange({ rangeLength: 5, text: 'a' }, ctx()))
      .toEqual({ keyed: 1, assisted: 0, pasted: 0, accepted: 0 });
  });
});

describe('handPct', () => {
  it('앉힌 글자가 없으면 100 — 「아직 안 썼다」를 「0 % 가 손이다」로 읽히게 두지 않는다', () => {
    expect(handPct(emptyAssist())).toBe(100);
  });

  it('붙여넣기도 분모에 든다', () => {
    expect(handPct({ keyed: 50, assisted: 25, pasted: 25, accepted: 0 })).toBe(50);
    expect(handPct({ keyed: 88, assisted: 12, pasted: 0, accepted: 3 })).toBe(88);
  });
});

describe('makeAssistTally — 흐름', () => {
  it('알려진 타건 각본을 그대로 센다', () => {
    const tally = makeAssistTally();
    // `f`, `(`→자동으로 `()`, `)` 위를 지나쳐 치기(길이 1), Enter+들여쓰기 2칸
    tally.onChanges([{ rangeLength: 0, text: 'f' }], false);
    tally.onChanges([{ rangeLength: 0, text: '()' }], false);
    tally.onChanges([{ rangeLength: 0, text: '\n  ' }], false);
    expect(tally.value).toEqual({ keyed: 3, assisted: 3, pasted: 0, accepted: 0 });
    expect(handPct(tally.value)).toBe(50);
  });

  it('붙여넣기 표시는 바로 다음 변경 한 번에만 걸린다', () => {
    const tally = makeAssistTally();
    tally.armPaste();
    tally.onChanges([{ rangeLength: 0, text: 'abcd' }], false);
    tally.onChanges([{ rangeLength: 0, text: 'e' }], false);
    expect(tally.value).toEqual({ keyed: 1, assisted: 0, pasted: 4, accepted: 0 });
  });

  it('조합 구간을 열고 닫는다', () => {
    const tally = makeAssistTally();
    tally.setComposing(true);
    tally.onChanges([{ rangeLength: 0, text: '하' }], false);
    tally.onChanges([{ rangeLength: 1, text: '한' }], false);
    tally.setComposing(false);
    tally.onChanges([{ rangeLength: 0, text: '()' }], false);
    expect(tally.value).toEqual({ keyed: 3, assisted: 1, pasted: 0, accepted: 0 });
  });

  it('이어 세운다 — 판을 떠났다 돌아와도 그때까지 센 것이 남는다', () => {
    const tally = makeAssistTally({ keyed: 10, assisted: 2, pasted: 0, accepted: 1 });
    tally.onChanges([{ rangeLength: 0, text: 'x' }], false);
    expect(tally.value).toEqual({ keyed: 11, assisted: 2, pasted: 0, accepted: 1 });
  });

  it('addAssist 는 네 칸을 각각 더한다', () => {
    expect(addAssist(
      { keyed: 1, assisted: 2, pasted: 3, accepted: 4 },
      { keyed: 10, assisted: 20, pasted: 30, accepted: 40 },
    )).toEqual({ keyed: 11, assisted: 22, pasted: 33, accepted: 44 });
  });
});
