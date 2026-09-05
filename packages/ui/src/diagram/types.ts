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

/* ═══════════════ 메모리 줄 ═══════════════ */

/**
 * 줄 위의 칸 하나. **주소가 값의 일부다** — `a[i]` 가 왜 「거리 `i`」인지는 주소가 보여야
 * 성립한다(`c-learning.md` §11.1 — 이 그림 하나가 C 오개념 여섯을 덮는다).
 */
export interface MemorySlot {
  /** 소스에 적히는 그대로 — `'0x1000'`. 수로 안 받는 이유는 `BitsModel.literal` 과 같다. */
  addr: string;
  value: string;
  /** 이름표 하나. `names` 가 있으면 이쪽은 무시된다. */
  name?: string | undefined;
  /**
   * 이름표 **여럿** — 별칭. `b = a` 뒤에 두 이름이 한 칸을 가리키는 것을 그린다
   * (py-learning.md §11.1 · ts-learning.md §11.1 이 같은 신청을 냈다).
   * 값을 나란히 적으면 `[1, 2]` 와 `[1, 2]` 가 되어 별칭인지 복사인지 구별이 사라진다.
   */
  names?: readonly string[] | undefined;
}

/**
 * 줄 위의 **창** — 슬라이스는 줄이 아니라 줄 위의 창이다(`go-learning.md` §11.1).
 * `append` 가 원본을 고치나 마나는 `cap` 경계가 정한다.
 */
export interface MemoryWindow {
  name: string;
  /** 창이 시작하는 슬롯 인덱스. */
  from: number;
  /** 지금 길이 — 읽고 쓸 수 있는 칸 수. */
  len: number;
  /** 늘릴 수 있는 한계. `cap > len` 이면 그 사이가 「아직 안 쓴 자리」다. */
  cap: number;
}

export interface MemoryLineModel {
  /** 첫 칸의 주소. 캡션과 낭독 문장이 그대로 쓴다. */
  base: string;
  /** 칸 하나의 크기(바이트). `a[i]` 의 주소가 `base + i × stride` 인 것이 수업이다. */
  stride: number;
  slots: readonly MemorySlot[];
  windows?: readonly MemoryWindow[] | undefined;
}

/* ═══════════════ 겹친 비트 배열 ═══════════════ */

/**
 * 두 폭의 **관계**. `300u32 as u8` 이 왜 44 인가 — 한 줄짜리 비트 배열로는 못 그린다
 * (diagrams.md §3 상자). 아래 폭에 맞춰 위 폭을 겹쳐 **잘리는 자리**를 보인다.
 */
export interface BitOverlayModel {
  from: BitsModel;
  to: BitsModel;
  /** 살아남는 하위 비트 수. 보통 `to.width` 이고, 다르면 그 수가 이긴다. */
  keep: number;
}

/* ═══════════════ 스택 프레임 ═══════════════ */

export interface StackFrame {
  /** 함수 이름 — `'main'`. */
  fn: string;
  args: readonly ValueCell[];
  locals: readonly ValueCell[];
}

/**
 * 프레임이 걷힐 때 **도는 코드**. C 는 프레임이 사라지는 것이 전부라 이 칸이 없었고,
 * C++ 은 사라지는 **순서대로 코드가 돈다**(`cpp-learning.md` §11.1).
 */
export interface StackUnwind {
  name: string;
  /** 1부터. 이 번호가 답이므로 `predict` 에서 이름이 가려지고 번호가 남는다. */
  order: number;
}

export interface StackStep {
  code: string;
  /** 이 줄이 **끝난 뒤**의 전체 스냅숏. `ValueStep` 의 중첩판이다. */
  frames: readonly StackFrame[];
  unwind?: readonly StackUnwind[] | undefined;
  note?: string | undefined;
}

export interface StackFramesModel {
  steps: readonly StackStep[];
}

/* ═══════════════ 타입 변환 사다리 ═══════════════ */

