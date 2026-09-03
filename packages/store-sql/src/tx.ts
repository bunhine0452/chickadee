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

// ───────── 「판 완료」 (02 §8.1) ─────────

/**
 * 한 판을 마칠 때의 쓰기. 02 §8.1 이 못박은 다섯 걸음이 **한 tx** 로 나간다.
 *
 * 문서의 순서는 `review_log → mastery → session_item → lifer → dunno_event` 인데
 * 여기서는 **잇는 두 UPDATE 를 로그 바로 뒤로 당긴다**(D77):
 *
 *   `review_log INSERT → session_item UPDATE → dunno_event UPDATE → mastery UPSERT → lifer INSERT`
 *
 * 이유는 하나다 — `store_batch` 는 op 를 **미리 만들어** 보내므로 batch 중간에 생긴
 * `review_log.id` 를 TS 가 알 수 없다. 두 UPDATE 는 `last_insert_rowid()` 로 그것을 집는데,
 * 그 값은 **다음 INSERT 가 성공하면 바뀐다**. `mastery` 는 UPSERT 라 INSERT 경로를 탈 수 있고
 * `lifer` 도 INSERT 다 — 둘 중 하나라도 앞에 오면 `review_log_id` 가 엉뚱한 행을 가리킨다.
 * 의미상의 순서(로그가 먼저다)는 그대로이고, 바뀐 것은 서로 독립인 두 쓰기의 자리뿐이다.
 */
export const PLATE_DONE_STEPS = [
  { table: 'review_log', op: 'insert', optional: false },
  { table: 'session_item', op: 'update', optional: false },
  { table: 'dunno_event', op: 'update', optional: true },
  { table: 'mastery', op: 'upsert', optional: false },
  { table: 'lifer', op: 'insert', optional: true },
] as const;

/** 「판 완료」 한 tx 의 입력. 값은 전부 그 statement 의 파라미터 그대로다. */
export interface PlateDoneWrite {
  reviewLog: ParamsOf<'review.append'>;
  /** `review_log_id` 는 SQL 이 `last_insert_rowid()` 로 채운다. */
  sessionItem: ParamsOf<'session.item_link_last'>;
  /** `applied_log_id` 는 SQL 이 `last_insert_rowid()` 로 채운다 — 그 값이 재생 커서다. */
  mastery: ParamsOf<'review.mastery_upsert_last'>;
  /** 개념 첫 성공일 때만 (02 §3.3 R5 · D76 — 다시 찍기로 맞혀도 행은 쓴다). */
  lifer?: ParamsOf<'review.lifer_insert'>;
  /** 그 판에서 「모르겠어요」를 눌렀을 때만. */
  dunnoEvent?: ParamsOf<'review.dunno_link_last'>;
}

export function buildPlateDoneTx(write: PlateDoneWrite): Tx {
  const t = tx()
    .add('review.append', write.reviewLog)
    .add('session.item_link_last', write.sessionItem);
  if (write.dunnoEvent) t.add('review.dunno_link_last', write.dunnoEvent);
  t.add('review.mastery_upsert_last', write.mastery);
  if (write.lifer) t.add('review.lifer_insert', write.lifer);
  return t;
}
