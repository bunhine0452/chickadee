# Chickadee — 세션 규칙

이 파일은 Claude Code 가 세션마다 자동으로 읽는다. **모든 세션에 예외 없이 적용된다.**

## 언어 — 이것부터

| 어디 | 언어 |
|---|---|
| **커밋 메시지 · PR 제목·본문** | **영어** |
| **`.github/**`** (워크플로 이름·step name·주석, 이슈·PR 템플릿) | **영어** |
| **`README.md` · `CONTRIBUTING.md` · `SECURITY.md` · `CHANGELOG.md` · `LICENSE` 류** | **영어** |
| 코드 주석 · 식별자 | 영어 |
| 사용자에게 보이는 앱 문구(UI·오류 문구·사전 YAML) | **한국어** — 정본 §6 의 조판 규칙이 한국어 전제다 |
| `docs/**` 설계 문서 6편 · `.oculpm/**` 일지·플랜 · 사용자와의 대화 | 한국어 |

왜: 리포는 MIT 오픈소스로 나간다(정본 §5). 기여자가 처음 보는 표면(커밋 로그·CI·README)이
한국어면 기여 표면이 닫힌다. 반대로 설계 문서와 일지는 사용자·유지보수자의 작업 언어이므로
한국어가 맞고, 앱 문구는 한국어 조판 규칙(`keep-all`·`--measure` 36em·조사 헬퍼)이 전제다.

커밋 형식은 `<type>: <description>` (feat/fix/refactor/docs/test/chore/perf/ci).

## 사람이 읽는 글 — AI 말투 금지

README · 커밋 메시지 · PR · 이슈 답글 · 릴리스 노트 · 문서 산문에 적용된다.
「AI 가 썼구나」는 대개 **내용이 없는데 있는 척하는 문장**에서 들킨다. 아래를 하지 않는다.

**낱말** — `seamless` `robust` `powerful` `elegant` `comprehensive` `cutting-edge`
`delve` `leverage`(동사) `unlock` `empower` `craft`(동사) `journey` `landscape`
`game-changing` `revolutionize` `harness` `boasts` `plethora` `myriad` `realm`
`testament to` `at its core` `in today's fast-paced world`. 한국어도 같다 —
`혁신적인` `강력한` `~를 통해 ~할 수 있습니다` 남발.

**문형**
- `It's not just X — it's Y` / `~일 뿐만 아니라 ~입니다`
- 근거 없는 최상급(`the best`, `blazingly fast`, `업계 최고의`)
- 셋씩 나열하는 습관(`fast, simple, and powerful`)
- 제목을 첫 문장에서 되풀이하기
- 절마다 요약 문장으로 닫기
- 이모지 제목(`## 🚀 Getting Started`), 불릿마다 이모지
- 안 물어본 것에 대한 방어적 부연, 문장마다 붙는 헤지(`arguably`, `essentially`)

**대신** — 구체적인 명사와 숫자, 짧은 평서문. 주장에는 근거나 수치를 붙이고, 못 붙이면
그 주장을 지운다. 트레이드오프는 숨기지 않는다. 모르면 모른다고 쓴다.
쓰고 나서 **「이 문장을 지우면 독자가 잃는 정보가 있나?」** 를 묻는다 — 없으면 지운다.

## 그 다음

- **정본 > 설계 문서 > 내 판단.** 정본은 `.oculpm/discussion/vibe-code-study-app/discussion.md`
  의 「결론」. 설계는 `docs/00-overview.md` 부터 읽는다 — §4 결정 등록부(D1~)가 왜 그렇게
  되어 있는지의 답이고, §7 이 인계 규칙이다.
- **문서를 고치기 전에 결정 등록부에 행을 먼저 올린다**(`docs/00-overview.md` §4.2.1, 다음 번호).
  등록부에 없는 변경은 리뷰에서 되돌린다. 체크리스트 항목 제목은 바꾸지 않는다.
- **얇은 Rust.** `crates/**` + `apps/desktop/src-tauri/src/**` 합계 ≤ 2300줄(D68), 도메인 어휘
  (concept·card·mastery·ink·fsrs·queue·session·grade·review) 금지, SQL 리터럴 금지.
  `bash scripts/check-rust-budget.sh` 가 CI 에서 강제한다.
- **디자인 결정은 사용자 것이다.** `design/logo/chickadee-logo.svg` 와 목업 두 장의 시각은
  바꾸지 않는다. 토큰은 `pnpm design:sync` 로만 갱신한다.
- **작업 단위마다** `journal_write` + `plan_update`(AGENTS.md). 시작 전 `journal_search`.
- **검증 없이 완료라고 말하지 않는다.** 푸시하면 CI 가 돈다 — `gh run watch` 로 확인하고
  빨간 채로 두지 않는다.
- 시크릿(`.env`·API 키)은 어떤 파일·로그·일지에도 넣지 않는다.
