/**
 * `order` 채점 — **인접 쌍 일치 비율** (D187 ⑱ · `docs/program/fundamentals.md` §13).
 *
 * 채점 규칙을 새로 만들지 않았다. `pct = 맞은 인접 쌍 / (N−1)` 은 2단 `hop`(`gradeFlow`)의
 * 것이고, 그것이 Parsons 채점의 표준 모양이기도 하다(Ericson 2022). 부분 점수가 있고
 * 결정론이며 난수가 안 든다 — 같은 답에 언제나 같은 pct 다.
 *
 * ## 진단은 **계산한다**
 *
 * 정본 §3-2 는 오답에 「당신이 고른 그것이 참이 되는 조건」을 요구한다. 순열에서 그 조건은
 * 틀린 인접 쌍마다 「왜 B 가 A 보다 먼저인가」이고, 답은 **재료의 사실**에 이미 있다 —
 * 홉이면 부르는 방향(`AuthController.java:56` 이 `AuthService.java` 를 부른다), 사다리면
 * 그때의 타입(`int / int`). 카드가 조각마다 `fact` 를 싣고 여기서 문장을 짓는다.
 * **사람이 진단문을 안 적는다** — `siblings` 가 값 적기에서 한 일과 같다.
 *
 * `@chickadee/cards` 를 import 하지 않는다 — 의존 방향(01 §2)에 `grading → cards` 가 없다.
 * `OrderGradeInput` 이 payload 를 **구조적으로** 받는다.
 */
import { t } from '@chickadee/i18n';

export interface OrderPiece {
  id: string;
  t: string;
  /** 이 조각이 다음 조각보다 먼저인 **이유**. 진단문이 이 한 줄로 지어진다. */
  fact: string;
}

/** 채점에 필요한 것만. `order` payload 가 이 모양을 구조적으로 만족한다. */
export interface OrderGradeInput {
  pieces: readonly OrderPiece[];
  answer: readonly string[];
  ok: string;
  rule: string;
}

/** 어긋난 인접 쌍 하나 — 「학습자가 `a` 다음에 `b` 를 뒀는데」. */
export interface OrderMiss {
  /** 학습자가 앞에 둔 조각. */
  a: string;
  /** 학습자가 뒤에 둔 조각. */
  b: string;
  /** 정답에서 앞인 쪽. `a`·`b` 중 하나이고, 둘 다 정답에 없으면 `null`. */
  first: string | null;
  /** 계산된 한 줄. 「B 가 A 보다 먼저다 — <B 의 사실>」. */
  text: string;
}

export interface OrderVerdict {
  ok: boolean;
  /** 맞은 인접 쌍 / (N−1) × 100. 정답 조각이 둘 미만이면 0. */
  pct: number;
  /** 맞은 인접 쌍 수. */
  hit: number;
  /** 셀 수 있는 인접 쌍 수 (N−1). */
  total: number;
  misses: OrderMiss[];
  okText: string | null;
  rule: string;
  /** 판정란 첫 줄. 정답이면 `null`. */
  diagnosis: string | null;
}

const pairKey = (a: string, b: string): string => `${a}\u0000${b}`;

/**
 * 두 조각의 앞뒤를 정답에서 본다. 둘 다 정답에 있으면 먼저인 쪽을, 하나라도 없으면 `null`.
 * 자리를 **비교**할 뿐이라 인접이 아니어도 답이 나온다 — 「이 둘은 순서가 반대다」가 진단이다.
 */
function earlier(answer: readonly string[], a: string, b: string): string | null {
  const i = answer.indexOf(a);
  const j = answer.indexOf(b);
  if (i < 0 || j < 0 || i === j) return null;
  return i < j ? a : b;
}

/**
 * `order` 한 판의 채점.
 *
 * `ordered` 는 학습자가 세운 순서다. 정답에 없는 조각이 섞이면 그 조각이 든 쌍이 그냥 안
 * 맞을 뿐 따로 벌하지 않는다 — 함정 카드가 이미 그 자리의 쌍을 깎았고, 상한을 또 걸면
 * 같은 실수를 두 번 벌한다(`gradeFlow` 가 같은 이유로 wrong 상한을 껐다).
 */
export function gradeOrder(item: OrderGradeInput, ordered: readonly string[]): OrderVerdict {
  const { answer } = item;
  const label = new Map(item.pieces.map((p) => [p.id, p.t]));
  const fact = new Map(item.pieces.map((p) => [p.id, p.fact]));
  const name = (id: string): string => label.get(id) ?? id;

  const want = new Set<string>();
  for (let i = 0; i + 1 < answer.length; i += 1) {
    want.add(pairKey(answer[i] as string, answer[i + 1] as string));
  }

  let hit = 0;
  const misses: OrderMiss[] = [];
  for (let i = 0; i + 1 < ordered.length; i += 1) {
    const a = ordered[i] as string;
    const b = ordered[i + 1] as string;
    if (want.has(pairKey(a, b))) {
      hit += 1;
      continue;
    }
    const first = earlier(answer, a, b);
    // 「B 가 A 보다 먼저인 이유」를 재료의 사실에서 짓는다. 사실이 없으면 자리만 말한다.
    const text = first === null
      ? t('grading.orderMissUnknown', { a: name(a), b: name(b) })
      : t('grading.orderMissWhy', {
          first: name(first),
          second: name(first === a ? b : a),
          fact: fact.get(first) ?? '',
        });
    misses.push({ a, b, first, text });
  }

  const total = Math.max(0, answer.length - 1);
  const pct = total === 0 ? 0 : Math.round((100 * Math.min(hit, total)) / total);
  const ok = total > 0 && hit >= total && misses.length === 0;
  return {
    ok, pct, hit, total, misses,
    okText: ok ? item.ok : null,
    rule: item.rule,
    diagnosis: ok ? null : (misses[0]?.text ?? t('grading.orderMissEmpty')),
  };
}
