# 프레임워크 사전 · `spring/`

**결정 등록부** D176. 이 문서는 `dictionary/spring/**` 의 명세다.
정본 §4 의 「3부 프레임워크」와 `docs/program/chapter-login.md` 가 요구한 것을 받는 자리다.

---

## 1. 왜 새 네임스페이스인가

`java/` 21개는 전부 **문법 표면**이다. 클래스 선언·메서드 선언·접근 제어자·애너테이션.
그래서 `@Transactional` 을 만나면 「이름 앞에 붙는 표시」라는 것까지는 짚어 준다.
**그것이 무엇을 하는지는 못 가르친다.** 문법에 없기 때문이다 — 프록시도, 컨테이너도,
필터 순서도 실행할 때만 있다.

| 네임스페이스 | 무엇을 담나 | 어디에 듣나 |
|---|---|---|
| `java/` | 그 언어의 문법 | 모든 자바 리포 |
| `cs/` (D157) | 문법 아래의 기계 | 모든 리포 |
| `proto/` (D159) | 언어를 안 가리는 규약 | 모든 리포 |
| **`spring/` (신설)** | **프레임워크가 런타임에 하는 일** | **감지된 리포만** |

`cs/`·`proto/` 와 같은 통에 안 담은 이유가 마지막 열이다. 기계와 규약은 한 번 쓰면 어느 리포에서나
듣지만(정본 §5 의 티어 A), 프레임워크는 **그 프레임워크를 쓰는 리포에서만** 듣는다(티어 B).
한 통에 담으면 스프링을 안 쓰는 사람에게 프록시가 기계로 나간다.

### 실측 — 오늘 무엇이 안 읽히나

표본 `MonggleMonggle`(Spring Boot 3.5.8 · MyBatis, `BACK/src` 의 java 99 · xml 9).

| 코드에 있는 것 | 파일 | 오늘 걸리는 개념 |
|---|---|---|
| `@RequiredArgsConstructor` | 29 | `java/annotation` (「표시가 붙었다」까지) |
| `@Transactional` | 13 | 같음 |
| `@RestController` | 14 | 같음 |
| `resultMap` | 9 | 없음 (`.xml` 은 매퍼 간선만) |
| `@Mapper` | 9 | `java/annotation` |
| `addFilterBefore` | 1 | `proto/servlet-filter-chain` (규약까지) |

`java/annotation` 하나가 702곳을 「애너테이션」이라는 한 낱말로 덮고 있었다.
이 사전은 그 702곳을 **무엇을 하는 표시인가**로 가른다.

---

## 2. 껍데기 — `cs/`·`proto/` 와 같다

```yaml
grammars: []          # 짚을 노드가 없다
queries: []           # 그래서 .scm 도 없다
universal: null       # 프레임워크 개념에 보편형은 없다
framework: spring
track_default: t0
essential: false      # 문법 구멍 지도의 「필수 문법」이 아니다
```

문항은 **뜻 고르기 하나**뿐이다 — 지목형은 짚을 자리가, 빈칸형은 뚫을 구멍이 있어야 하는데
둘 다 없다(`proto/`·`cs/` 와 같은 이유).

**템플릿 변수를 안 쓴다.** `{{site.line}}` 은 빌린 창의 줄이라 그 줄이 그 개념을 짚는다는 보장이
없다. 창은 화면에 그대로 뜨고 문장은 프레임워크를 묻는다.

`COMPUTED_NAMESPACES`(`packages/dictionary/src/schema.ts`)에 `'spring/'` 을 더했다.
그 상수 하나가 린트·시험·미지 수(D173)를 함께 데려온다.

---

## 3. 감지 — 없는 리포에서는 아예 안 뜬다

`react/`(D59)의 선례를 그대로 따르되 신호가 다르다. 자바에는 `package.json` 이 없다.

```yaml
# dictionary/spring/_lang.yaml
framework: spring
detect:
  manifest: [build.gradle, build.gradle.kts, pom.xml]
  contains: spring-boot
```

