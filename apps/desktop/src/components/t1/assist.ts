/**
 * 이 판의 글자가 어디서 왔나 (D143 · 정본 §3-1 의 `peeks` 선례).
 *
 * **감점하지 않는다.** 세는 이유는 하나다 — 자동 닫기와 제안을 켠 뒤에도 「85 가 무슨
 * 뜻인가」를 말할 수 있어야 하기 때문이다. 점수 계산(`packages/grading/src/t1-result.ts`)은
 * 이 값을 **한 번도 읽지 않는다.**
 *
 * ## 이것은 감사가 아니라 추정이다
 *
 * Monaco 0.52 의 공개 d.ts 에 `onDidType` 이 없다(`onDidPaste` 만 있다). 그래서 변경
 * 하나하나를 **모양**으로 가르는 수밖에 없고, 아래 표는 「대체로 맞는 분류」이지
 * 「무엇이 무엇을 넣었는지의 기록」이 아니다. 알려진 오분류 둘:
 *
 * - 선택 영역을 따옴표로 감싸는 surround(`foo` → `"foo"`)가 제안 수락과 같은 모양이라
 *   `accepted` 가 1 늘어난다. 되돌리려면 변경 직전 문서를 통째로 들고 있어야 하는데,
 *   감점하지 않는 값 하나를 위해 타건마다 문서를 복사할 값어치가 없다.
 * - 한 번에 여러 글자를 만드는 것을 전부 보조로 친다 — 사용자가 여러 글자를 한 번에
 *   넣는 길은 붙여넣기뿐이고 그것은 따로 세므로, 남는 것은 실제로 에디터가 넣은 것이다.
 */
import type { AssistCount } from '@chickadee/grading';

export const emptyAssist = (): AssistCount =>
  ({ keyed: 0, assisted: 0, pasted: 0, accepted: 0 });

/** `IModelContentChange` 에서 이 계산이 읽는 것만. Monaco 없이 테스트하려고 좁혔다. */
export interface ChangeShape {
  /** 지워진 글자 수. 0 이면 순수 삽입이다. */
  rangeLength: number;
  /** 새로 들어간 글자. 삭제만이면 `''`. */
  text: string;
}

export interface TallyContext {
  /** IME 조합 중인가 — 조합 글자는 전부 손이 낸 것이다. */
  composing: boolean;
  /** 이 변경 바로 앞에 `onDidPaste` 가 왔나. */
  pasted: boolean;
  /** 초안 복원처럼 문서를 통째로 갈아 끼운 변경인가 (`e.isFlush`). */
  flush: boolean;
}

/**
 * 변경 하나를 센다. 순수 함수 — 같은 입력에 같은 델타를 낸다.
 *
 * | 조건 | 분류 |
 * |---|---|
 * | `flush`(초안 복원) | 세지 않음 |
 * | 조합 중 | 전부 `keyed` |
 * | 직전이 붙여넣기 | 전부 `pasted` |
 * | 순수 삭제 | 세지 않음 (지운 것은 앉힌 것이 아니다) |
 * | 삽입 1글자 | `keyed` 1 |
 * | 삽입 `\n`+공백 | `keyed` 1 + 나머지 `assisted` (Enter 하나 + 자동 들여쓰기) |
 * | 삽입 여러 글자 | `keyed` 1 + 나머지 `assisted` (자동 닫기 `()` 는 손이 `(` 하나) |
 * | 치환이 늘어남 | `keyed` = 지운 만큼, 나머지 `assisted`, `accepted` 1 (제안 수락) |
 * | 치환이 안 늘어남 | 전부 `keyed` |
 */
export function countChange(change: ChangeShape, ctx: TallyContext): AssistCount {
  const out = emptyAssist();
  const grown = change.text.length;
  if (ctx.flush || grown === 0) return out;

  if (ctx.pasted) {
    out.pasted = grown;
    return out;
  }
  if (ctx.composing) {
    out.keyed = grown;
    return out;
  }

  if (change.rangeLength > 0) {
    if (grown > change.rangeLength) {
      out.keyed = change.rangeLength;
      out.assisted = grown - change.rangeLength;
      out.accepted = 1;
    } else {
      out.keyed = grown;
    }
    return out;
  }

  // 순수 삽입은 손이 친 글쇠 하나 + 에디터가 덧댄 나머지다. 1글자면 나머지가 0 이고,
  // `\n` + 공백이면 Enter 하나 + 자동 들여쓰기, `()` 면 `(` 하나 + 자동 닫기다.
  out.keyed = 1;
  out.assisted = grown - 1;
  return out;
}

export function addAssist(a: AssistCount, b: AssistCount): AssistCount {
  return {
    keyed: a.keyed + b.keyed,
    assisted: a.assisted + b.assisted,
    pasted: a.pasted + b.pasted,
    accepted: a.accepted + b.accepted,
  };
}

/**
 * 손으로 앉힌 글자의 비율(%). 앉힌 글자가 하나도 없으면 100 — 「아직 아무것도 안 썼다」를
 * 「0 % 가 손이다」로 읽히게 두지 않는다.
 */
export function handPct(a: AssistCount): number {
  const all = a.keyed + a.assisted + a.pasted;
  return all === 0 ? 100 : Math.round((100 * a.keyed) / all);
}

/**
 * 변경 흐름을 받아 누계를 든다. 붙여넣기 판정은 **다음 변경 한 번**에만 걸린다 —
 * `onDidPaste` 는 변경보다 먼저 오고, 붙여넣기 하나가 변경 하나를 만든다.
 */
export function makeAssistTally(seed: AssistCount = emptyAssist()) {
  let total: AssistCount = { ...seed };
  let composing = false;
  let pasteArmed = false;

  return {
    get value(): AssistCount {
      return total;
    },
    setComposing(on: boolean): void {
      composing = on;
    },
    armPaste(): void {
      pasteArmed = true;
    },
    /** 변경 하나(= `onDidChangeModelContent` 한 번의 `changes`)를 센다. */
    onChanges(changes: readonly ChangeShape[], flush: boolean): AssistCount {
      const ctx = { composing, pasted: pasteArmed, flush };
      pasteArmed = false;
      for (const change of changes) total = addAssist(total, countChange(change, ctx));
      return total;
    },
  };
}

export type AssistTally = ReturnType<typeof makeAssistTally>;
