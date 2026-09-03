/**
 * 키체인 계정 이름 하나. 「전부 지우기」(`maintenance.ts`)와 LLM 키 패널(`llmKey.ts`)이
 * **같은 이름**을 봐야 지운 것이 지워진다 (06 §6.4 의 「키체인 항목」).
 *
 * 파일을 따로 둔 이유: 둘 중 아무 쪽에 두어도 나머지가 그것을 import 하는데, 둘은 이미
 * 서로를 부르므로(`maintenance → llmKey.forgetKeyStore`) 순환이 된다. 상수 하나를 밖으로
 * 빼면 순환이 사라진다 — 값이 하나뿐인 파일이 순환보다 싸다.
 *
 * 서비스 이름은 Rust 쪽 `src-tauri/src/commands/maint.rs` 가 들고 있다.
 */
export const LLM_ACCOUNT = 'llm';
