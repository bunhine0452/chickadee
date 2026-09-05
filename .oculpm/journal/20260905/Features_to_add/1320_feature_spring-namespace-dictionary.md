---
schema_version: 1
type: feature
slug: "spring-namespace-dictionary"
status: done
difficulty: high
created_at: "2026-09-05T13:20:40+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/dictionary/src/load.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "dictionary/spring/_lang.yaml"
    op: create
  - path: "dictionary/spring/dependency-injection.yaml"
    op: create
  - path: "dictionary/spring/bean-and-container.yaml"
    op: create
  - path: "dictionary/spring/component-scan.yaml"
    op: create
  - path: "dictionary/spring/bean-lifecycle.yaml"
    op: create
  - path: "dictionary/spring/configuration-binding.yaml"
    op: create
  - path: "dictionary/spring/proxy-and-aop.yaml"
    op: create
  - path: "dictionary/spring/transaction-propagation.yaml"
    op: create
  - path: "dictionary/spring/request-dispatch.yaml"
    op: create
  - path: "dictionary/spring/controller-mapping.yaml"
    op: create
  - path: "dictionary/spring/filter-vs-interceptor.yaml"
    op: create
  - path: "dictionary/spring/exception-handler.yaml"
    op: create
  - path: "dictionary/spring/bean-validation.yaml"
    op: create
  - path: "dictionary/spring/repository-pattern.yaml"
    op: create
  - path: "dictionary/spring/persistence-mapping.yaml"
    op: create
  - path: "dictionary/spring/connection-and-tx-boundary.yaml"
    op: create
  - path: "docs/curriculum/spring.md"
    op: create
related: []
tags:
  - "dictionary"
  - "spring"
  - "java"
  - "D176"
  - "framework-detect"
  - "mcp-tool"
---
[x] 프레임워크가 런타임에 하는 일을 개념으로 — `spring/` 열다섯 (D176)

## 추가 기능

`dictionary/spring/` 열다섯 장. D174 의 「답은 아니다」 중 ① 을 받는 판이다 — `java/` 21개는 전부
문법 표면이라 `@Transactional` 을 「애너테이션이라는 문법」으로 짚어 줄 수는 있어도 그것이
런타임에 무엇을 하는지는 못 가르쳤다.

- **핵심 일곱** — `dependency-injection` · `bean-and-container` · `component-scan` ·
  `bean-lifecycle` · `configuration-binding` · `proxy-and-aop` · `transaction-propagation`
- **웹 다섯** — `request-dispatch` · `controller-mapping` · `filter-vs-interceptor` ·
  `exception-handler` · `bean-validation`
- **데이터 셋** — `repository-pattern` · `persistence-mapping` · `connection-and-tx-boundary`

껍데기는 `cs/`·`proto/` 와 같다(`grammars: []` · `queries: []` · `universal: null` · `t0` ·
`essential: false` · 뜻 고르기 하나). `COMPUTED_NAMESPACES` 에 `'spring/'` 을 더했다.

**뒤의 둘이 이 사전의 이유다.** 표본 `MonggleMonggle` 의 `AuthService.java` 가 그 자리를 통째로
들고 있다 — 클래스에 `@Transactional`(27줄), `login()` 이 87줄에서 `this` 로 부르는
`resetDailyCoinIfNeeded` 가 112줄에서 `REQUIRES_NEW` 다. **적혀 있는데 아무 일도 안 한다.**
예외도 로그도 없다. 「애너테이션은 명령이다」를 열다섯 중 여덟의 `misconceptions` 에 넣었다.

`filter-vs-interceptor` 의 `rule` 은 「`permitAll` 은 인가를 면제하지 필터를 건너뛰지 않는다」다
(`chapter-login.md` 2-4 가 「가장 자주 틀리는 자리」로 꼽은 곳).

## 동작 흐름

**① 감지 게이트** — `react/`(D59)의 선례를 따르되 신호가 다르다. 자바에는 `package.json` 이 없어
`detect: { dependency }` 하나로는 못 잡는다. 스키마를 두 모양의 합집합으로 열고
`LoadOptions.manifests`(파일명 → 원문)를 더했다. `build.gradle`·`build.gradle.kts`·`pom.xml` 에
`spring-boot` 이 보이면 로드하고, 안 보이면 **아예 안 싣는다**. 판정은 `load.ts` 의 `detected` 하나.
이름을 목록으로 안 뽑고 글자만 보는 이유는 `implementation 'org.springframework.boot:…'` 를
이름으로 쪼개려면 Groovy·Kotlin·XML 세 문법을 읽어야 하기 때문이다.

**② 사용처 빌림** — 자기 캡처가 없으므로 근거 낱말이 보이는 블록과 자바 개념의 창에 얹힌다.
`evidence` 는 그 개념에서만 나오는 낱말로 좁혔다(`Propagation.`·`addFilterBefore`·
`@ExceptionHandler`·`resultMap`).

**③ 표본 실측**(`BACK/src`, java 99 · xml 9) — `@RequiredArgsConstructor` 29 · `@Valid` 계열 19 ·
`@Service` 계열 18 · `@RestController` 14 · `@Transactional` 13 · `@RequestMapping` 계열 13 ·
`readOnly =` 11 · `resultMap` 9 · `@Mapper` 9 · `@Bean` 5 · `@Value(` 4 · 필터 2 · 예외 처리기 2 ·
`Propagation.` 1 · 빈 생명주기 **0**. 0인 둘도 넣었다 — 목록을 리포 하나에 맞추지 않는다(D166 의
`java/for-loop` 이 0곳인데 넣은 것과 같다).

## 검증

`pnpm vitest`(임시 시험, 매니페스트를 넘겨 로드) — spring 개념 15장 로드 · `problems` 0 ·
`lintDict` 위반 0 · 선행 사이클 0 · `queries.length === 0 ⟺ isComputed` 통과 · 감지 게이트 3방향
(신호 없음/무관한 gradle → 미로드, `pom.xml` → 로드). `pnpm dict:schema` 재생성.
`pnpm typecheck` · `pnpm lint` 초록. `pnpm test:unit` 2,258 통과 / 9 실패 — 실패 아홉은 전부
범위 밖이다(`dictionary/java/**` 신규 파일 넷의 스키마·린트와 그로 인한 래칫 65→69 ·
`zero-chapter` 의 `java: 25/24` · `Masthead` · `t2-key`/`t2-perf` · `i18n/catalog`).
`dict.test.ts` 가 매니페스트를 안 넘겨 **CI 는 아직 이 사전을 안 본다** — 한 줄 변경이고 범위 밖이라
`docs/curriculum/spring.md` §3 에 적어 두었다.