`detect` 가 `{ dependency }` 하나뿐이었으므로 스키마를 두 모양의 합집합으로 열고
`LoadOptions.manifests`(파일명 → 원문)를 더했다. 판정은 `load.ts` 의 `detected` 하나다.

**이름을 목록으로 안 뽑고 글자만 본다.** `build.gradle` 의 의존성 표기가
`implementation 'org.springframework.boot:spring-boot-starter-web'` 이라 이름만 떼려면
Groovy·Kotlin·XML 세 문법을 읽어야 하고, 그것은 감지가 할 일이 아니다.

### 아직 안 이어진 자리

| 무엇 | 자리 | 없으면 |
|---|---|---|
| 매니페스트를 읽어 넘기기 | `packages/concepts/src/ingest.ts` · `apps/desktop/src/flow.ts` | 앱에서 `spring/` 이 영영 안 뜬다 |
| 린트가 `spring/` 을 보게 하기 | `packages/dictionary/src/dict.test.ts:13` | CI 가 이 사전을 안 본다 |

둘 다 한 줄이고 둘 다 이 문서 밖(다른 세션 범위)이다. `flow.ts` 는 `dependencies: []` 를 하드코딩해
두어 **`react/` 도 같은 상태**다 — 새로 생긴 구멍이 아니라 이미 있던 구멍이 하나 늘었다.

---

## 4. 개념 열다섯

정본 §4 의 3부 목록 일곱에, `chapter-login.md` 가 요구한 여덟을 더했다.

### 4.1 핵심 — 일곱

| id | 이름 | 난이도 | 선행 | 근거 낱말 | 표본 파일 |
|---|---|---|---|---|---|
| `dependency-injection` | 필요한 것을 밖에서 받기 | 2 | — | `@RequiredArgsConstructor`·`@Autowired`·`@Inject`·`@Qualifier`·`ObjectProvider` | 29 |
| `bean-and-container` | 스프링이 들고 있는 객체 | 2 | `dependency-injection` | `@Bean`·`@Configuration`·`@Primary`·`getBean(`·`ApplicationContext` | 5 |
| `component-scan` | 패키지를 훑어 빈을 찾기 | 2 | `bean-and-container` | `@Component`·`@Service`·`@Repository`·`@ComponentScan`·`@SpringBootApplication` | 18 |
| `bean-lifecycle` | 빈이 태어나고 죽는 순서 | 3 | `bean-and-container` | `@PostConstruct`·`@PreDestroy`·`InitializingBean`·`DisposableBean`·`afterPropertiesSet`·`@Scope`·`@Lazy`·`initMethod` | **0** → `examples` 2 |
| `configuration-binding` | 설정 파일의 값이 코드로 들어오는 길 | 2 | `bean-and-container` | `@Value(`·`@ConfigurationProperties`·`@PropertySource`·`@Profile`·`Environment` | 4 |
| `proxy-and-aop` | 내 객체 대신 나가는 프록시 | 4 | `bean-and-container`·`cs/dynamic-dispatch` | `@Transactional`·`@Aspect`·`@Around`·`@Async`·`@Cacheable`·`@EnableAspectJAutoProxy`·`AopContext` | 13 |
| `transaction-propagation` | 이미 열린 트랜잭션을 만났을 때 | 5 | `proxy-and-aop`·`cs/transaction-isolation` | `Propagation.`·`REQUIRES_NEW`·`propagation =`·`PROPAGATION_`·`NESTED` | 1 |

**뒤의 둘이 이 사전의 이유다.** 표본 리포 `AuthService.java` 가 그 자리를 통째로 들고 있다 —
클래스에 `@Transactional`(27줄), `login()` 이 87줄에서 `this` 로 `resetDailyCoinIfNeeded` 를 부르고,
그 메서드는 112줄에서 `@Transactional(propagation = Propagation.REQUIRES_NEW)` 다.
**적혀 있는데 아무 일도 안 한다.** 프록시를 안 지나서다. 예외도 로그도 없어서 읽어서는 안 보이고,
`chapter-login.md` 3-4 가 「가장 자주 틀리는 자리」로 꼽은 곳이다.

