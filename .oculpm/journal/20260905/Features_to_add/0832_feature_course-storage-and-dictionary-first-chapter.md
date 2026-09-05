---
schema_version: 1
type: feature
slug: "course-storage-and-dictionary-first-chapter"
status: done
difficulty: medium
created_at: "2026-09-05T08:32:04+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/migrations/0007_course_chapter.sql"
    op: create
  - path: "fixtures/db/v0007.db"
    op: create
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/store-sql/src/rows.test.ts"
    op: update
  - path: "packages/concepts/src/course.ts"
    op: update
  - path: "packages/concepts/src/course.test.ts"
    op: update
related:
  - ref: "20260905/Features_to_add/0824_feature_course-builder.md"
    kind: "followup"
tags:
  - "D162"
  - "코스"
  - "마이그레이션"
  - "proto"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 앞 판이 남긴 둘 — 「`opts.first` 를 누가 채우나」와 코스가 저장될 곳

## 1. 그래프가 못 한 것을 사전이 했다

앞 판에서 「로그인이 1번」을 그래프 지표 셋으로 재현하려다 전부 실패했다. 공유 부품에 주인이
없어서 「남이 나에게 의존한다」가 폐포 의미론에서 성립하지 않기 때문이다.

**네 번째 지표를 만들지 않고 사전에 물었다.** 규약(`proto/`)의 근거 낱말이 가장 많이 보이는
챕터가 1번이다 — JWT·토큰을 다루는 기능이 먼저라는 규칙이고, 그 판단은 코드의 **모양**이 아니라
**무엇에 대한 코드인가**에서 온다.

실측: 근거 낱말 24개를 파일 114장에 대고 세니 **auth 가 1번으로 나왔다.**

```
1 auth 23 · 2 image(새로 3) · 3 ranking 8 · 4 fortune 15
5 dreamResult 12 · 6 dream 8 · 7 monthlyAnalysis 19 · 8 notice 26
```

**이 기능만의 파일에서만 센다.** 공유 파일로 세면 전부 동점이 된다 — `api.js` 하나에
`accessToken` 이 있고 그 파일은 여덟 챕터가 다 갖고 있다. R1(D163)에서 배운 것과 같은 함정이다.

## 2. 마이그레이션 0007

`chapter` + `stage_log` 둘. 진도 설계(`docs/program/mastery.md`)의 DDL 을 그대로 썼다.

- **`chapter` 는 `unit` 과 1:1** — 챕터가 곧 기능이고 기능은 이미 `unit` 이다(D160). 새 정체성을
  만들면 `unit_file`·`unit_node` 가 가리킬 곳이 둘이 된다.
- **재검 열이 `mastery` 와 같은 이름**이라 `fsrs.ts` 를 그대로 부른다 — 새 알고리즘이 0이다.
- `unit.source` 의 CHECK 를 넓히는 대신 `chapter.origin` 을 뒀다 — 0005 가 겪은
  「외래키 끄고 아홉 표 확인」(D146)을 다시 안 부른다.
- **`mastery`·`review_log` 는 한 열도 안 바뀐다.** 겹과 FSRS 는 1·2단 어휘 판정기로 그대로 산다.

## 시드가 가르쳐 준 것

`migrate-seed.test.ts` 가 마이그레이션마다 시드 DB 하나를 요구한다(06 §6.1). 처음에 빈 DB 에
1~7 을 적용해 만들었더니 **「행 수가 이행 뒤에도 그대로다」가 0 > 0 으로 떨어졌다** — 행이 없으면
보존을 잴 수가 없다. 시드의 뜻이 「그때의 앱이 실제로 쓴 바이트」라 `v0006.db` 에 0007 만 얹어
데이터를 이고 가게 했다. 그 파일의 주석이 이미 그렇게 적어 뒀고, 시험이 그것을 강제했다.

`rows.test.ts` 의 「마이그레이션이 33개 테이블을 만든다」도 35 로 올렸다.

## 검증

`pnpm test:unit` **180파일 / 2,059건 전량 통과**(두 번 연속, 새 시험 3) ·
`cargo test --workspace` 19개 스위트 ok · `typecheck`·`lint` 무출력 ·
`v0007.db` `integrity_check` ok · user_version 6 → 7.

## 남은 것

`docs/program/README.md` §7 의 둘 — 문항 체계 16유형과 `card.kind` 다섯 + `stage_no`,
그리고 `appeal.track` 확장(지금 `('t1','t2')` 라 4·5단 이의가 저장이 안 된다).
그리고 **`chapter` 행을 쓰는 코드가 아직 없다** — `writeUnits` 옆에 `writeChapters` 가 붙어야 한다.