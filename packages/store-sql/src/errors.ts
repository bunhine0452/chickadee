/**
 * 행 → 객체 변환에서 나는 오류.
 *
 * 규약 두 개가 이 파일의 전부다.
 * 1. **무음 손상 금지** (02 §8.1): `*_json` 이 스키마와 다르면 그 행을 버리거나 필드를 비우지 않고
 *    오류로 올린다. 조용히 `null` 을 넣으면 잘못된 채점·잘못된 겹이 원장에 남는다.
 * 2. **내용을 싣지 않는다** (01 §6 로그 원칙): 메시지·프로퍼티 어디에도 열 값(코드 조각·excerpt·
 *    사용자 답안·「왜」 문장)을 넣지 않는다. 어디가 깨졌는지(테이블·열·행 id·JSON 경로)만 싣는다.
 *    그래서 zod 의 `message` 도, `JSON.parse` 의 `SyntaxError` 도 그대로 옮기지 않는다 —
 *    둘 다 받은 값을 문장에 넣는다.
 */

/** 행 id. 복합 키 테이블은 `'commit_id=12 path=src/a.ts'` 처럼 넘긴다. */
export type RowId = string | number | null;

export class RowDecodeError extends Error {
  constructor(
    readonly table: string,
    readonly column: string,
    readonly rowId: RowId,
    message: string,
  ) {
    super(message);
    this.name = 'RowDecodeError';
  }
}

/** 열이 없거나 SQLite 타입이 기대와 다르다. 값은 싣지 않는다. */
export class ColumnTypeError extends RowDecodeError {
  constructor(table: string, column: string, rowId: RowId, readonly expected: string) {
    super(table, column, rowId, `store-sql: ${table}.${column} (행 ${String(rowId)}) 가 규약과 다르다 — 기대: ${expected}`);
    this.name = 'ColumnTypeError';
  }
}

/**
 * `*_json` 열이 JSON 이 아니거나 zod 스키마와 다르다.
 * `issuePaths` 는 `'why.0.edge:invalid_type'` 처럼 **경로와 코드만** — 받은 값은 들어가지 않는다.
 */
export class JsonColumnError extends RowDecodeError {
  constructor(table: string, column: string, rowId: RowId, readonly issuePaths: readonly string[]) {
    super(
      table,
      column,
      rowId,
      `store-sql: ${table}.${column} (행 ${String(rowId)}) 의 JSON 이 스키마와 다르다` +
        (issuePaths.length > 0 ? ` — ${issuePaths.join(', ')}` : ''),
    );
    this.name = 'JsonColumnError';
  }
}
