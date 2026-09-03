/**
 * T2 「이것도 맞다고 생각해요」 (04 §8.4).
 *
 * **점수는 바뀌지 않는다.** T1 의 이의(04 §5)와 같은 원칙이고, 다른 것은 무엇을 넓히느냐다 —
 * T1 은 정규화 규칙을, T2 는 **그 문제의 정답지**를 넓힌다. 정답지는 커밋 한 건이고 커밋은
 * 한 사람이 그날 고른 경로일 뿐이라, 넓힐 통로가 처음부터 있어야 한다(04 §8.4 「왜」).
 *
 * `patternKey`·`shapeSignature` 는 `t1-appeal.ts` 것을 그대로 쓴다 — 트랙과 무관한 함수다.
 */
import { patternKey, shapeSignature } from './t1-appeal.js';
import type { AppealVerdict } from './t1-types.js';
import { T2_ENGINE_VERSION, type T2Payload } from './t2-types.js';

/**
 * 고른 파일이 정답지와 맺은 관계. **04 가 정의하지 않아 여기서 정한 것**이고, 이의를
 * 무리 짓는 키다(아래 `t2PatternKey`).
 *
 * `trap` 사유 **문장**을 키로 삼지 않는 이유: 사유 문장은 04 §8.1 의 템플릿에 파일 이름을
 * 끼워 만든 것이라 카드마다 다르다. 문장으로 무리를 지으면 같은 불만이 카드 수만큼 쪼개져
 * 3건이 영영 모이지 않는다. 대신 그 템플릿을 **고르게 한 관계**를 지도(`edges`)에서 다시
 * 읽는다 — 같은 데이터에서 결정적으로 나오고, 카드를 건너 모인다.
 *
 * - `folded` 접힌 폴더 노드 (04 §7.4)
 * - `parent` 고른 파일이 core 를 가져다 쓴다 — 「놓기만 합니다」 부류
 * - `shared` core 가 고른 파일을 가져다 쓴다 — 「공용 부품」 부류
 * - `sibling` core 와 같은 폴더인데 잇는 선이 없다 — 「같은 폴더 형제」 부류
 * - `far` 지도에는 있지만 core 와 1-hop 이웃도 아니다
 */
export type PickRelation = 'folded' | 'parent' | 'shared' | 'sibling' | 'far';

/** 경로의 디렉터리(끝의 `/` 포함). 루트 파일은 빈 문자열이다. */
function dirOf(path: string): string {
  const cut = path.lastIndexOf('/');
  return cut < 0 ? '' : path.slice(0, cut + 1);
}

/**
 * 고른 파일과 정답지의 관계. 순서는 좁은 쪽부터다 — 한 파일이 여러 관계에 걸릴 수 있고
 * (`features/cart/useCart.ts` 는 core 를 쓰면서 core 와 같은 폴더다), 그럴 때 지도의 선이
 * 폴더 이름보다 강한 근거다.
 */
export function pickRelation(path: string, payload: T2Payload): PickRelation {
  const file = payload.files.find((f) => f.p === path);
  if (file?.folded !== undefined) return 'folded';

  const core = new Set(Object.keys(payload.core));
  for (const [from, to] of payload.edges) if (from === path && core.has(to)) return 'parent';
  for (const [from, to] of payload.edges) if (to === path && core.has(from)) return 'shared';

  const dir = dirOf(path);
  for (const c of core) if (dirOf(c) === dir) return 'sibling';
  return 'far';
}

/**
 * T2 의 `patternKey` (04 §5 의 함수를 그대로 쓴다).
 *
 * 키로 삼는 것 = **문제의 종 + 고른 파일이 정답지와 맺은 관계**. 경로 자체는 넣지 않는다 —
 * 경로는 카드마다 다르고, 넣으면 무리가 카드 단위로 쪼개진다.
 */
