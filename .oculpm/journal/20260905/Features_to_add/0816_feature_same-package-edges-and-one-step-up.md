---
schema_version: 1
type: feature
slug: "same-package-edges-and-one-step-up"
status: done
difficulty: high
created_at: "2026-09-05T08:16:21+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "dictionary/java/_imports.scm"
    op: update
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
  - path: "packages/concepts/src/units.ts"
    op: update
  - path: "packages/concepts/src/units.test.ts"
    op: update
related:
  - ref: "20260905/Features_to_add/0721_feature_css-and-vue-style.md"
    kind: "followup"
tags:
  - "D163"
  - "D162"
  - "java"
  - "기능-경로"
  - "MonggleMonggle"
  - "실측"
  - "mcp-tool"
---
[x] 새 프로그램(D162)의 첫 구현 — 로그인 챕터가 필터 체인을 담는다

## 발생 원인

코스 설계가 **「`SecurityConfig`·`JwtAuthenticationFilter` 가 어느 기능 폐포에도 안 붙는다」**를
막힌 자리로 짚었고, 원인을 실측했다: **자바는 같은 패키지의 클래스를 `import` 없이 쓴다.**
`JwtAuthenticationFilter:25` 가 `JwtUtil` 을 그렇게 쓰고(둘 다 `…finalproject.security`),
`_imports.scm` 이 `import_declaration` 만 잡아 **20간선이 통째로 안 보였다.**

## 해결 방법 — 둘이 필요했다

**① 같은 패키지 간선.** 타입이 쓰이는 자리 다섯(필드·매개변수·지역 변수·`new`·반환 타입)의
`type_identifier` 를 `form: same-package` 로 내보내고, `resolveJava` 가 **점 없는 이름**을
`dirOf(from)/<Name>.java` 로 푼다 — 패키지 선언을 파싱하지 않는다(자바는 패키지 경로가 곧 디렉터리다).
못 푸는 이름(`String`·제네릭 인자·외부 타입)은 파일이 없어 **자연히** 빠진다.

간선 **293 → 304**. 그런데 **이것만으로는 필터가 안 붙었다** — 폐포는 아래로만 가는데
`JwtAuthenticationFilter → JwtUtil` 은 위쪽이다. 간선을 보이게 한 것이지 담은 것이 아니다.

**② 위로 한 단 — 다만 이 기능만의 파일에서만.** 무제한으로 올라가면 **공유 부품이 통로가 된다.**
실측이 그것을 바로 보여 줬다:

| 규칙 | auth | 새로 드는 것 |
|---|---|---|
| 폐포만 | 19 | — |
| 위로 한 단 (무제한) | **48** | 컨트롤러 아홉이 딸려 온다 — `SecurityUtil` 을 일곱 기능이 쓴다 |
| 위로 한 단 (자기 것에서만) | **23** | 필터 · 예외 처리기 · `authStore.js` · 배럴 — **넷 다 로그인의 것** |

`JwtUtil` 은 auth 하나만 쓰므로(공유도 1) 그 위로 올라가고, `SecurityUtil`(7)·`ApiResponse`(6)에서는
안 올라간다. **공유 부품은 위로 갈 때 막다른 길**이라는 것이 이 규칙의 전부다.

챕터 전체: 19→23 · 29→32 · 23→28 · 19→23 · 6→6 · 32→35 · 31→35 · 8→9.

## 안 든 것

`SecurityConfig` 는 여전히 안 든다 — 두 단 위다(`SecurityConfig → JwtAuthenticationFilter → JwtUtil`).
한 단으로 못박은 것은 측정 때문이고(두 단이면 다시 부푼다), 부팅 배선은 코스 설계의
막간·부록이 받는다.

## 검증

`pnpm test:unit` **180파일 / 2,049건 전량 통과**(두 번 연속, 새 시험 3 — 필터가 든다 ·
공유 부품에서 안 올라간다 · 두 단 위는 안 든다) · `cargo test --workspace` 19개 스위트 ok ·
`typecheck`·`lint` 무출력.

## 남은 것

`docs/program/README.md` §7 의 나머지 다섯 — 문항 체계 · `card.kind` 다섯 + `stage_no` ·
`appeal.track` 확장 · `chapter`·`stage_log` 두 표 · **`entryUnits` 원소를 바이트 범위로**
(`LandingView.vue` 1,527줄 중 로그인은 48줄이다).