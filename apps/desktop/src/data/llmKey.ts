/**
 * LLM 키 상태 세 갈래 (06 §3.5 · D106).
 *
 * **MVP 는 전송하지 않는다** (D106). 여기가 하는 일은 OS 키체인에 키를 넣고·빼고·있는지
 * 묻는 것까지다. 보내는 문(`llm_ask`)은 01 §7 대로 0.2 에 예약돼 있다.
 *
 * 키 값은 이 파일 어디에도 머물지 않는다 — 인자로 받아 `ipc.secret.set` 으로 넘기고 끝이다.
 * 되읽는 문 자체가 없고(`ipc.secret` 은 `has` 만 있다) 오류 문구에도 값을 싣지 않는다
 * (06 §3.5 「키는 로그·크래시·내보내기에 절대 없다」).
 */
import { ipc } from '@chickadee/ipc-client';

import { LLM_ACCOUNT } from './accounts.js';

/**
 * - `none` — 저장소는 있고 키가 없다.
 * - `stored` — 이 컴퓨터의 키체인에 있다. 값이 무엇인지는 아무도 되읽지 못한다.
 * - `unavailable` — 이 컴퓨터에 비밀 저장소가 없다 (Linux Secret Service 부재, 06 §3.5).
 */
export type KeyState = 'none' | 'stored' | 'unavailable';

/** Rust 가 `keyring` 실패에 붙이는 코드 (`src-tauri/src/commands/maint.rs`). */
const SECRET_STORE = 'SECRET_STORE';

/**
 * 「이 컴퓨터에는 저장소가 없다」를 한 번 확인하면 기억한다.
 *
 * `has` 만으로는 `none` 과 `unavailable` 이 갈리지 않는다 — Rust 는 저장소가 없을 때
 * 오류를 던지지만, 던지지 않고 `false` 로 답하는 구현도 06 §3.5 가 허용한다. 그래서
 * **저장을 시도해 본 결과**를 남긴다. 남기는 것은 이 불리언 하나이고 키 값이 아니다.
 */
let storeBroken = false;

/** 저장소 실패인가. `IpcError` 를 import 하지 않고 코드만 본다 — 화면 테스트의 모의가 무엇을 던지든 같게 읽힌다. */
function isStoreFailure(e: unknown): boolean {
  if (typeof e !== 'object' || e === null || !('code' in e)) return false;
  const code = (e as { code: unknown }).code;
  return code === SECRET_STORE;
}

/** 기억을 지운다 — 테스트와 「전부 지우기」 뒤에 쓴다. 지우는 것은 판단이지 키가 아니다. */
export function forgetKeyStore(): void {
  storeBroken = false;
}

/** 지금 상태. 값은 묻지 않는다 — 물을 문이 없다 (06 §4.3). */
export async function keyState(): Promise<KeyState> {
  if (storeBroken) return 'unavailable';
  try {
    return (await ipc.secret.has(LLM_ACCOUNT)) ? 'stored' : 'none';
  } catch (e) {
    if (!isStoreFailure(e)) throw e;
    storeBroken = true;
    return 'unavailable';
  }
}

/**
 * 키를 넣는다. 돌려주는 것은 **넣은 뒤의 상태**이고 값은 어디에도 남기지 않는다.
 *
 * 붙여넣기에 딸려 온 앞뒤 공백은 여기서 자른다 — 눈에 안 보이는 줄바꿈 하나로
 * 「저장했는데 안 됩니다」가 나는 자리다. 자르고 나서 빈 글자면 저장하지 않는다.
 */
export async function storeKey(value: string): Promise<KeyState> {
  const key = value.trim();
  if (key === '') return keyState();
  try {
    await ipc.secret.set(LLM_ACCOUNT, key);
  } catch (e) {
    if (!isStoreFailure(e)) throw e;
    storeBroken = true;
    return 'unavailable';
  }
  // 저장이 됐다면 저장소는 살아 있다 — 앞선 실패의 기억을 지운다.
  storeBroken = false;
  return 'stored';
}

/** 키를 지운다. Rust 쪽이 멱등하므로(없어도 성공) 상태를 먼저 묻지 않는다. */
export async function dropKey(): Promise<void> {
  try {
    await ipc.secret.delete(LLM_ACCOUNT);
  } catch (e) {
    if (!isStoreFailure(e)) throw e;
    storeBroken = true;
  }
}
