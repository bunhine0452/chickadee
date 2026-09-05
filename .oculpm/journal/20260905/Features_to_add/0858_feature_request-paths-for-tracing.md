---
schema_version: 1
type: feature
slug: "request-paths-for-tracing"
status: done
difficulty: medium
created_at: "2026-09-05T08:58:51+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/concepts/src/path.ts"
    op: create
  - path: "packages/concepts/src/path.test.ts"
    op: create
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.test.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
related:
  - ref: "20260905/Features_to_add/0841_feature_write-chapters-during-ingest.md"
    kind: "followup"
tags:
  - "D162"
  - "추적"
  - "기능-경로"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 「버튼을 누르면 어느 파일 어느 줄이 순서대로 도나」의 재료

## 추가 기능

`requestPaths(edges)` — 요청 하나마다 줄기 하나. 실측 리포에서 **37개**가 나오고
설계(`docs/program/course.md` §5)가 센 수와 같다.

로그인 줄기:
```
authService.js:21  →  AuthController.java → AuthService.java → UserDao.java → UserMapper.xml
```

프론트에서 시작해 **SQL 에서 끝난다.** 사용자가 물은 「이 기능 하나를 만들려고 어떤 코드들이
유기적으로 연결되어 있는가」가 이 다섯 칸이다.

## 두 번 고쳤고 두 번째가 중요하다

**① 간선에 줄이 없었다.** `ResolvedEdge` 에 `line` 을 더했다 — `import_edge` 에는 안 싣는다.
2단이 「어느 **줄**」을 묻는데 그 줄이 여기서만 나온다.

**② 기능당 한 줄기는 틀렸다.** 처음엔 `featurePath(entry)` 로 기능마다 하나를 냈는데,
실측하니 로그인 줄기의 첫 칸이 **`authService.js:12` = `api.post("/auth/signup")`** 이었다.
`authService.js` 가 같은 컨트롤러를 여섯 번 부르고 그 여섯이 로그인·회원가입·로그아웃…인데
간선 접기(`from|to|kind`)가 그것을 하나로 뭉갰다.

**HTTP 간선만 줄을 접기 키에 넣어** 호출 자리마다 다른 요청이 되게 했다. 정적 import 는
그대로 접는다 — 같은 파일을 두 번 import 해도 의존은 하나다.
그러자 8 → **37**이 됐고 21행이 로그인이 됐다.

## 남은 한계 — 적어 뒀다

**첫 칸만 요청별이고 꼬리는 기능별이다.** 간선이 파일 단위라 로그인과 회원가입이 둘째 칸부터
같은 줄기를 쓴다. 줄 번호도 그 요청을 처리하는 메서드가 아니라 **import 줄**이다
(`AuthController.java:20` 은 `import …AuthService` 다).

메서드 단위로 내리려면 호출 그래프가 필요하다. **실마리는 있다** — 매퍼의 `id="findByLoginId"`
가 DAO 메서드 이름과 글자 그대로 같고, `_blocks.scm`(D159)이 이미 그 이름을 잡는다.

## 검증

`pnpm test:unit` **2,067건 전량 통과**(두 번 연속, 새 시험 5) · `cargo test --workspace` 19개 ok ·
`typecheck`·`lint` 무출력.

`ResolvedEdge` 에 열이 하나 늘어 `toStrictEqual` 로 간선을 통째 비교하던 시험 셋이 걸렸고
`line` 을 기대값에 넣어 고쳤다 — 열을 늘리면 걸리게 해 둔 것이 옳다.