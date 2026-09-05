---
schema_version: 1
type: feature
slug: "mybatis-mapper-edges"
status: done
difficulty: medium
created_at: "2026-09-04T23:20:01+09:00"
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
  - path: "dictionary/mybatis/_lang.yaml"
    op: create
  - path: "dictionary/mybatis/_imports.scm"
    op: create
  - path: "dictionary/mybatis/_blocks.scm"
    op: create
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.test.ts"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2248_feature_java-bottom-three.md"
    kind: "followup"
tags:
  - "D159"
  - "mybatis"
  - "xml"
  - "http-간선"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 「이 기능의 SQL 이 어디 사는가」 (D159 ⑤)

## 추가 기능

MyBatis 매퍼가 XML 이고 SQL 이 그 안에 산다. 그래서 로그인 경로가 `UserDao.java` 에서 **멈춰
있었다** — 정작 질의문은 그 옆 `UserMapper.xml` 에 있는데.

**해석기를 새로 만들지 않았다.** 매퍼의 속성값이 곧 자바 패키지 경로다 —
`namespace="com.ssafy.finalproject.model.dao.UserDao"` · `type="…entity.User"` ·
`resultType`·`parameterType`. `LANG_OF` 에서 `.xml → 'java'` 로 보내면 `resolveJava` 의
접미 일치가 그대로 푼다.

## `namespace` 만 방향이 반대다

글자는 매퍼가 DAO 를 가리키지만 **뜻은 반대**다 — 「이 인터페이스의 실체가 여기 있다」이고,
DAO 를 열면 그 SQL 이 여기 있다. 기능 경로가 DAO 에서 멈추지 않으려면 이 하나를 뒤집어야 한다.
`form: mapper-of` 로 갈라 내보내고 `resolve-imports.ts` 가 뒤집는다.
`type`·`resultType` 은 매퍼가 그 타입을 **쓰는** 것이라 그대로 둔다.

점 없는 값(`string`·`map`·`long` 같은 별칭)은 자바 파일로 안 풀려 **자연히** 간선이 안 선다.
이름으로 거르지 않았다 — 거르는 자리를 하나로 모으는 편이 규칙이 하나 더 늘어나는 것보다 낫다.

## 실측 — 경로가 SQL 까지 닿는다

```
authService.js → AuthController → AuthService → UserDao → UserMapper.xml
```

**auth 대지 18 → 19파일**, 리포 간선 **275 → 293**. 새로 든 하나가 `UserMapper.xml` 이다.

`_blocks.scm` 도 붙였다 — 매퍼의 T1 필사 단위는 **SQL 문 하나**이고 이름은 `id` 속성이다.
`UserMapper.xml` 에서 9개(`insertUser`·`findByLoginId`·`updateUser` …)가 잡히는데,
그 이름이 자바 DAO 의 메서드 이름과 **글자 그대로 같다.**

## 안 한 것

**SQL 어휘는 없다.** 매퍼 안의 SQL 을 `sql` 문법으로 읽으려면 `.vue` 와 같은 구간 지정이 필요하고,
그 전에 `#{param}` 이 tree-sitter-sequel 을 깨는지 확인해야 한다 —
`docs/curriculum/sql.md` 가 `:name` 자리표에서 같은 일이 일어나는 것을 이미 쟀다
(`binary_expression(field, ERROR, field)` 인데 캡처는 정상 매치된다).
지금 판은 **간선까지**다. `dictionary/sql/` 이 서면 그때 구간을 연다.

## 검증

`pnpm test:unit` **180파일 / 2,042건 전량 통과**(두 번 연속, 새 시험 4) ·
`cargo test --workspace` 19개 스위트 ok · `pnpm dict:lint` 13/13 · `typecheck`·`lint` 무출력 ·
Rust 예산 **2,407/2,800**(문법 한 줄 + Cargo 한 줄).

린트가 `_blocks.scm` 이 없다고 잡았다 — 언어마다 시스템 쿼리 둘을 요구하는 규칙이고, 그 덕에
매퍼의 필사 단위를 뭘로 볼지 정하게 됐다.