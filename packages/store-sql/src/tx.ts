/**
 * `store_batch` 위의 얇은 빌더 (01 §3.2 · §3.4).
 *
 * `store_batch` 의 계약: `{ name, params }[]` 를 **최대 200개**, **한 트랜잭션**, **전부 아니면 무**.
 * 그래서 이 층이 하는 일은 셋뿐이다 — 타입 있는 op 을 모으고, 200개 상한을 **보내기 전에** 막고,
 * 자를 수 있게 조각을 내준다. SQL 도 IPC 호출도 여기 없다(`ipc.store.batch(t.build())` 는 호출자가).
 *
 * 왜 상한을 여기서 막나: 넘긴 채로 보내면 Rust 가 `BAD_INPUT` 으로 되던지고, 그때는 이미
 * 「무엇을 어떻게 나눌지」 아는 문맥이 사라진 뒤다.
 */
import type { BatchOp, ParamsOf, StatementName } from '@chickadee/ipc-client';

/** 01 §3.2 `store_batch` 의 op 상한. */
export const MAX_BATCH_OPS = 200;

export class BatchTooLargeError extends Error {
  constructor(readonly count: number, readonly max: number = MAX_BATCH_OPS) {
    super(
      `store-sql: op ${count}개는 store_batch 상한 ${max}개를 넘는다 — ` +
        `\`tx.chunks()\` 로 잘라 여러 번 보낸다. 단, 조각은 각각 별개 트랜잭션이므로 ` +
        `전부-아니면-무 가 필요한 묶음은 자르지 말고 op 수를 줄여야 한다 (01 §3.2).`,
    );
    this.name = 'BatchTooLargeError';
  }
}

/**
 * 한 트랜잭션에 들어갈 op 모음.
 *
 * ```ts
 * const t = tx()
 *   .add('facts.file_upsert', toFileParams(file))
 *   .add('facts.capture_insert', toCaptureParams(repoId, path, capture));
 * await ipc.store.batch(t.build());
 * ```
 */
export class Tx {
  readonly #ops: BatchOp[] = [];

  /** 카탈로그에 있는 이름과 그 이름의 파라미터만 받는다(생성된 `StatementMap` 이 강제). */
  add<K extends StatementName>(name: K, params: ParamsOf<K>): this {
    this.#ops.push({ name, params });
    return this;
  }

  get size(): number {
    return this.#ops.length;
  }

  get isEmpty(): boolean {
    return this.#ops.length === 0;
  }

  /** 상한을 넘으면 **보내기 전에** 던진다. */
  build(): BatchOp[] {
    if (this.#ops.length > MAX_BATCH_OPS) throw new BatchTooLargeError(this.#ops.length);
    return [...this.#ops];
  }

  /**
   * 상한 이하의 조각들로 자른다. 조각 하나가 트랜잭션 하나이므로 **원자성은 조각 안에서만** 성립한다 —
   * 인제스트 파생처럼 재실행이 안전한(멱등) 쓰기에만 쓴다.
   */
  chunks(size: number = MAX_BATCH_OPS): BatchOp[][] {
    if (!Number.isInteger(size) || size < 1 || size > MAX_BATCH_OPS) {
      throw new RangeError(`store-sql: chunk 크기는 1..${MAX_BATCH_OPS} 의 정수여야 한다`);
    }
    const out: BatchOp[][] = [];
    for (let i = 0; i < this.#ops.length; i += size) out.push(this.#ops.slice(i, i + size));
    return out;
  }
}

export const tx = (): Tx => new Tx();

// ───────── 「판 완료」 (02 §8.1) — M2 대기 ─────────

/**
 * 한 판을 마칠 때의 쓰기 순서. 02 §8.1 이 못박은 그대로이며 **한 tx** 다.
 *
 *   `review_log INSERT → mastery UPSERT → session_item UPDATE → (lifer INSERT) → (dunno_event UPDATE review_log_id)`
 *
 * 순서가 계약인 이유: `session_item.review_log_id` 와 `dunno_event.review_log_id` 가 방금 넣은
 * `review_log.id` 를 참조하고, `mastery` 는 `applied_log_id` 로 그 로그까지 반영했음을 표시한다.
 * 하나라도 빠지면 `rebuild_mastery()` 의 재생 결과가 캐시와 어긋난다.
 */
export const PLATE_DONE_STEPS = [
  { table: 'review_log', op: 'insert', optional: false },
  { table: 'mastery', op: 'upsert', optional: false },
  { table: 'session_item', op: 'update', optional: false },
  { table: 'lifer', op: 'insert', optional: true },
  { table: 'dunno_event', op: 'update', optional: true },
] as const;

/**
 * 「판 완료」 한 tx 의 입력. 필드는 각 테이블의 쓰기 인자가 아니라 **자리만** 잡아 둔 것이다 —
 * 세부 파라미터 타입은 대응 statement 가 생기는 M2 에 확정된다.
 */
export interface PlateDoneWrite {
  /** `review_log` 에 넣을 행 (§8.2 `ReviewLog` 에서 `id` 를 뺀 것). */
  reviewLog: unknown;
  /** `mastery` UPSERT 값 (§3.3 겹 리듀서 + FSRS 결과). */
  mastery: unknown;
  /** `session_item` 갱신 — `status`·`elapsed_s`·`state_json`·`review_log_id`. */
  sessionItem: unknown;
  /** 개념 첫 성공일 때만 (§4 「T0 정답 · 개념 첫 성공」). */
  lifer?: unknown;
  /** 그 판에서 「모르겠어요」를 눌렀을 때만 — `review_log_id` 를 잇는다. */
  dunnoEvent?: unknown;
}

/**
 * **아직 만들 수 없다.** 필요한 statement (`review_log` INSERT · `mastery` UPSERT ·
 * `session_item` UPDATE · `lifer` INSERT · `dunno_event` UPDATE) 가 카탈로그에 없다 —
 * 01 §3.4 표의 `review.append` + `mastery.upsert` + `session.save` 줄이며 M2 에서 들어온다.
 * 이름을 지어내면 그때 진짜 이름과 어긋나므로 모양만 두고 던진다.
 *
 * M2 에서 할 일: 이 함수 본문을 `PLATE_DONE_STEPS` 순서대로 `tx().add(…)` 로 채우고,
 * `PlateDoneWrite` 의 `unknown` 을 `ParamsOf<…>` 로 좁힌다.
 */
export function buildPlateDoneTx(_write: PlateDoneWrite): Tx {
  throw new Error(
    'store-sql: 「판 완료」 tx 는 아직 만들 수 없다 — review_log INSERT · mastery UPSERT · ' +
      'session_item UPDATE · lifer INSERT · dunno_event UPDATE statement 가 카탈로그에 없다 (M2, 01 §3.4).',
  );
}