### 4.2 웹 — 다섯

| id | 이름 | 난이도 | 선행 | 근거 낱말 | 표본 파일 |
|---|---|---|---|---|---|
| `request-dispatch` | 요청 하나가 메서드까지 가는 길 | 3 | `proto/servlet-filter-chain` | `DispatcherServlet`·`@RestController`·`@Controller`·`@ResponseBody`·`HandlerMapping`·`HandlerAdapter` | 14 |
| `controller-mapping` | 주소를 메서드에 배정하기 | 2 | `request-dispatch`·`proto/http-method` | `@RequestMapping`·`@GetMapping`·`@PostMapping`·`@PutMapping`·`@DeleteMapping`·`@PathVariable`·`@RequestParam` | 13 |
| `filter-vs-interceptor` | 컨트롤러 앞에 서는 두 자리 | 4 | `request-dispatch`·`proto/servlet-filter-chain` | `OncePerRequestFilter`·`addFilterBefore`·`HandlerInterceptor`·`addInterceptors`·`preHandle`·`WebMvcConfigurer` | 3 |
| `exception-handler` | 던진 예외가 응답이 되는 자리 | 3 | `request-dispatch`·`proto/status-code` | `@ExceptionHandler`·`@RestControllerAdvice`·`@ControllerAdvice`·`ResponseStatusException`·`@ResponseStatus` | 1 |
| `bean-validation` | 들어온 값을 메서드 앞에서 검사하기 | 2 | `controller-mapping` | `@Valid`·`@Validated`·`@NotBlank`·`@NotNull`·`@Size(`·`BindingResult`·`MethodArgumentNotValidException` | 19 |

`filter-vs-interceptor` 의 `rule` 이 `chapter-login.md` 2-4 를 그대로 담는다 —
**「`permitAll` 은 인가를 면제하지 필터를 건너뛰지 않는다」**. 표본에서 로그인 요청은
`JwtAuthenticationFilter` 를 지난다. 헤더가 없어 조건이 거짓이라 아무 일도 안 하고 넘길 뿐이다.

`exception-handler` 는 §3-b 의 「타입으로 이어지는 간선」을 개념 쪽에서 받는다 —
`AuthService` 가 던지는 `UnauthorizedException` 과 `GlobalExceptionHandler:29` 를 잇는 것은
호출도 이름도 아니고 **타입**이다.

### 4.3 데이터 — 셋

| id | 이름 | 난이도 | 선행 | 근거 낱말 | 표본 파일 |
|---|---|---|---|---|---|
| `repository-pattern` | 저장소를 인터페이스 뒤에 두기 | 2 | `dependency-injection`·`cs/abstraction` | `@Mapper`·`@MapperScan`·`@Repository`·`JpaRepository`·`CrudRepository` | 9 |
| `persistence-mapping` | 표의 열과 객체의 필드를 맞춰 두기 | 3 | `repository-pattern` | `resultMap`·`parameterType`·`@Entity`·`@Column`·`columnPrefix`·`jdbcType` | 9 |
| `connection-and-tx-boundary` | 연결을 빌려 쓰는 구간 | 4 | `proxy-and-aop`·`cs/transaction-isolation` | `readOnly =`·`DataSource`·`SqlSessionFactory`·`PlatformTransactionManager`·`@EnableTransactionManagement`·`HikariDataSource` | 11 |

`persistence-mapping` 은 **MyBatis 의 `resultMap` 과 JPA 의 엔티티를 한 개념의 두 모양**으로 쓴다.
짝짓는 자리가 XML 표냐 클래스 표시냐가 다를 뿐 하는 일이 같고, 갈라 두면 같은 개념을 두 번 배운다.
`chapter-login.md` 2-2 가 이 개념의 가장 좋은 문항이다 — 자바가 `.coin(5)` 로 넣은 값이
`UserMapper.xml:27` 에 자리가 없어 DB 에 안 간다.

