---
schema_version: 1
type: feature
slug: "spring-lifecycle-and-conditional-prereq"
status: done
difficulty: medium
created_at: "2026-09-05T13:46:15+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/spring/bean-lifecycle.yaml"
    op: update
  - path: "dictionary/spring/dependency-injection.yaml"
    op: correct
  - path: "packages/dictionary/src/load.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/spring.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
related:
  - ref: "20260905/Features_to_add/1320_feature_spring-namespace-dictionary.md"
    kind: "followup"
tags:
  - "dictionary"
  - "spring"
  - "java"
  - "D176"
  - "D177"
  - "prereq"
  - "mcp-tool"
---
[x] 판이 0장이던 `bean-lifecycle` 과, 없는 사전을 가리키던 조건부 선행 (D176 후속)

## 추가 기능

C3 가 끝나며 돌아온 둘을 받았다.

**① `spring/bean-lifecycle` 이 판을 한 장도 못 세우던 것.** 근거 낱말을 여덟까지 넓혀
(`@PostConstruct`·`@PreDestroy`·`InitializingBean`·`DisposableBean`·`afterPropertiesSet`·
`@Scope`·`@Lazy`·`initMethod`) 다시 쟀는데 표본 리포에서 **여덟 다 0곳**이다. 더 넓히려면
`@Bean`·`@Configuration` 을 끌어와야 하고 그것은 `bean-and-container` 의 자리다 — 생명주기와
무관한 줄을 짚게 된다. 이 리포의 빈이 전부 생성자 주입만 쓰는 무상태 서비스라 **여닫을 자원이
없는 것**이 사실이므로 낱말로는 못 푼다.

그래서 `examples[]` 두 장을 달았다(D177 의 「네 코드엔 없다」 문). 첫 장은 순서 자체
(생성자 → 준비 신호 → 정리 신호), 둘째 장은 `meaning[0]` 이 묻는 함정 — 생성자가 자기 클래스의
애너테이션 붙은 메서드를 부르는 모양이다.

**② `java/` → `spring/` 선행이 조건부 참조가 된 것.** `cs/` 는 언제나 로드되지만 프레임워크
사전은 감지 게이트 뒤에 있다. 스프링이 아닌 자바 리포에서 `java/annotation.prereq` 의
`spring/proxy-and-aop` 는 **존재하지 않는 id** 이고, 사다리 2단의 아래층 목록
(`packages/cards/src/payload.ts` 의 `prereqOf`)은 못 찾은 id 를 `at?.name.ko ?? id` 로 **그 id
그대로 한 줄에 그린다** — 학습자 화면의 개념 이름 자리에 `spring/proxy-and-aop` 라는 글자가 뜬다.
원장의 `concept_prereq` 에도 없는 개념을 가리키는 행이 들어간다.

## 동작 흐름

**① 합성 예제** — `makeAbsentCard` 로 실제로 구워 확인했다: `kind = meaning` · `siteId = -1` ·
본문이 예제 코드 여섯 줄. `siteFromExample` 이 `expect.picks` 를 요구하므로 채웠고, 뜻 고르기에서는
쓰이지 않는다는 것을 파일 주석에 적었다. **문이 아직 잠겨 있다** — `t0-synthetic.ts` 의 `ABSENCE`
표에 `'spring/bean-lifecycle': 'scale'` 행이 없으면 부르는 쪽이 사유를 못 대서 카드를 안 만든다
(D137 의 잠금). 그 파일은 범위 밖이라 `docs/curriculum/spring.md` §4.4 에 적었다.

**② `pruneDanglingRefs`** — `load.ts` 의 `build()` 끝에서 `concepts` 의 `prereq`·`confusions`
중 로드된 사전에 없는 id 를 떨군다. **`sources` 는 안 건드린다** — 린트의 `reference-exists` 가
오타를 잡는 자리가 거기이고, 두 곳에서 다 지우면 「오타라서 없다」와 「이 리포엔 그 사전이 없다」가
구별되지 않는다. `dict.test.ts` 는 프레임워크 둘을 켜고 로드하므로 조건부 참조도 거기서 전부 보인다.
지우는 것이 아니라 거르는 것이라 스프링 리포에서는 그대로 걸린다.

**③ 곁가지 하나를 고쳤다** — `spring/dependency-injection` 의 `evidence` 에 `@AllArgsConstructor`
가 들어 있었는데 표본에서 **44파일**이 걸리고 전부 DTO 다. 롬복이 만든 값 객체의 생성자이지 주입이
아니라 `ObjectProvider` 로 갈았다(29파일). 넓은 낱말이 챕터를 동점으로 만든다는 D166 의 경고가
그대로 걸린 자리다.

## 검증

`pnpm dict:lint` 16/16 초록(부채 표 73/73 · 67/68 · 73/73 · 65/65 — 래칫 그대로).
`pnpm typecheck` · `pnpm lint` 초록. **`pnpm test:unit` 2,305 통과 · 0 실패**(직전 판의 실패
아홉은 C3 가 끝나며 사라졌다). 합성 판은 임시 시험으로 `makeAbsentCard`·`makeSyntheticCard`
둘 다 서는 것과, `examples` 가 없는 다른 `spring/` 개념은 안 서는 것(재료가 문이라는 것)을 확인했다.
표본 실측 다시: 열다섯 중 열넷이 근거 낱말로, `bean-lifecycle` 하나가 합성 예제로 — **15/15** 가
판이 설 재료를 갖췄다.