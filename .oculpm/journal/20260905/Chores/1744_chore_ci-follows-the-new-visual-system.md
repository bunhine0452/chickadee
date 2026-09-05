---
schema_version: 1
type: chore
slug: "ci-follows-the-new-visual-system"
status: done
difficulty: medium
created_at: "2026-09-05T17:44:29+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "scripts/stylelint-chickadee.mjs"
    op: update
  - path: "scripts/stylelint-chickadee.test.mjs"
    op: update
  - path: "stylelint.config.js"
    op: update
  - path: "tests/support/e2e-selectors.test.ts"
    op: create
  - path: "apps/desktop/src/components/run/RunPanel.css"
    op: update
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
related: []
tags:
  - "CI"
  - "린트"
  - "D182"
  - "감사"
  - "mcp-tool"
---
[x] CI 감사 — 죽은 규칙 둘을 갈아 끼우고 검사 둘을 세웠다

사용자 물음: 「바뀐 코드가 많으니 CI 도 바뀌어야 하지 않아?」 옳았다. **CI 는 돌고 있었지만 지키는 대상이 사라진 규칙이 셋이었다.**

## 감사에서 나온 것

**① 죽은 stylelint 규칙 둘.** `chickadee/track-alias-only` 는 `--blue/--pink/--yellow` 직접 참조를 막던 규칙인데 **그 토큰이 D182 로 사라져 막을 것이 없다**(현재 사용처 0). `chickadee/print-physics-scope` 는 `.mr`·`.grain`·`mix-blend-mode` 를 본문 단 밖으로 밀던 규칙인데 **그 클래스가 삭제됐다**(0). 둘 다 초록이었지만 **통과하는 규칙이 아니라 죽은 규칙**이었고, 죽은 규칙을 초록으로 두면 다음 사람이 그것이 아직 지켜지는 줄 안다.

**② `dark-selector-allowlist` 의 예외 목록이 낡았다** — 여섯 중 `Stamp`·`Node` 는 삭제됐고 나머지도 토큰만으로 선다. 목록을 비웠다.

**③ 별칭 블록이 남아 있었다.** 시스템 세션이 「한 판만」 남긴 옛 이름 78개가 디자인 토큰 원본에 그대로였다. 앱에서 쓰는 곳이 0 임을 확인하고 지웠다(목업 `design/**` 은 이력이라 그대로 둔다).

## 갈아 끼운 것

- **`chickadee/no-retired-tokens`** — 폐기된 이름(`--paper*` `--ink*` `--t0/1/2` `--verdict-*` `--stock` `--edge` `--lamp` `--grain*` `--glow-*` `--f-poster` `--rule` …)을 쓰거나 재정의하면 걸린다. 원본 파일도 예외가 아니다.
- **`chickadee/no-decoration`** — 정본 §6 「장식 0」을 린트로. `mix-blend-mode`·`backdrop-filter`·반복 그러데이션·`drop-shadow`·0 이 아닌 `rotate`.

## 새 규칙이 **바로 잡아낸 것**

`components/run/RunPanel.css` 가 **정의 없는 이름 아홉**을 쓰고 있었다 — `--rule` · `--fs-13`~`--fs-16` · `--f-mono` · `--state-locked/progress/right/wrong`. CSS 에서 정의 없는 `var()` 는 오류가 아니라 **그 선언을 무효로 만드는 것**이라 `border: 1px solid var(--rule)` 은 **테두리가 아예 안 그려지고** `font-size` 는 상속값이 된다. 실행 러너 화면이 조용히 깨진 채였고 **타입체크·단위 시험·대비 게이트·e2e 가 전부 초록이었다.**

## 세운 검사 둘 (`tests/support/`)

- **CSS 변수 대조** — 폴백 없는 `var(--x)` 가 정의된 이름만 가리키는지. 위 사고의 반대편을 막는다(폐기 목록에 없어도 **정의가 없으면** 걸린다). 컴포넌트가 인라인으로 넣는 셋(`--w`·`--pct`·`--fill`)만 예외.
- **실제 바이너리 e2e 이름 대조** — 그 스펙이 부르는 선택자·문구가 소스에서 통째로 사라졌는지. **오늘의 두 사고를 재현해 대 봤더니 둘 다 안 걸렸다** — `.qlist` 는 다른 요소에 이름이 살아 있었고 `settings` 도 글자가 남아 있었다. 그래서 약속을 「이름이 아예 없어지면 걸린다」 하나로 좁혀 파일 머리에 적었다. 초록이라고 안심하면 안 된다.

## 함께 정리한 것

`report(e, …)` 의 로그 라벨에 남아 있던 은유 다섯(`오늘의 인쇄` · `인쇄 시작` · `코스 판 굽기` · `필사 판 마무리` · `구조 판 마무리`)을 평문으로. 화면 문구는 아니지만 유지보수자가 읽는 글이고, 어휘가 두 벌이면 다음 사람이 어느 쪽이 정본인지 모른다.

## 검증

`pnpm lint` 무출력(stylelint 새 규칙 포함) · `pnpm typecheck` 0 · `pnpm test:unit` **2,234 통과 / 실패 0**(새 시험 5, 규칙 시험 23 재작성) · `design:check` 일치 · `check:contrast` 142쌍 · `check:motion` 0 · `check-rust-budget.sh` 방벽 넷.

## 메모

일지 도구가 `**/*token*` 을 시크릿 경로로 막아 새 시험 파일 하나를 `files_touched` 에 못 넣었다 — 디자인 토큰이라 이름만 겹친다.