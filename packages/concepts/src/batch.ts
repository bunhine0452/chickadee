/**
 * `store_batch` 묶어 보내기. `ingest.ts` 와 `identities.ts` 가 같이 쓴다 — 한쪽에 두면
 * 두 파일이 서로를 import 하는 고리가 생긴다.
 */
import { ipc, type BatchOp } from '@chickadee/ipc-client';

const BATCH = 200;

/**
 * `store_batch` 는 한 번에 200 op 다 (01 §3.2). 넘겨 보내면 Rust 가 `BAD_INPUT` 으로 되던지고,
 * 그 오류는 대개 호출자의 `catch` 에 먹혀 「조용히 아무것도 안 된」 것으로 보인다 —
 * blame 2차 패스가 실제로 그랬다. 새 쓰기 경로는 전부 이것을 거친다.
 */
export async function inBatches(ops: readonly BatchOp[]): Promise<void> {
  for (let at = 0; at < ops.length; at += BATCH) {
    await ipc.store.batch(ops.slice(at, at + BATCH));
  }
}
