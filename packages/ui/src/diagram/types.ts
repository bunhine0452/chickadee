/**
 * 그림의 데이터 계약 — `design/system/diagrams.md` 가 근거다.
 *
 * **여기 있는 그림은 장식이 아니라 본문이다.** 정본 §6 은 장식을 0 으로 만들었지만
 * 같은 절이 「코드와 다이어그램이 가장 큰 요소」라고 적었다. 아래 모델이 나르는 것은
 * 학습 내용 자체이고, 값에서 결정론으로 나온다 — 손으로 그린 SVG 를 두지 않는다.
 *
 * 문항 형식(`bits`·`step`)이 이 모양을 그대로 실어 나른다.
 */

/**
 * 두 상태. **그림은 답을 흘리지 않는다** — 학습자가 값을 적기 전에 정답 비트가 보이면
 * 문제가 죽는다. `predict` 는 뜻을 나르는 뼈대(폭·이름·구조)만 남기고 **값**을 가린다.
 */
export type DiagramPhase = 'predict' | 'reveal';

/* ═══════════════ 비트 배열 ═══════════════ */

/** 폭과 해석이 붙은 수 타입. 언어 이름이 아니라 **기계 표현**이다. */
export type NumType =
  | 'i8' | 'i16' | 'i32' | 'i64'
  | 'u8' | 'u16' | 'u32' | 'u64'
  | 'f32' | 'f64';

/** 비트 묶음이 무엇인가. 색이 아니라 **줄과 이름**이 이것을 가른다(정본 §6). */
export type BitsFieldKind = 'sign' | 'exponent' | 'mantissa' | 'magnitude';

export interface BitsField {
  kind: BitsFieldKind;
  /** 화면에 보이는 이름. 한국어가 정본. */
  label: string;
  /** 최상위 비트를 0 으로 하는 시작 인덱스(포함). */
  from: number;
  /** 끝 인덱스(미포함). */
  to: number;
  /** 이 묶음이 뜻하는 것 한 줄 — 「편향 1023 을 빼면 -4」. */
  note?: string | undefined;
}

export interface BitsModel {
  type: NumType;
  /** 비트 수. `bits.length` 와 같다. */
  width: number;
  /** `'0'`·`'1'` 만. `bits[0]` 이 최상위 비트다. */
  bits: string;
  /** 겹치지 않고 순서대로 폭 전체를 덮는다. */
  fields: readonly BitsField[];
  /** 소스에 적힌 값 그대로 — `'0.1'`. */
  literal: string;
  /** 실제로 저장된 값의 **정확한** 십진 전개. 반올림하지 않는다. */
  stored: string;
  /** 적은 값과 저장된 값이 다른가. `0.1` 이 참, `0.5` 가 거짓 — 이 한 칸이 수업이다. */
  lossy: boolean;
  /** 폭에 안 들어가 잘렸나(정수 오버플로). */
  wrapped: boolean;
}

/* ═══════════════ 평가 트리 ═══════════════ */

/**
 * 식 한 그루. 우선순위는 **트리 모양**이 이미 담고 있고, 접히는 순서는
 * 후위 순회로 결정론이다 — 같은 트리는 언제나 같은 단계 수를 낸다.
 */
export type EvalNode =
  | { kind: 'leaf'; text: string; note?: string | undefined }
  | {
      kind: 'op';
      /** 화면에 찍히는 연산자 — `'*'`·`'+'`·`'&&'`. */
      op: string;
      /** 이 마디를 접었을 때 남는 값. 문자열이라 타입에 매이지 않는다. */
      result: string;
      kids: readonly EvalNode[];
      /** 접히는 이유 한 줄 — 「곱셈이 덧셈보다 먼저」. */
      note?: string | undefined;
    };

export interface EvalTreeModel {
  /** 원래 적힌 식. 캡션과 표 대체가 그대로 쓴다. */
  expr: string;
  root: EvalNode;
}

/**
 * 평평한 걸음 하나. **문항 형식 `step` 의 payload 가 이 모양이다**
 * (`docs/program/fundamentals.md` — `fold: FoldStep[]`). 산문이 없다.
 *
 * `7 / 2` → `int / int`, `3` → `int`.
 */
export interface FoldStep {
  /** 그 걸음의 식. */
  code: string;
  /** 그 걸음의 타입. */
  type: string;
}

/** 걸음 배열판. 트리를 못 실은 문항은 이것을 준다 — 같은 것을 낮은 해상도로 보여 준다. */
export interface FoldModel {
  expr: string;
  /** `[0]` 은 **주어진 식**이라 언제나 보인다. 걸음 수는 `steps.length - 1` 이다. */
  steps: readonly FoldStep[];
}

/* ═══════════════ 값 상자 ═══════════════ */

export interface ValueCell {
  /** 이름표. */
  name: string;
  /** 타입 이름이 있으면 이름표 옆에 붙는다. 없으면 안 그린다. */
  type?: string | undefined;
  /** 상자에 담긴 값. */
  value: string;
  /** 이번 줄에서 바뀐 칸인가. **`predict` 에서 가려지는 칸이 이것이다.** */
  changed?: boolean | undefined;
  /** 값이 어디서 왔나 — 화살표 꼬리에 붙는 글자. */
  from?: string | undefined;
}

export interface ValueStep {
  /** 이 단계의 코드 한 줄. */
  code: string;
  /** 이 줄이 **끝난 뒤**의 전체 스냅숏. 칸 순서는 단계마다 같아야 한다. */
  cells: readonly ValueCell[];
  /** 한 줄 설명 — 「오른쪽을 먼저 셈하고 나서 이름표를 옮긴다」. */
  note?: string | undefined;
}

export interface ValueBoxModel {
  steps: readonly ValueStep[];
}
