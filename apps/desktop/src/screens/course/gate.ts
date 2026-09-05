/**
 * 어휘 관문 (D171 ③ · `docs/program/course.md` §3.2).
 *
 * 0장은 코스 밖 별도 대지에서 내려와 **챕터마다 앞에 붙는 관문**이 된다. 담기는 것은
 * `essential` 이 아니라 **그 챕터의 파일이 실제로 쓰는데 아직 0겹인 개념**이다.
 *
 * 상한 셋 — 관문 0 은 12판 · 나머지 관문은 6판 · 코스 전체 40판. 마지막 것이 D136·D147 의
 * 「튜토리얼로의 변질」 방벽을 코스 규모로 옮긴 것이고, 이 함수가 그것을 테스트로 못박는 자리다.
 * 순수 함수다 — 어느 개념이 0겹인지는 호출자가 `chapter.reading_layers` 로 읽어 넘긴다.
 */

/** 첫 챕터 앞의 관문. 자바 바닥 8 + 애너테이션·제네릭·import·접근 제어자가 여기 든다. */
export const GATE_FIRST = 12;
/** 둘째 챕터부터. 그 챕터가 새로 여는 어휘만. */
export const GATE_EACH = 6;
/** 코스 전체. 넘치는 어휘는 오늘의 인쇄가 찍는다 — 관문이 아니라 큐의 몫이 된다. */
export const GATE_CAP = 40;

export interface GateInput {
  unitId: number;
  /** 0겹인 개념 id — `chapter.reading_layers` 의 순서 그대로. */
  zero: readonly string[];
}

export interface Gate {
  unitId: number;
  concepts: string[];
  /** 상한에 잘려 이 관문에 못 든 수. 0 이면 다 들어갔다. */
  cut: number;
}

/**
 * 챕터 순서대로 관문을 채운다. 앞 챕터가 상한을 먼저 쓴다 — 코스는 앞에서 뒤로 밟으므로
 * 뒤 챕터의 관문이 잘리는 편이 앞 챕터가 잘리는 것보다 낫다(그때쯤이면 큐가 이미 찍었다).
 */
export function planGates(chapters: readonly GateInput[]): Gate[] {
  let left = GATE_CAP;
  return chapters.map((c, i) => {
    const cap = Math.min(i === 0 ? GATE_FIRST : GATE_EACH, left);
    const concepts = c.zero.slice(0, Math.max(0, cap));
    left -= concepts.length;
    return { unitId: c.unitId, concepts, cut: c.zero.length - concepts.length };
  });
}