/**
 * 간선의 종류. **값이 아니라 관계**라 모델에 따로 있다(diagrams.md §3 상자) —
 * 비트 배열은 값 하나를 그리므로 관계를 못 그린다.
 */
export type ConversionKind = 'widen' | 'narrow' | 'fallible';

export interface ConversionRung {
  /** 타입 이름. `NumType` 이 아닌 이유는 `String`·`&str` 같은 칸도 서기 때문이다. */
  type: string;
  value: string;
  note?: string | undefined;
}

export interface ConversionEdge {
  /** `rungs` 의 인덱스. */
  from: number;
  to: number;
  kind: ConversionKind;
  /** 소스에 적히는 이름 — `'as'`·`'From'`·`'TryFrom'`. 언어마다 다르므로 데이터가 나른다. */
  label?: string | undefined;
  /** 이 간선을 지난 뒤의 값. 없으면 `to` 칸의 값이 곧 결과다. */
  result?: string | undefined;
}

export interface ConversionLadderModel {
  rungs: readonly ConversionRung[];
  edges: readonly ConversionEdge[];
}

/* ═══════════════ 권한 줄 ═══════════════ */

/**
 * 한 자리가 한 권한에 대해 갖는 상태 다섯. **표기는 재구현이다** —
 * Brown/Aquascope 의 `+`·`/`·채운 글자는 아이디어이지 지문이 아니다(`rs-learning.md` §11.1).
 */
export type PermState = 'has' | 'gained' | 'lost' | 'missing' | 'none';

/**
 * **place** — 대입 왼쪽에 올 수 있는 것 전부. 이름이 아니라 경로인 것이
 * 「소유권 화살표」와의 유일한 구조 차이다: `x` 와 `*x` 와 `v[0]` 이 서로 다른 권한을 든다.
 */
export interface PermPlace {
  path: string;
  r: PermState;
  w: PermState;
  o: PermState;
}

/** 이 줄이 **무슨 권한을 요구하나**. 물음이라 `predict` 에서도 가려지지 않는다. */
export interface PermExpect {
  path: string;
  needs: readonly ('r' | 'w' | 'o')[];
}

export interface PermStep {
  code: string;
  places: readonly PermPlace[];
  expects?: readonly PermExpect[] | undefined;
  note?: string | undefined;
}

export interface PermissionLineModel {
  steps: readonly PermStep[];
}

/* ═══════════════ 큐 사다리 ═══════════════ */

/**
 * 걸음 사다리의 **배치판**(ts-learning.md §11.1). `FoldStep.type` 이 값이 아니라
 * **어느 줄인가**(`script`·`micro`·`task`)이고, 그 줄이 열이 된다.
 */
export interface QueueLadderModel {
  /** 열이 될 줄 이름. `fold.steps[i].type` 이 여기 있는 값과 맞아야 그 열에 선다. */
  lanes: readonly string[];
  fold: FoldModel;
}

/* ═══════════════ 나란한 걸음 ═══════════════ */

/** 채널 연산이 만드는 간선의 종류. 색이 아니라 **이름**이 가른다(정본 §6). */
export type ChannelKind = 'send' | 'recv' | 'wg' | 'mutex';

export interface ParallelLane {
  name: string;
  steps: readonly FoldStep[];
}

/**
 * 레인 사이의 간선. `[레인 인덱스, 걸음 인덱스]`.
 * **간선이 내용이고 간선은 코드에서 계산된다**(채널 연산의 짝) — 그래서 이것은
 * 「두 언어 나란히」와 달리 배치가 아니라 그림이다(`go-learning.md` §11.3.1).
 */
export interface ParallelEdge {
  from: readonly [number, number];
  to: readonly [number, number];
  kind: ChannelKind;
  /** 없으면 `kind` 의 이름표가 붙는다. */
  label?: string | undefined;
}

export interface ParallelStepsModel {
  lanes: readonly ParallelLane[];
  edges: readonly ParallelEdge[];
}