### 4.4 표본에서 0인 것 — `bean-lifecycle` 은 합성 예제로 선다

`bean-lifecycle` 은 근거 낱말 여덟이 표본 리포에서 **전부 0곳**이다(`@PostConstruct`·`@PreDestroy`·
`InitializingBean`·`DisposableBean`·`afterPropertiesSet`·`@Scope`·`@Lazy`·`initMethod`). 낱말을
넓혀 푸는 길은 없다 — 이 리포의 빈은 전부 생성자 주입만 쓰는 무상태 서비스라 **여닫을 자원이 없다**.
넓히려면 `@Bean`·`@Configuration` 을 끌어와야 하는데 그것은 `bean-and-container` 의 자리이고,
생명주기와 무관한 줄을 짚게 된다.

그래서 **`examples[]` 두 장**을 달았다(D177 의 「네 코드엔 없다」 문). 첫 장은 순서 자체
(생성자 → 준비 신호 → 정리 신호)이고, 둘째 장은 `meaning[0]` 이 묻는 함정 — 생성자가 자기 클래스의
애너테이션 붙은 메서드를 부르는 모양이다. `makeAbsentCard` 로 실제로 구워 확인했다:
`kind = meaning` · `siteId = -1` · 본문이 예제 코드 여섯 줄.

**이 문이 열리려면 한 줄이 더 필요하다.** `packages/cards/src/t0-synthetic.ts` 의 `ABSENCE` 표에
`'spring/bean-lifecycle': 'scale'` 행이 없으면 부르는 쪽이 사유를 못 대서 카드를 안 만든다
(사유 없이 열리는 문은 두지 않는다는 D137 의 잠금). 사유가 `scale` 인 근거는 위 문단이다 —
이 규모에서는 여닫을 자원이 안 생겼다. 그 파일은 이 문서 밖(C6 범위)이다.

`connection-and-tx-boundary` 는 근거 낱말 여섯 중 `readOnly =` 하나만 걸린다(11파일).
목록을 리포 하나에 맞추지 않는 것은 그대로다 — `java/for-loop` 이 이 리포에서 0곳인데도 관문 0 에
든 것과 같은 이유(D166).

---

## 5. C3 가 자바에 달아야 할 `prereq`

빌림은 **언어 개념 쪽에서 건다**(D157 ②). `spring/` 은 자기 캡처가 없어서 자기를 `prereq` 로
가리키는 자바 개념의 창에 얹힌다. 이 표의 왼쪽이 `dictionary/java/*.yaml` 이고 오른쪽이
그 파일의 `prereq` 에 더할 것이다. **이 문서는 그 파일을 안 고친다** — C3 범위다.

| 자바 개념 | 더할 `prereq` | 왜 |
|---|---|---|
| `java/annotation` | `spring/proxy-and-aop` · `spring/component-scan` | 애너테이션이 「표시」에서 멈추지 않으려면 읽는 쪽이 선행이다. 702곳이 이 하나에 걸려 있다 |
| `java/interface` | `spring/repository-pattern` | 본문 없는 인터페이스가 도는 이유가 문법에 없다 |
| `java/constructor` | `spring/dependency-injection` | 롬복이 지운 생성자를 스프링이 부른다 (D166 ③ 의 뒤쪽) |
| `java/field-declaration` | `spring/dependency-injection` | `private final` 이 채워지는 자리 |
| `java/class-declaration` | `spring/component-scan` | 클래스가 빈이 되는 조건이 패키지 위치다 |
| `java/try-catch` | `spring/exception-handler` | 안 잡고 던지는 것이 여기서는 정상이다 |
| `java/static` | — | 없다. 정적 멤버는 컨테이너 밖이다 |

