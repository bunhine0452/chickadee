---
schema_version: 1
type: feature
slug: "entry-point-feature-units"
status: done
difficulty: high
created_at: "2026-09-04T22:13:25+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "packages/concepts/src/units.ts"
    op: update
  - path: "packages/concepts/src/units.test.ts"
    op: create
  - path: "packages/concepts/src/index.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2203_feature_route-path-variables.md"
    kind: "followup"
tags:
  - "D160"
  - "D159"
  - "대지"
  - "기능-경로"
  - "MonggleMonggle"
  - "실측"
  - "mcp-tool"
---
[x] 대지가 「기능」이 아니라 「층」이던 것 (D159 ② · D160)

## 추가 기능

앞의 두 판이 경로를 그렸는데 **아직 기능이라는 이름으로 안 묶였다.** 재 보니 지금 규칙이
이 리포에서 무너진다.

## 재고 나서 골랐다

**지금 규칙(`source='dir'`)이 내는 대지** — Spring 이 package-by-layer 라
`BACK/src/main/java/…` 가 전부 `src` 다음 조각인 `main` 으로 뭉친다.

| 파일 수 | 대지 |
|---|---|
| **107** | **main** ← 백엔드 전체가 한 장 |
| 26 | example_dataset |
| 24 | services |
| 12 | components · 9 views · 8 기타 · 4 src · 4 stores · 3 composables |

**진입점 폐포가 내는 것** — 기능 8개 · 6~27파일: auth 18 · dream 17 · dreamResult 16 ·
fortune 13 · image 6 · monthlyAnalysis 27 · notice 27 · ranking 7.

**로그인 폐포 18파일**이 손으로 센 17과 겹친다 — `AuthController` · `AuthService` · `UserDao` ·
`JwtUtil` · `User` · `LoginRequest`/`Response` · `SecurityUtil` · 예외 셋 · `api.js` · `authService.js`.

## 커밋 클러스터 대신 이것을 고른 이유

**결정적이라서다.** 커밋 위생에 안 기댄다 — `units.ts` 주석이 커밋 클러스터링을 미룬 이유로
「커밋이 적은 리포에서 무너진다」를 적어 뒀는데, 같은 걱정이 메시지 품질에도 걸린다.
그리고 이미 만든 간선을 그대로 쓴다.

## 1:1 을 버렸다 — 이것도 재고 나서다

03 §6.5 는 「파일 → 대지가 1:1」이라고 적었는데 **실측이 그것을 반증했다.**
90파일 중 **13개가 둘 이상의 기능**에 든다(`UserDao` 는 로그인이자 회원정보다).
접는 규칙 둘을 다 재 봤고 **둘 다 정보를 잃는다**:

| 규칙 | 결과 |
|---|---|
| ⓐ 겹치면 어느 기능에도 안 넣는다 | auth 18 → **11**. `UserDao`·`User` 가 로그인에서 빠진다 |
| ⓑ 자기를 담은 폐포 중 가장 작은 것 | 여덟 기능 모두가 쓰는 `api.js` 가 **「이미지」(6파일)** 로 간다 |

겹침은 잡음이 아니라 사실이다. `unit_file` 의 기본키가 이미 `(unit_id, file_id)` 라 **저장은 N:M** 이고,
막는 것은 `Assignment.byPath` 와 03 §6.5 의 한 문장뿐이다. `entryUnits` 는 N:M 으로 돌려준다.

## 한계도 쟀다

코드 121파일 중 **31개가 어느 폐포에도 안 든다** — `SecurityConfig` · `JwtAuthenticationFilter` ·
부트 클래스 · 설정 넷. **Spring 이 런타임에 엮는 것**이라 컨트롤러가 import 하지 않는다.
그래서 디렉터리 규칙을 없애지 않는다 — 두 규칙이 경쟁하지 않고 층을 나눈다.

## 검증

`pnpm test:unit` **180파일 / 2,034건 전량 통과**(새 시험 6 — 폐포 · 이름 뽑기 · 진입점 없음 ·
N:M · 사이클 · 이름 충돌) · `cargo test --test dictionary` 6/6 · `typecheck`·`lint` 무출력 ·
`dict:lint` 13/13 · Rust 예산 통과.

**시험 흔들림 하나를 다시 봤다** — 전체 실행 세 번 중 한 번에서 실패 1이 났고 재실행은 180/2,034
전량 초록이었다. 앞 판에서 같은 증상을 `t2-perf` 의 「24 노드 배치가 5ms 안에」로 특정했고
단독 실행에서는 96ms 로 통과한다. 179파일 병렬의 부하를 타는 예산 시험이라 **CI 에서 간헐적으로
빨개질 자리**다. 이 판에서 배치 코드는 안 건드렸다.

## 남은 것 — 배선

`ingest.ts:517` 의 `writeUnits` 는 아직 디렉터리 규칙만 쓴다. 배선하려면 먼저 정해야 한다:

1. **03 §6.5 의 「1:1 이다」를 고친다** — 문서 갱신은 사용자가 한다.
2. 홈·`unit_node`·`clone.course_files_in_unit` 가 N:M 을 견디는지 본다.
   `unit_node` 는 `(unit_id, concept_id, track)` 이라 개념이 대지 여럿에 뜨는 것 자체는 된다.
3. `writeEdges`(231행)가 지금 개수만 돌려준다 — 해석한 엣지를 `writeUnits`(234행)에 넘겨야 한다.
   순서는 이미 맞다.