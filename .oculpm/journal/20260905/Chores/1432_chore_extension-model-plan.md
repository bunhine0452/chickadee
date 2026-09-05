---
schema_version: 1
type: chore
slug: "extension-model-plan"
status: done
difficulty: high
created_at: "2026-09-05T14:32:15+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/plan/extension-model.md"
    op: create
  - path: "docs/plan/README.md"
    op: create
  - path: "dictionary/README.md"
    op: update
related: []
tags:
  - "plan"
  - "extension"
  - "dictionary"
  - "docs"
  - "mcp-tool"
---
[x] 확장 모델 계획 — 언어 하나의 비용 29자리와 「내려앉음」 실측

병렬 세션 F4(뼈대). F1 러스트·F2 파이썬·F3 JS 프레임워크가 각 축을 조사하는 동안,
「언어를 늘릴 때 매번 무엇을 새로 짜는가」와 그 비용을 줄이는 법을 쟀다.

## 한 일

**① 확장점 29자리를 코드로 셌다.** 자바(D159 `73648b0` → D156 `9291f7f` → D166 `bdee9ad`
→ D177 `0548a1f`)와 파이썬(D152 `1ff47e6`·`f8d00da`)의 커밋을 역추적해 표로 냈다.
필수는 8곳(`Cargo.toml`·`langs.rs`·`grammarSchema`·`_lang.yaml`·개념 yaml+scm·`_blocks.scm`
·`DEBT_RATCHET`)이고 나머지 21곳은 빠뜨려도 안 죽되 기능이 조용히 꺼진다.

표에서 나온 것 셋 — 확장자→언어 표가 **여섯 벌**이고 그중 자바를 아는 것은 둘뿐이다.
`ReimplPlate.tsx:37` 이 `MONACO_LANGUAGES` 에 없는 `'java'` 를 Monaco 에 줘서 **5단 재구현
판의 자바가 plaintext 로 그려진다**(같은 파일 34행 주석과 코드가 어긋나 있다 — 범위 밖이라
안 고쳤다). 그리고 러스트 예산이 2,769/2,800 이라 새 문법 열 개면 예산이 끝난다.

**② 정본 §5 의 「티어 A 로 내려앉는다」가 참인지 쟀다 — 아니다.**
`langSpecs` 가 쿼리 0인 문법을 떨어뜨리고 `extension_map` 이 표에 없는 확장자의 파일 행을
안 만들어, `.go`·`.rb`·`.astro` 만 있는 리포는 파일 0장이 된다. 순수 함수 넷을 `npx tsx` 로
돌려 확인: `buildCourse([])`·`assignUnits([])`·`entryUnits([],[])`·`requestPaths([])` 가
전부 빈 배열이고 던지는 자리는 없다. **「기타」 덩어리도 안 생긴다.** 티어 A 넷 중 셋
(`cs/`·`proto/`·`arch/`)이 언어 사용처의 창을 빌려 살기 때문이다(`borrow.ts` · `zero-chapter.ts`
의 「사용처가 아예 없는 개념은 넣지 않는다」).

더 나쁜 것은 반쪽 리포다 — `IngestDone`·`RepoProbe` 어디에도 「표에 없어 건너뛴 파일」이 없어
`file_converter` 는 rs 43장을 못 읽고도 아무 말 없이 절반짜리 코스를 연다.

**③ 사용자 리포 10개 실측.** 코드 파일 2,140장 중 1,660장(78%)이 읽힌다. 코드가 있는 7개 중
**주 언어까지 읽히는 것은 4개**(ECC·MonggleMonggle·adelie·ai-pm). 러스트를 열면 `.rs` 347장과
리포 2개가 더 열려 6/7·94% 가 되고, 그 값에 드는 Rust 코드가 **0줄**이다(문법이 이미
`langs.rs` 에 링크돼 있다).

**④ `dictionary/README.md` 를 다시 썼다.** 20줄짜리가 낡아 있었다 — 네임스페이스 목록이
실제와 어긋나고(`go`·`rs`·`swift`·`dart` 는 없고 `java`·`css`·`cs`·`proto`·`exec`·`spring`·
`mybatis` 는 빠져 있었다), 「내용은 M1 에서 채운다 … 폴더만 있다」고 적혀 있는데 실제로는
개념 185장 24,495줄이 서 있다. `CONTRIBUTING.md:88` 이 이 파일을 「the directory contract」로
가리키므로 그대로 두면 언어를 더하려는 기여자가 첫 문에서 틀린 정보를 받는다.
네임스페이스 네 종류·`_lang.yaml` 필드표·캡처 규약(`form` 33종)·골든이 선택이라는 것·
언어 여는 체크리스트를 넣었다. **언어는 CLAUDE.md 의 「`README.md` 류는 영어」를 따라 영어로
바꿨다** — 한국어였던 것을 바꾼 것이라 사용자 확인이 필요하면 되돌리면 된다.

**⑤ 로드맵.** 축을 가로지르는 순서는 0 배관 단일화 → 1 언어 센서스 → 2 `new-language.mjs`
→ 3 러스트 → 4 파이썬 → (5 블록 폴백) → 6 JS 프레임워크 → 7 새 문법. 0~2 는 사전을 한 줄도
안 쓰는데 축 셋이 고칠 자리를 20 → 3 으로 줄인다.

## 검증

- `bash scripts/check-rust-budget.sh` → 2,769/2,800 · 금칙어·SQL·raw output 전부 ok.
- 확장자 15개·네임스페이스 13개·개념 185장은 `dictionary/**` 를 직접 읽어 셌고,
  리포 분포는 `git ls-files` 로 쟀다(읽기만).
- 내려앉음은 `npx tsx` 로 순수 함수 넷을 실제로 돌려 확인했다.

## 메모

- 결정 등록부에 행을 올리지 않았다 — 착수 결정은 사용자 몫이라 후보 다섯을
  `extension-model.md` §6 에 초안으로 뒀다(번호는 오케스트레이터가 배정, 오늘 마지막 D180).
- 「N주 뒤 몇 개」의 주 수는 자바 커밋 넷의 범위에서 역산한 **어림이고 실측이 아니다.**
  F1 이 러스트 사전 첫 장을 쓸 때 시간을 남기는 것이 첫 표본이다.
- `docs/plan/README.md` 의 `rust-axis.md` 줄은 F1 이 도착하면 채울 자리로 비워 뒀다.