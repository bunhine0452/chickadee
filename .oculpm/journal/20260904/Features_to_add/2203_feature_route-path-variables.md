---
schema_version: 1
type: feature
slug: "route-path-variables"
status: done
difficulty: medium
created_at: "2026-09-04T22:03:55+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/ts/_imports.scm"
    op: update
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2158_feature_spring-http-edge-first-slice.md"
    kind: "followup"
tags:
  - "D159"
  - "spring"
  - "http-간선"
  - "템플릿-문자열"
  - "mcp-tool"
---
[x] 경로 변수를 쓰는 라우트가 통째로 안 이어지던 것 (D159 후속)

## 추가 기능

앞 판이 컨트롤러 13개 중 10개를 이었고, 안 걸린 셋 중 둘이 **경로 변수** 때문이었다.
프론트는 `` api.get(`/notices/${noticeId}`) `` 로 쓰고 서버는 `@GetMapping("/{noticeId}")` 로 쓴다 —
같은 자리인데 글자가 달라 영영 안 만난다.

## 동작 흐름

**① 쿼리에서 템플릿 문자열을 같이 잡는다.** 노드 종류 대안 `[(string) (template_string)]` 으로
패턴을 늘리지 않고 덮었다 — `form` 이 패턴마다 고정이라 HTTP 메서드 다섯 × 문자열 종류 둘이
열 패턴이 될 뻔한 것이 다섯으로 남는다.

**② 양쪽을 자리표 하나로 접는다.** `normPath` 가 `${…}`(프론트)와 `{…}`(Spring)를 둘 다 `:` 로
바꾼다. 접는 자리는 색인을 만들 때(서버)와 조회할 때(클라이언트) **둘 다**여야 한다 —
한쪽만 접으면 아무것도 안 맞는다.

클래스 기본 경로 안의 변수도 접힌다 — 이 리포의 `@RequestMapping("/api/dreams/{dreamId}/result")`
가 그 경우다.

## 실리포에서 잰 것 (`MonggleMonggle`)

**HTTP 간선 10 → 12, 이어진 컨트롤러 10 → 12.**
`DreamResultController` 와 `NoticeLikesController` 가 새로 이어졌다.

**남은 하나는 버그가 아니라 발견이었다.** `monthlyAnalysisService.js:65` 의
`api.get("/emotions/stats")` 는 **백엔드 어디에도 닿지 않는다** — `EmotionController` 는
`@RequestMapping("/api/emotions")` + 경로 없는 `@GetMapping` 뿐이고, `BACK/src/main/java` 전체를
훑어도 `stats` 매핑이 없다. 해석기가 간선을 안 만든 것이 옳다.
이 자리는 나중에 그 자체로 문항이 된다 — 「이 호출은 어디로 가는가」.

## 검증

`pnpm test:unit` **179파일 / 2,028건 전량 통과**(2,025 → 2,028, 새 시험 셋 —
템플릿 문자열 · 기본 경로 안의 변수 · 안 맞으면 안 잇기) ·
`cargo test -p chickadee-parse --test dictionary` 6/6 · `typecheck`·`lint` 무출력 ·
Rust 예산 2,354/2,800.

**한 번 헛돈 것**: 전체 시험에서 `t2-perf` 의 「24 노드 배치가 5ms 안에」가 10.3ms 로 걸렸다.
단독 실행 3회 전부 96ms 로 통과 — 179파일 병렬 + `cargo build` 동시 실행의 부하였다.
배치 코드는 이 판에서 한 줄도 안 건드렸다.

## 남은 것

- **`.vue` 안의 호출** — 지금 `.js` 만 읽는다. SFC 는 한 파일에 문법 셋이라 `extensions` 모델을 손대야 한다.
- **커밋 클러스터 대지**(D159 ②) — 경로는 그려졌지만 아직 「기능」이라는 이름으로 안 묶인다.
  지금 `source='dir'` 이라 이 리포의 대지는 「컨트롤러」·「서비스」, 즉 층이다.