export function t2PatternKey(payload: T2Payload, relation: PickRelation): string {
  return patternKey({
    grammar: `t2:${payload.kind}:${relation}`,
    reasons: [],
    original: '',
    user: '',
  });
}

/**
 * `appeal` 원장 한 행에 실릴 초안 (02 §8.2 `Appeal` · 04 §8.4).
 *
 * T1 의 `AppealDraft` 와 필드 이름은 같지만 값의 뜻이 다르다 — T2 의 이의는 **줄이 아니라
 * 파일**에 붙으므로 `line_no` 와 「원본 줄」이 없다. 그래서 별도 타입이다.
 */
export interface T2AppealDraft {
  track: 't2';
  /** T2 는 파일 단위다 — 02 `appeal.line_no` 는 언제나 null (04 §8.4). */
  lineNo: null;
  /** 대응하는 「원본」이 없다. 정답지는 줄이 아니라 파일 목록이다. */
  originalText: null;
  /** 04 §8.4 — `user_text` 는 파일 경로다. */
  userText: string;
  normOriginal: null;
  /** 정규화한 사용자 입력 = 경로의 **모양**(깊이·확장자). 이름을 지우고 형태만 남긴다. */
  normUser: string;
  autoVerdict: Extract<AppealVerdict, 'wrong-pick'>;
  /** 기계가 붙인 사유 — 관계 이름. 사람이 읽는 문장은 `payload.trap` 이 들고 있다. */
  autoReason: PickRelation;
  reasons: string[];
  patternKey: string;
  engineVersion: string;
  dictVersion: string | null;
}

export interface T2AppealInput {
  path: string;
  payload: T2Payload;
  engineVersion?: string;
  dictVersion?: string | null;
}

/**
 * `wrong` 으로 고른 파일 하나에 대한 이의 초안. 파일마다 1행이다 (04 §8.4).
 *
 * 부르는 쪽이 `wrong` 행에서만 부른다 — `core`·`sec` 는 이미 정답이라 이의할 것이 없다.
 * 여기서 막지 않는 이유: 막으면 「정답인데 왜 접수가 안 되나」를 화면이 설명해야 하는데,
 * 애초에 그 버튼이 뜨지 않는 자리다(04 §8.2 의 3티어가 그것을 정한다).
 */
export function draftT2Appeal(input: T2AppealInput): T2AppealDraft {
  const relation = pickRelation(input.path, input.payload);
  return {
    track: 't2',
    lineNo: null,
    originalText: null,
    userText: input.path,
    normOriginal: null,
    normUser: shapeSignature(input.path),
    autoVerdict: 'wrong-pick',
    autoReason: relation,
    reasons: [`kind:${input.payload.kind}`, `relation:${relation}`],
    patternKey: t2PatternKey(input.payload, relation),
    engineVersion: input.engineVersion ?? T2_ENGINE_VERSION,
    dictVersion: input.dictVersion ?? null,
  };
}

/** 같은 `(card_id, user_text)` open 행이 몇 건 모이면 편입을 제안하나 (04 §8.4). */
export const PROMOTE_MIN = 3;

/**
 * 그 문제의 `sec` 로 편입을 제안할 파일 (04 §8.4).
 *
 * **제안일 뿐 반영이 아니다** — 사용자가 확인해야 정답지가 바뀐다. 원격 집계는 없다(06):
 * 이 함수가 세는 것은 이 기기의 `appeal` 행뿐이다.
 *
 * 정렬은 건수 많은 순, 같으면 경로 사전순 — 화면이 「몇 명이(몇 번) 같은 말을 했나」를
 * 위에서부터 읽는다.
 */
export function promoteToSec(counts: readonly { userText: string; n: number }[]): string[] {
  return counts
    .filter((c) => c.n >= PROMOTE_MIN)
    .slice()
    .sort((a, b) => (b.n !== a.n ? b.n - a.n : a.userText < b.userText ? -1 : a.userText > b.userText ? 1 : 0))
    .map((c) => c.userText);
}
