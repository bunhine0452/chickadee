---
schema_version: 1
type: feature
slug: "spring-http-edge-first-slice"
status: done
difficulty: high
created_at: "2026-09-04T21:58:01+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/Cargo.toml"
    op: update
  - path: "crates/parse/src/langs.rs"
    op: update
  - path: "dictionary/java/_lang.yaml"
    op: create
  - path: "dictionary/java/_imports.scm"
    op: create
  - path: "dictionary/java/_blocks.scm"
    op: create
  - path: "dictionary/ts/_imports.scm"
    op: update
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.test.ts"
    op: update
related:
  - ref: "20260904/Chores/2054_chore_ten-language-curriculum-and-cs-dictionary.md"
    kind: "followup"
tags:
  - "D159"
  - "java"
  - "spring"
  - "http-간선"
  - "tree-sitter"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 「뷰가 백엔드와 어떻게 통신하는가」를 설명이 아니라 간선으로 (D159 ①②)

## 추가 기능

D159 가 「학습 단위를 기능 경로로 올린다」고 정하고 첫 조각을 **`tree-sitter-java` + HTTP 간선**으로
잡았다. 목표는 어휘를 가르치는 것이 아니라 **경로가 실제로 그려지는지 눈으로 보는 것**이었다.

## 동작 흐름

**① 이음매가 양쪽 다 문자열이다.** 그래서 기계가 잇는다.

```js
api.post("/auth/login", credentials)          // FRONT/src/services/authService.js
```
```java
@RequestMapping("/api/auth")                  // 클래스
@PostMapping("/login")                        // 메서드
```

경로가 **클래스와 메서드로 나뉘어** 있어 캡처 하나로 못 붙는다. `_imports.scm` 이 `form` 으로
갈라 내보내고(`route-base` · `route-post` · `route-bare-get` …) TS 가 파일 안에서 합친다.
`form` 이 패턴마다 고정이라 HTTP 메서드 수만큼 패턴이 갈리는데, 그 대가로 **메서드까지 맞춰 잇는다** —
이 리포에 `GET /api/auth/me` 와 `DELETE /api/auth/me` 가 실제로 둘 다 있다.

**② 접미 일치 + `heuristic`.** 프론트는 `axios.create({ baseURL: "/api" })` 아래에서 `/auth/login`
이라고만 쓴다. 설정 파일 형식(axios·fetch 래퍼·Vite proxy)을 쫓는 대신 **접미로 잇는다** —
정확히 맞으면 그쪽이 먼저 이기고(`syntactic`), 접미로 이은 것은 `confidence: 'heuristic'` 이다.
`confidence` 열이 swift 때문에 타입에만 남아 있었는데 여기서 처음 쓰인다.
**후보가 둘 이상이면 아예 안 잇는다 — 틀린 간선은 없는 간선보다 나쁘다.**

**③ 자바 import 도 접미로 푼다.** `com.ssafy.app.service.AuthService` →
`…/com/ssafy/app/service/AuthService.java`. 소스 루트(`src/main/java`)를 설정에서 안 읽는다 —
패키지 경로가 디렉터리 그대로라 접미면 충분하고, 그래야 Maven·Gradle·평평한 배치를 규칙 하나로 덮는다.

## 실리포에서 확인한 것 (`MonggleMonggle`, Spring + Vue, 291파일)

쿼리를 **추측하지 않고** 실제 `AuthController.java` 에 돌려서 맞췄다 — 첫 시도에 `route-base "/api/auth"` ·
`route-post "/login"` 이 나왔다. 그다음 리포 전체(112파일)를 Rust 로 훑어 캡처를 JSON 으로 내리고
`resolveImports` 에 먹였다.

**간선 211개 · HTTP 10개.** 로그인 경로가 그려진다:

```
authService.js  →  AuthController.java   [http · heuristic]
AuthController  →  AuthService           [static]
AuthService     →  UserDao · JwtUtil · User · UnauthorizedException  [static]
```

컨트롤러 13개 중 **10개**가 걸렸다. 안 걸린 셋의 이유를 확인했다 —
① `DreamResultController`·`NoticeLikesController` 는 프론트가 **템플릿 문자열**로 부른다
(`` api.get(`/notices/${noticeId}`) ``). 지금 `(string)` 만 잡고 `(template_string)` 은 안 잡는다 —
**일부러 미룬 것**이고 `.scm` 주석에 적혀 있다. ② `EmotionController` 는 라우트가 `/api/emotions` 인데
프론트가 `/emotions/stats` 를 부른다. **어느 서버 라우트와도 안 맞아서** 해석기가 간선을 안 만들었다 —
없는 것을 지어내지 않은 것이다.

## 검증

`pnpm test:unit` **179파일 / 2,025건 전량 통과**(2,016 → 2,025, Spring 라우트 시험 9) ·
`cargo test -p chickadee-parse --test dictionary` 6/6(새 `java` 의 ABI 14 대조 포함) ·
`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm dict:lint` 13/13 · Rust 예산 **2,354/2,800**.

`tree-sitter-java` 0.23.5 를 넣으면서 예산이 2,352 → 2,354(두 줄)만 늘었다 —
01 §9 의 「언어 하나 = `langs.rs` 한 줄 + `Cargo.toml` 한 줄」이 그대로 지켜졌다.

## 남은 것

- **템플릿 문자열 경로** — `` `/notices/${id}` `` ↔ `@GetMapping("/{noticeId}")`. 정적 앞부분만 비교하거나
  `{x}` ↔ `${…}` 를 자리표로 맞춰야 한다. 컨트롤러 3개가 여기 걸려 있다.
- **`.vue` 안의 호출** — SFC 는 한 파일에 문법 셋이라 `extensions` 모델을 손대야 한다. 지금은 `.js` 만 읽는다.
- **자바 어휘** — `dictionary/java/` 는 지금 `_lang.yaml` + 시스템 쿼리 둘뿐이고 `essential: []` 다.
  바닥 여덟은 `docs/curriculum/java.md` 가 설계해 뒀다.
- **커밋 클러스터 대지**(D159 ②) — 지금 `source='dir'` 이라 이 리포의 대지는 「컨트롤러」·「서비스」, 즉 층이다.