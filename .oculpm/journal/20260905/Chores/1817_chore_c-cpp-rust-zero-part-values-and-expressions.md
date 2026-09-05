---
schema_version: 1
type: chore
slug: "c-cpp-rust-zero-part-values-and-expressions"
status: done
difficulty: high
created_at: "2026-09-05T18:17:55+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/c.md"
    op: update
  - path: "docs/curriculum/cpp.md"
    op: update
  - path: "docs/curriculum/rs.md"
    op: update
related: []
tags:
  - "커리큘럼"
  - "c"
  - "cpp"
  - "rust"
  - "0부"
  - "동작원리"
  - "mcp-tool"
---
[x] C·C++·Rust 커리큘럼에 0부 「이 언어의 값과 식」과 동작 원리 축을 붙였다

병렬 세션 I4. 사용자 요청 「열 언어를 기초부터 심화까지, 언어의 동작 원리부터. 시각 자료를 많이.
처음 배우는 사람이 정수형·실수형·연산식을 이해하고 말 그대로 언어를 이해한다는 느낌으로」 중
C·C++·Rust 셋을 맡았다. 새 파일 없이 기존 세 편에 `§0` 을 넣었다.

## 무엇을 넣었나

세 편 각각에 `§0 0부 — 이 언어의 값과 식`(0.1~0.8/0.9). 개념 C 12 · C++ 13 · Rust 11 이고
신규는 5·7·6, 나머지는 기존 부에서 올려 온 것이다(중복 없이 아래에서 지운다 — `§0.4`).
개념마다 네 칸을 채웠다: `cs/` 선행 · 그림 · **초보가 실제로 틀리는 자리 하나** · 문항 형식.
형식은 I1 의 여섯(`value`·`step`·`bits`·`table`·`build`·`predict`), 그림은 I2 의 일곱을 그대로 썼다 —
이름이 양쪽 문서와 어긋나지 않는 것을 확인했다.

`§0.2` 는 세 언어가 갈리는 자리 열넷을 3열 표로 두고 셋에 복제했다(고칠 때 함께 고친다고 적었다).
마지막 행이 형식 배분을 정한다 — 「`predict` 가 답을 갖나」: C·C++ 은 UB 자리에서 안 갖고
Rust 는 넘침조차 「디버그 패닉·릴리스 감싸기」로 정해져 있다.

`§0.3`(c.md)은 UB 를 `predict` 로 내는 규칙 다섯이다. 핵심은 ②
「아무 값이나 나온다」로 가르치면 학습자가 `if (x + 1 < x)` 로 넘침을 검사할 수 있다고 믿는다는 것 —
컴파일러가 그 `if` 를 지운다. cpp.md 는 여섯째를 더했다(C++ UB 는 값이 아니라 객체 수명에서 더
자주 나므로 UB 판을 2부에 앉힌다).

## 실측

- **사용자 리포 열에 사람이 쓴 `.c`·`.cpp` 가 0장.** `.c` 14장 · `.h` 468장이 잡히지만 전부
  `target/*/build/**` 나 `.venv` 산출물이고 그중 452장이 aws-lc 가 푼 OpenSSL 헤더다.
  `.cpp`·`.cc`·`.hpp` 는 0장. → C·C++ 은 D158 조건부 경로가 기본이 되고, `§1` 이 경고했던
  벤더링 판정(`file.skip_reason 'generated'`)이 선택이 아니라 필수가 된다.
- **Rust 0부 개념을 새로 쟀다**(rust-axis §2.1 에 0부 개념이 없었다). `as` 캐스트 563곳 대
  `try_into`/`TryFrom` 12곳 — **47배**(ECC 는 146:2 로 73배). 폭 붙은 정수 타입 이름 2,885곳
  (`let` 11,338 의 25%). `.len()` 918곳. 측정은 `grep -o` 라 tree-sitter 노드 수보다 크다고 적었다.

## 셋이 같은 값에 닿은 것

0장 후보(깊이 ≤ 2)가 C 24 · C++ 21 · Rust 22 → **전부 28**. `ZERO_CHAPTER_MAX = 24` 를 넷 넘긴다.
README §7 ①의 「0장 상한은 사용자 결정」이 강제로 열린다.

부별 판·일수(0부는 형식 수를 세어 합했고 1~3부는 가정값이라고 적었다): C 93판/47일 ·
C++ 93판/47일 · Rust 105판/53일. 0부만으로 C 12일 · C++ 14일 · Rust 11일이라
「첫 `if` 를 언제 보나」가 결정거리로 남았다.

## 남긴 결정 초안

`c.md` §0.8 에 등록부 행 초안 한 벌(세 편 공통, 번호 미정 — 오케스트레이터가 정한다)과
사용자 결정 넷(0장 상한 · 0부/1부 엇갈려 내기 · UBSan/ASan 기본값 · C++ 코스 진입 근거).
`cs.md` 43 → 44 제안(`cs/signed-and-unsigned` — c.md §7 이 냈는데 cs.md §10 이 받지도 물리지도
않고 지나갔다)은 범위 밖이라 세 편에 적어만 뒀다.

## 검증

- `git diff --stat` 이 내 세 파일만 추가(+676 → 최종 +약 700줄)임을 확인. 다른 세션 파일은
  안 건드렸다.
- 표 열 수를 스크립트로 훑어 어긋난 행 하나(`sort_by(|a, b| …)` 의 생 파이프)를 찾아 `\|` 로 고쳤다.
- I1 `docs/program/fundamentals.md` 와 I2 `design/system/diagrams.md` 를 열어 형식 여섯·그림 일곱의
  이름이 내가 쓴 것과 같은지 대조했다 — 같다.
- 판 수·일수는 **못 쟀다**. 0부만 셀 수 있고 1~3부는 가정이라고 문서에 명시했다.