**주의 셋.**
① `packages/dictionary/src/dict.test.ts` 의 `cs/ 를 가리키는 언어 개념은 빌려 줄 창이 있다` 와 같은
규칙이 `spring/` 에도 걸리려면 가리키는 자바 개념 중 **적어도 하나는 쿼리가 있어야** 한다.
위 여섯은 전부 `.scm` 이 있다.
② `spring/` 은 `COMPUTED_NAMESPACES` 라 D173 대로 **미지 개념 수에서 빠진다** — 이 간선을 더해도
자바 개념의 첫 노출 순위는 안 밀린다.
③ **이 선행은 조건부다.** `cs/` 는 언제나 로드되지만 `spring/` 은 감지 게이트 뒤에 있어서,
스프링이 아닌 자바 리포에서는 위 여섯이 **존재하지 않는 id** 를 가리킨다. 미지 수는 ② 때문에 안
틀리지만 사다리 2단의 아래층 목록(`packages/cards/src/payload.ts` 의 `prereqOf`)은 못 찾은 id 를
**그 id 그대로 한 줄로 그린다** — 학습자 화면에 `spring/proxy-and-aop` 라는 글자가 개념 이름 자리에
뜬다. 그래서 `load.ts` 가 로드 끝에 `pruneDanglingRefs` 로 **로드된 사전에 없는 `prereq`·
`confusions` 를 떨군다.** 지우는 것이 아니라 거르는 것이라 스프링 리포에서는 그대로 걸린다.
**원문(`sources`)은 안 건드린다** — 린트의 `reference-exists` 가 오타를 잡는 자리가 거기이고,
두 곳에서 다 지우면 「오타라서 없다」와 「이 리포엔 그 사전이 없다」가 구별되지 않는다.
못박는 시험은 `dict.test.ts` 의 `로드 안 된 사전을 가리키는 선행은 떨어진다 (D176)` 다.

---

## 6. 빌림 기계가 아직 `spring/` 에 안 돈다

`packages/course/src/borrow.ts` 는 준비돼 있다 — `lenders(concepts, namespace = 'cs')` 가
네임스페이스를 인자로 받고, `pickLender`·`borrowedInput`·`evidenceBlock` 은 네임스페이스를 안 본다.

**부르는 쪽이 하드코딩돼 있다.** `packages/course/src/bake.ts` 두 자리다.

| 줄 | 지금 | 필요한 것 |
|---|---|---|
| `bake.ts:335` | `langOf(c.id) === 'proto'` 인 개념만 `evidenceBlock` 을 탄다 | `'spring'` 도 같은 가지를 타야 한다 |
| `bake.ts:345` | `lenders(dict.concepts)` — 기본값 `'cs'` | `lenders(dict.concepts, 'spring')` 한 바퀴가 더 필요하다 |
| `t0-synthetic.ts` 의 `ABSENCE` | `java/*` 일곱 행뿐 | `'spring/bean-lifecycle': 'scale'` (§4.4) |

**빌림으로도 `bean-lifecycle` 은 안 선다.** `lenders` 는 자기를 `prereq` 로 가리키는 언어 개념을
찾는데, §5 의 여섯 중 `spring/bean-lifecycle` 을 가리키는 자바 개념이 **없다**. 나머지 열넷은
근거 낱말이 걸리므로 `evidenceBlock` 가지로 서고, 이 하나만 합성 예제 문으로 선다.

지금 상태로는 **`spring/` 카드가 한 장도 안 구워진다.** 사전은 서 있고 큐도 D154 가 연 가지로 뜨지만
굽는 자리가 안 부른다. `packages/course/**` 는 다른 세션 범위라 이 문서는 자리만 적는다.

---

## 7. 정본과의 어긋남 하나

정본 §2 는 지식을 「네 층」으로 적고 목록은 다섯을 든다 —
어휘(`<lang>/`) · 기계(`cs/`) · 규약(`proto/`) · **프레임워크(`spring/`·`vue/`)** · 판단(`arch/`).
숫자가 하나 모자란다. 고치는 것은 사용자다(00 §7 인계 규칙).
