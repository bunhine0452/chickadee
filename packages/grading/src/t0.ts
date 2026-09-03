/**
 * T0 판정과 진단 선택 (04 §2.1).
 *
 * 이 파일은 순수 함수만 둔다 — IPC 도 SQL 도 부르지 않는다. 카드 전환에 IPC 0회라는
 * 게이트가 여기에 걸려 있고, 인자로만 받으면 테스트가 픽스처 하나로 끝난다.
 *
 * 겹(`layer`)·FSRS·큐 삽입은 `@chickadee/scheduler` 가 한다. 엔진은 겹을 제안하지 않는다
 * (04 §2.2 — 목업 `t0.js:146` 의 「다시 찍기 정답 +1겹」은 앱에서 틀렸다).
 */
import type { CardPayload } from '@chickadee/store-sql';

/** `CardPayload` 의 t0 변형. 카드 문구는 **생성 시점에 이미 렌더된 최종 문자열**이다 (D74). */
export type T0Card = Extract<CardPayload, { track: 't0' }>;
export type T0Kind = T0Card['kind'];

/** 보기별 진단문 — 「틀렸다」가 아니라 「그것이 참이 되는 조건」 (정본 §3-2). */
export type Diag = NonNullable<T0Card['why'][number]>;
export type T0Result = NonNullable<T0Card['result']>;

export interface T0Verdict {
  correct: boolean;
  /** 고른 보기의 진단 하나. 정답이면 `null`. */
  diag: Diag | null;
  ok: string;
  rule: string;
  result?: T0Result;
  /** 아래층(prereq) 판에서만 — 위 판으로 이어지는 「이어보기」 문단. */
  bridge?: string;
}

/**
 * 진단 선택 (04 §2.1 표). kind 별 출처가 다르지만 그 갈래는 **생성 시점**에 이미 갈린다
 * (D74: `why[]` 는 렌더된 최종 문자열). 채점기가 하는 일은 「고른 보기의 것 하나」를
 * 집는 것뿐이다 — 정답 자리는 `null` 이고, blank·meaning 은 03 린트가 오답 3개의 진단을
 * 강제하므로 여기서 비지 않는다.
 *
 * 폴백은 point 의 ①② 밖 후보(사전에 `diag` 가 없는 pick)와, 굽다 만 판을 위한 최후의
 * 그물이다. 템플릿 치환은 하지 않는다(D74) — 카드가 이미 가진 `rule` 을 그대로 쓴다.
 */
export function pickDiag(card: T0Card, sel: number): Diag | null {
  if (sel === card.answer) return null;
  return card.why[sel] ?? { t: card.rule };
}

/**
 * 판정. `correct = sel === card.answer` 하나가 전부다 — 정답 여러 개(answerSet)는
 * 04 §1 이 버렸다(보기별 진단을 붙일 자리가 사라진다).
 *
 * `parent` 를 넘기면 아래층(prereq) 판으로 본다. 04 §2.1 은 「부모 개념 사전의 `bridge`」라
 * 적었고 목업(`t0.js` 의 `T.prereq && c.bridge`)과 04 §2.4 는 「선행 개념의 `bridge`」라
 * 적었다 — 부모 것을 먼저 쓰고 없으면 이 판의 것을 쓴다. 어느 쪽에 문장이 실려 있든
 * 「이어보기」가 비지 않는다.
 */
export function gradeT0(card: T0Card, sel: number, parent?: T0Card | null): T0Verdict {
  const correct = sel === card.answer;
  const bridge = parent ? (parent.bridge ?? card.bridge) : undefined;
  return {
    correct,
    diag: pickDiag(card, sel),
    // `ok` 는 정답일 때만 보이지만(목업) 판정란 전체를 05 가 그리므로 언제나 실어 보낸다.
    ok: card.ok,
    rule: card.rule,
    ...(card.result ? { result: card.result } : {}),
    ...(bridge ? { bridge } : {}),
  };
}
