# Java 커리큘럼 조사

네임스페이스 `java` · 대상 파일 `docs/curriculum/java.md` · 조사일 2026-09-04.
사전(`dictionary/java/**`)은 아직 없다. 이 문서는 그것을 짜기 전의 판단 기록이다.

---

## §1 언어 좌표

TIOBE 2026-08 에서 **4위 8.25%**. 3위 C++(8.62%)과 0.37%p 차이고 1위 파이썬(18.53%)의 절반에 못 미친다.

만들어지는 것 — 서버 API(Spring Boot), 사내 배치, 안드로이드의 기존 코드(신규는 Kotlin 으로 넘어갔다),
데이터 인프라(Spark·Kafka·Elasticsearch 가 전부 JVM 이다).

### 바이브 코딩으로 나온 Java 는 어떻게 생겼나

LLM 에게 Java 로 앱을 만들라고 하면 거의 예외 없이 **Spring Boot** 가 나온다. 그래서 파일 하나가
이렇게 생긴다 — `package` 한 줄, `import` 열댓 줄, 클래스 위에 애너테이션 두세 줄
(`@RestController`·`@Service`·`@Entity`), 필드마다 `@Autowired` 나 `@Column`, 메서드마다
`@GetMapping`. 그다음이 비로소 Java 문법이다.

사용처가 실제로 어떻게 생기는지 정직하게 나누면 셋이다.

| 갈래 | 무엇이 여기 드나 | 사용처가 생기나 |
|---|---|---|
| **캡처되고 뜻도 Java 안에 있다** | `class` · 필드 선언 · 메서드 선언 · `private`/`public` · 생성자 · `new` · `List<…>` · for-each · `if` · `return` · 람다 · 스트림 · `try`/`catch` | 생긴다. 이것이 사전의 몸통이다 |
| **캡처는 되는데 뜻이 프레임워크에 있다** | 애너테이션 전부. `@GetMapping("/users")` 는 `annotation` 노드로 잡히지만 그것이 무슨 일을 하는지는 Java 문법 어디에도 없다 | 노드는 생긴다. 카드의 「왜」를 Java 로 못 쓴다 |
| **캡처가 아예 못 본다** | Lombok(`@Getter`·`@Builder`·`@RequiredArgsConstructor`)이 지운 생성자·게터. 그리고 요청이 `@RestController` 메서드에 닿기까지의 제어 흐름 | 안 생긴다. 소스에 없다 |

셋째 줄이 이 언어의 고유 문제다. 「내 코드가 교재」라는 전제가 Lombok 앞에서 처음 깨진다 —
생성자를 배우려고 리포를 뒤지면 `@RequiredArgsConstructor` 한 줄만 있고 생성자는 없다.

둘째 줄은 `react/` 가 이미 연 자리다(D59). `dictionary/react/_lang.yaml` 은 `framework: react` 와
`detect: { dependency: react }` 로 감지하고, 감지 실패한 리포에서는 사전을 아예 로드하지 않는다.
Java 에 같은 것을 하려면 `spring/` 네임스페이스가 필요하고 **감지 신호가 `package.json` 이 아니라
`pom.xml`/`build.gradle` 안의 `spring-boot-starter`** 다. 지금 `detect` 는 `{ dependency: <name> }`
한 모양뿐이라 모양을 늘려야 한다. 다만 늘리더라도 `spring/` 이 가르칠 수 있는 것은
「이 표시가 붙으면 이 메서드가 바깥에서 불린다」까지다. Spring 의 동작은 Java 문법이 아니다.

### 문법 키와 확장자

| 사전 `lang` | tree-sitter `grammar` | 확장자 |
|---|---|---|
| `java` | `java` | `.java` |

`lang` 과 `grammar` 가 우연히 같다(D19 의 예외가 아니라 우연이다 — `ts`↔`typescript` 처럼 갈릴 일이 없을 뿐).
`.jsh`(JShell)·`.jsp`·`.kt` 는 이 문법이 아니다.

---

## §2 기초 — 바닥 여덟

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `java/class-declaration` | 코드가 사는 상자 / Class declaration | `class` | `common/class-definition` **(신규)** | 1 | — | 실행되는 코드가 파일 맨 위에 올 수 없다. 그리고 `public` 클래스 이름은 **파일 이름과 같아야** 한다 — 클래스 이름을 고치면 파일 이름도 고쳐야 한다 |
| 2 | `java/variable-declaration` | 타입 붙여 이름 만들기 / Typed declaration | `int` | `common/variable-binding` | 1 | — | 이름 **앞에** 타입 낱말이 온다. `int x` 는 「x 는 정수만 담는다」는 약속이고 그 뒤로 못 바꾼다 |
| 3 | `java/assignment` | 이름에 값 다시 넣기 / Assignment | `=` | `common/reassignment` | 1 | `variable-declaration` | 넣는 것이 **식**이라 값을 낸다. 그래서 `a = b = 0` 이 되고, `boolean` 이면 `if (done = true)` 까지 통과한다 |
| 4 | `java/arithmetic` | 셈하기 / Arithmetic | `+` | `common/arithmetic` | 1 | — | `7 / 2` 가 `3` 이다. 정수끼리 나누면 소수를 **버린다** — 파이썬은 같은 자리에서 `3.5` 를 낸다 |
| 5 | `java/boolean-literal` | 참·거짓 값 / Boolean literal | `true` | `common/boolean-value` | 1 | — | `boolean` 은 숫자가 **아니다**. `true == 1` 도 `(int) true` 도 컴파일이 안 된다 — 파이썬의 `True + 1 == 2` 와 다르다 |
| 6 | `java/comparison` | 두 값 견주기 / Comparison | `==` | `common/comparison` | 1 | `boolean-literal` | `<`·`>` 는 숫자에만 쓴다. 글자를 견주려면 `<` 가 아니라 `compareTo` 이고, `==` 는 「같은 상자냐」를 묻는다 |
| 7 | `java/if-statement` | 조건으로 흐름 나누기 / if statement | `if` | `common/conditional-branch` | 1 | `comparison` | 조건 자리에 `boolean` **말고는 못 온다**. `if (list)`·`if (count)`·`if (name)` 은 전부 컴파일이 멈춘다 |
| 8 | `java/method-declaration` | 메서드 정의하기 / Method declaration | `void` | `common/function-definition` | 2 | `class-declaration` | 돌려줄 타입을 **이름 앞에** 미리 적는다. `void` 는 「안 돌려준다」는 뜻의 타입이고, 그 자리를 비울 수는 없다 |

### 「Hello World 에 클래스가 필요하다」를 어디까지 바닥에 넣었나

초심자가 보는 첫 화면은 `public static void main(String[] args)` 이고 그 다섯 낱말이 각각 다른
개념이다. 다섯이 이 문서에서 어디로 갔는지가 판단의 전부다.

| 낱말 | 어디로 | 깊이 |
|---|---|---|
| `void` | `java/method-declaration` — **바닥 여덟** | 1 |
| `public` | `java/access-modifier` — §3 | 2 |
| `static` | `java/static` — §3 | 2 |
| `String[]` | **개념으로 세우지 않았다.** 33개 어디에도 배열이 없다 | — |
| `args` | 개념으로 세우지 않았다. 매개변수는 `method-declaration` 안에서 다룬다 | — |

배열을 뺀 것은 실수가 아니라 자리가 없어서다(§5 의 24/24). Exercism Java 트랙은 `arrays` 를
깊이 낮은 자리에 두고 LLM Java 도 `String[]`·`int[]` 를 쓰므로 **다음 물결의 1순위**다.
다섯을 다 바닥 여덟에 넣으면 여덟 중 다섯을 첫 화면 해설에 쓰게 되고 `if`·`return`·셈하기가
밀려난다. 대신 **`java/class-declaration` 하나**를 바닥에 넣어 「모든 코드는 상자 안에 있다」만
세우고, `java/main-method` 는 §3 에 두되 **선행을 `method-declaration` 하나로만 매겨 깊이 2 에
앉힌다**(§5). 그 카드의 일은 다섯 낱말을 다 설명하는 것이 아니라 「넷은 나중에 배운다, 지금 알 것은
여기서 시작한다는 것 하나」를 말하는 것이다.

**Java 21+ 가 이 문제를 바꿨나 — 명세로는 바꿨고, 실물로는 안 바꿨다.**
JEP 512(Compact Source Files and Instance Main Methods)가 **Java 25 에서 정식 기능이 됐다**.
클래스 선언 없이 `void main() { … }` 만 적으면 컴파일러가 이름 없는 최종 클래스를 씌워 준다.
JEP 445(21 프리뷰) → 463(22) → 477(23) → 495(24) → 512(25 정식)의 5년짜리 경로였다.
그런데 우리 재료는 명세가 아니라 **LLM 이 실제로 뱉는 코드**이고, 그것은 여전히 Spring Boot 이고
여전히 `public static void main(String[] args)` 다. 그래서 절벽은 남는다. 다만 사전 산문의
`bridge` 에 쓸 문장이 하나 생겼다 — 「이 껍데기는 이제 언어가 요구하는 것이 아니라 **이 리포가
고른 것**이다」.

### 바닥에서 뺀 것과 그 이유

- **`while`** — 파이썬 바닥 여덟에는 있었다. Java 로 나오는 LLM 코드에서 `while` 은 드물고
  `for (int i…)`·for-each·스트림이 그 자리를 다 가져간다. §3 의 `java/for-loop` 에 `common/loop-while`
  을 붙여 전이는 살렸다.
- **`return`** — 「안 적으면 컴파일이 멈춘다」는 좋은 Java 사실이지만(파이썬은 조용히 `None` 을 보낸다)
  선행이 `method-declaration` 이라 깊이 2 다. 여덟 자리를 쓰지 않아도 0장에 든다. §3 으로 옮겼다.
- **`String` 리터럴** — 「작은따옴표는 글자 한 개」라는 Java 사실이 있어 개념으로는 서지만
  깊이 0 이라 여덟 자리를 안 써도 0장 맨 앞에 온다.

---

## §3 중심

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 · 없으면 왜 못 읽나 |
|---|---|---|---|---|---|---|---|
| 9 | `java/return-statement` | 값 돌려주기 / return | `return` | `common/return-value` | 2 | `method-declaration` | 타입이 `void` 가 아닌데 빠뜨리면 **컴파일이 멈춘다**. 파이썬은 조용히 `None` 을 보낸다 — 없으면 「값이 안 왔다」를 어디서 찾을지 모른다 |
| 10 | `java/main-method` | 프로그램이 시작하는 자리 / Entry point | `main` | `common/entry-point` **(신규)** | 2 | `method-declaration` | 다섯 낱말이 각각 다른 개념이고 지금 알 것은 하나다. 없으면 어느 파일부터 읽을지를 못 정한다 |
| 11 | `java/string-literal` | 글자 값 / String literal | `"` | `common/text-literal` | 1 | — | 큰따옴표만 글자 묶음이다. 작은따옴표는 **글자 한 개**(`char`)라 `'ab'` 는 오류다 |
| 12 | `java/string-concat` | `+` 로 글자 잇기 / String concatenation | `+` | `common/string-interpolation` | 2 | `string-literal` · `arithmetic` | Java 에는 **문자열 보간이 없다** — JEP 430 이 21·22 프리뷰로 나왔다가 23 에서 철회됐다(JDK-8329949). 그래서 `+` 하나가 더하기와 잇기를 겸하고 `1 + 2 + "a"` 는 `"3a"`, `"a" + 1 + 2` 는 `"a12"` 다 |
| 13 | `java/for-loop` | 세 칸짜리 되풀이 / for loop | `for` | `common/loop-while` | 2 | `assignment` · `comparison` | 괄호 안이 `;` 로 **세 칸**이다 — 시작 · 계속할 조건 · 매 바퀴 끝에 할 일. 없으면 `i` 가 어디서 늘어나는지를 못 찾는다 |
| 14 | `java/for-each` | 하나씩 훑기 / for-each | `:` | `common/iterate` | 2 | `variable-declaration` | `for (String s : list)` 의 `s` 는 **복사된 이름**이라 `s = …` 이 원본을 안 바꾼다. 도는 중에 `list.add` 를 하면 `ConcurrentModificationException` |
| 15 | `java/field-declaration` | 클래스가 지니는 값 / Field declaration | — | `common/class-field` **(신규)** | 2 | `class-declaration` · `variable-declaration` | 필드는 안 적어도 `0`·`false`·`null` 을 **자동으로** 받고 지역 변수는 안 받는다. 문법이 완전히 같은데 규칙이 다르다 |
| 16 | `java/new-expression` | 상자 새로 만들기 / Object creation | `new` | `common/instantiation` **(신규)** | 2 | `class-declaration` | `new` 가 상자를 만들고 이름은 그 상자를 **가리키기만** 한다. 이름을 넘겨도 상자는 복사되지 않는다 |
| 17 | `java/constructor` | 만들 때 한 번 하는 준비 / Constructor | — | `common/constructor` **(신규)** | 2 | `new-expression` · `field-declaration` | 이름이 클래스와 같고 **반환 타입 칸이 없다**. 하나도 안 적으면 빈 것을 공짜로 주고, 하나라도 적으면 그 공짜가 사라진다 |
| 18 | `java/null` | 가리키는 것이 없음 / null | `null` | `common/absent-value` | 2 | `new-expression` | 값이 아니라 **가리키는 데가 없다**는 표시다. `int` 같은 원시 타입에는 못 들어가고, 그것에 점을 찍으면 `NullPointerException` |
| 19 | `java/reference-equality` | 같은 상자냐 같은 내용이냐 / `==` vs `equals` | `.equals` | `common/reference-identity` **(신규)** | 3 | `new-expression` · `comparison` | 글자가 똑같은 두 `String` 이 `==` 로 거짓일 수 있다. 없으면 「분명히 같은데 왜 안 같지」에서 멈춘다 |
| 20 | `java/static` | 클래스에 하나뿐인 것 / static | `static` | `common/static-member` **(신규)** | 3 | `field-declaration` · `method-declaration` | 상자마다가 아니라 **클래스에 하나**다. 그 안에는 `this` 가 없어서 인스턴스 필드를 이름만으로 못 읽는다 |
| 21 | `java/access-modifier` | 누가 볼 수 있나 / Access modifiers | `private` | `common/access-control` **(신규)** | 2 | `class-declaration` · `field-declaration` | `private` 은 객체가 아니라 **클래스** 단위다 — 같은 클래스의 *다른* 인스턴스의 `private` 도 읽힌다 |
| 22 | `java/collection-generic` | 담는 상자와 그 안의 타입 / Typed collections | `List<` | `common/list` | 3 | `new-expression` · `variable-declaration` | `List<String> xs = new ArrayList<>();` — 왼쪽은 「무엇으로 쓸지」(인터페이스), 오른쪽은 「무엇으로 만들지」(구현)다. `<>` 는 왼쪽에서 베껴 온다 |
| 23 | `java/inheritance-override` | 물려받아 다시 쓰기 / Inheritance and `@Override` | `extends` | `common/inheritance` **(신규)** | 3 | `class-declaration` · `method-declaration` | `@Override` 는 **강제가 아니라 검사**다. 안 붙여도 재정의되고, 붙이면 이름 오타를 컴파일러가 잡는다 |
| 24 | `java/interface` | 할 줄 아는 것의 목록 / Interface | `interface` | `common/interface-contract` **(신규)** | 3 | `class-declaration` · `method-declaration` | `implements` 라고 **적어야만** 그 이름으로 받을 수 있다 — 메서드 모양이 맞아도 안 적었으면 안 된다(Go 와 정반대) |

---

## §4 심화

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 25 | `java/try-catch` | 터진 것을 받아 잇기 / try-catch | `catch` | `common/try-catch` | 3 | `inheritance-override` | 잡을 것을 **타입으로** 적는다. 무엇이 잡히는지가 예외 클래스의 **상속 관계**로 정해져 `catch (Exception e)` 가 거의 다 삼킨다 |
| 26 | `java/checked-exception` | 문법이 시키는 예외 처리 / Checked exceptions | `throws` | `null` | 4 | `try-catch` | 잡거나 `throws` 로 넘기거나 **둘 중 하나를 문법이 강제**한다. 주류 언어 중 Java 만 그렇고, 그래서 LLM 코드에 뜻 없는 `try { … } catch (Exception e) { }` 가 쌓인다 |
| 27 | `java/autoboxing` | 원시 값과 상자 값 / Autoboxing | `Integer` | `null` | 4 | `null` · `collection-generic` | `int` 와 `Integer` 가 소리 없이 오간다. `List<int>` 는 못 쓰고 `List<Integer>` 만 되며, `null` 인 `Integer` 를 `int` 에 넣는 순간 그 줄에서 NPE 가 난다 |
| 28 | `java/generics-erasure` | 타입 자리 비워 두기와 지워짐 / Generics and erasure | `<T>` | `common/generics` | 4 | `collection-generic` | 각괄호 안은 **컴파일 때만** 있다. 실행 때 `List<String>` 과 `List<Integer>` 는 같은 상자라 `instanceof List<String>` 을 못 쓰고 `new T[]` 도 못 만든다 |
| 29 | `java/equals-hashcode` | 「같다」를 직접 정하기 / equals and hashCode | `hashCode` | `common/equality-contract` **(신규)** | 4 | `reference-equality` · `inheritance-override` | 둘은 한 쌍이다. `equals` 만 고치고 `hashCode` 를 놔두면 `HashMap`·`HashSet` 이 방금 넣은 것을 못 찾는다 |
| 30 | `java/lambda` | 값이 된 메서드 / Lambda | `->` | `common/function-value` | 3 | `interface` | 람다는 **메서드가 하나뿐인 인터페이스**의 짧은 표기다 — 그래서 받는 자리마다 타입 이름이 다르다(`Runnable`·`Function`·`Predicate`). 바깥 지역 변수는 다시 안 넣는 것만 담을 수 있다 |
| 31 | `java/stream-pipeline` | 줄줄이 이어 훑기 / Stream pipeline | `.stream()` | `common/map-transform` | 4 | `lambda` · `collection-generic` | `.filter().map()` 만 적으면 **한 번도 안 돈다**. `collect`·`forEach` 같은 끝내는 연산이 붙어야 그때 한 번에 흐른다 |
| 32 | `java/final` | 다시 못 넣는 이름 / final | `final` | `common/immutable-binding` **(신규)** | 3 | `reference-equality` | **참조**를 못 바꿀 뿐이다. `final List<String> xs` 여도 `xs.add(…)` 는 된다 |
| 33 | `java/annotation` | 코드에 붙인 표시 / Annotations | `@` | `null` | 4 | `interface` · `method-declaration` | 애너테이션은 실행되는 코드가 **아니다**. 누군가 읽어 주기 전까지 아무 일도 안 하고, 그 「누군가」는 Java 가 아니라 Spring 이다 |

---

## §5 prereq 그래프와 0장 적재량

`ZERO_CHAPTER_MAX = 24` · `ZERO_CHAPTER_MAX_DEPTH = 2`(`packages/concepts/src/zero-chapter.ts`).

| 깊이 | 개수 | 개념 |
|---|---|---|
| 0 | 5 | `class-declaration` · `variable-declaration` · `arithmetic` · `boolean-literal` · `string-literal` |
| 1 | 7 | `assignment` · `comparison` · `method-declaration` · `string-concat` · `for-each` · `field-declaration` · `new-expression` |
| 2 | 12 | `if-statement` · `return-statement` · `main-method` · `for-loop` · `constructor` · `null` · `reference-equality` · `static` · `access-modifier` · `collection-generic` · `inheritance-override` · `interface` |
| 3 | 7 | `try-catch` · `autoboxing` · `generics-erasure` · `equals-hashcode` · `lambda` · `final` · `annotation` |
| 4 | 2 | `checked-exception` · `stream-pipeline` |

**깊이 ≤ 2 = 24개.** 설계한 33개 중 24개다. TS 21/24, 파이썬 19/24 였으니 Java 는 **상한을 정확히 채운다**.

왜 이 수치가 나왔나 — Java 의 뿌리가 넓기 때문이다. 파이썬의 깊이 0 은 대부분 식(expression)
수준이지만 Java 는 `class`·타입 붙인 선언이 선행 없이 깊이 0 에 서고, 그 둘에서 필드·메서드·`new`
가 한 걸음에 나온다. 「타입을 먼저 적는다」는 규칙이 개념 사이에 새 선행을 만들지 않고
**같은 층에 여러 개를 나란히 놓는다**.

**그런데 이 수치는 마진이 0 이다.** 24/24 라 자르는 규칙이 한 번도 일하지 않고, 개념 하나만
더해도 그때부터 「무엇을 자를까」가 임의의 문제가 된다(D147 이 상한 8·깊이 1 을 고를 때 피하려던
바로 그 상태다). 실제로 사전을 짤 때는 `java/array`(§2 가 미룬 `String[]`)·`java/method-call`·
`java/field-access`·`java/ternary`·`java/number-literal`·`java/switch` 가 더 붙고 전부 깊이 ≤ 2 다.
그래서 **한 개라도 더하기 전에 깊이 2 의 12개 중 무엇을 3 으로 내릴지를 먼저 정해야 한다.**
후보는 `static`(필드와 메서드 둘 다 선행) 과 `interface`(`inheritance-override` 를 선행으로 내리면
3 이 된다) 다.

### 끊은 사이클 둘

- `class-declaration` ↔ `method-declaration` — 돌아가는 클래스에는 메서드가 있어야 하고, 메서드는
  클래스 안에만 산다. **`method-declaration ← class-declaration` 한 방향**으로 끊었다. 읽는 순서가
  바깥에서 안이기 때문이다.
- `new-expression` ↔ `constructor` — 생성자를 이해하려면 `new` 를 알아야 하고, `new` 가 하는 일이
  생성자를 부르는 것이다. **`constructor ← new-expression`** 으로 끊었다. `new Foo()` 는 생성자를
  안 적어도 돌아가지만 생성자는 `new` 없이 뜻이 없다.

`java/main-method` 는 사슬을 **일부러 짧게** 잡았다. `static`·`String[]` 을 선행에 넣으면 깊이 4 가
되어 「초심자가 보는 첫 화면」이 0장에서 빠진다. 선행을 `method-declaration` 하나로 두어 깊이 2 에
앉히고, 나머지 넷은 카드의 `bridge` 로 예고한다(D137 의 「예고할 자리가 없으면 만들지 않는다」를
뒤집어 쓴 자리다 — 예고할 자리가 여기다).

---

## §6 `common/` 재사용 대 신규

### 재사용 — 18개

| `java/…` | → `common/…` | | `java/…` | → `common/…` |
|---|---|---|---|---|
| `variable-declaration` | `variable-binding` | | `for-loop` | `loop-while` |
| `assignment` | `reassignment` | | `for-each` | `iterate` |
| `arithmetic` | `arithmetic` | | `collection-generic` | `list` |
| `boolean-literal` | `boolean-value` | | `null` | `absent-value` |
| `comparison` | `comparison` | | `try-catch` | `try-catch` |
| `if-statement` | `conditional-branch` | | `lambda` | `function-value` |
| `method-declaration` | `function-definition` | | `generics-erasure` | `generics` |
| `return-statement` | `return-value` | | `stream-pipeline` | `map-transform` |
| `string-literal` | `text-literal` | | `string-concat` | `string-interpolation` |

**기존 30개 중 18개(60%)를 물려받는다.** 파이썬은 21/30(70%)이었다. 설계한 33개 기준으로는 55% 다.

두 자리는 설명이 필요하다.
- `for-loop → loop-while` — 세 칸 중 가운데가 「참인 동안」이라 전이의 뜻이 맞는다. `java/while-loop`
  을 따로 만들면 같은 universal 을 둘이 나눠 갖게 되므로 지금은 만들지 않는다.
- `string-concat → string-interpolation` — Java 에 보간이 없으니 표기는 다르지만 하는 일이 같다.
  D4 의 전이는 「표기 차이」 카드를 먼저 띄우므로 이 짝이 오히려 잘 맞는다.

`stream-pipeline` 은 `.filter` 와 `.map` 을 한 개념에 묶어 universal 을 하나만 골랐다. 사전을 실제로
짤 때는 TS 가 `array-filter`/`array-map-immutable` 로 갈라 둔 것처럼 **`java/stream-filter` →
`common/filter-select`** 를 따로 내야 한다.

### 쓰이지 않는 `common/` — 12개, 그중 넷은 Java 에 없다

`function-call`·`member-access`·`conditional-expression`·`number-literal`·`mutating-append`·
`filter-select`·`nullish-default`·`promise-chain` 여덟은 개념 목록을 늘리면 붙는다.
남는 넷이 이 언어의 구멍이다.

| `common/…` | Java 사정 |
|---|---|
| `optional-chaining` | **`?.` 가 없다.** `a != null && a.b != null && …` 를 손으로 쓴다. 우리가 지원할 언어 중 이것이 아예 없는 첫 언어다 |
| `async-await` | **`async`/`await` 가 없다.** Java 21 의 가상 스레드는 「기다리는 코드를 그냥 쓰라」는 반대 방향의 답이라 전이시키면 틀린 모형을 물려준다 |
| `destructuring` | 레코드 패턴(Java 21)이 `switch`·`instanceof` 안에서만 된다. 변수 선언에서는 못 쓴다 |
| `copy-with-changes` | 레코드에 `with` 문법이 없다. 생성자를 다시 부르는 수밖에 없다 |

### 신규 제안 — 12개

**Java 가 `common/` 을 크게 늘리라고 요구하는 첫 언어다.** 이유가 분명하다 — 기존 30개는 TS 와
파이썬에서 뽑혔고 둘 다 **클래스 없이 앱을 짤 수 있는** 언어다. Java 는 클래스가 선택이 아니라
문법이라 OOP 축 여덟이 통째로 비어 있었다. 여덟은 Swift·Dart·Kotlin 이 그대로 물려받는다.

| 제안 id | name.ko / en | diff | 다른 언어 근거(최소 2) |
|---|---|---|---|
| `common/class-definition` | 이름 붙인 틀 만들기 / Class definition | 2 | py `class` · ts `class` · dart `class` · swift `class` |
| `common/instantiation` | 틀에서 상자 하나 만들기 / Instantiation | 2 | py `Foo()` · ts `new Foo()` · swift `Foo()` · dart `Foo()` |
| `common/class-field` | 상자마다 지니는 값 / Object field | 2 | py `self.x` · ts `class { x = 1 }` · dart · swift |
| `common/constructor` | 만들 때 한 번 하는 준비 / Constructor | 2 | py `__init__` · ts `constructor` · swift `init` · dart |
| `common/inheritance` | 물려받아 고쳐 쓰기 / Inheritance | 3 | py `class B(A)` · ts `extends` · dart · swift |
| `common/interface-contract` | 할 줄 아는 것의 목록 / Interface | 3 | ts `interface` · go `interface` · swift `protocol` |
| `common/static-member` | 틀에 하나뿐인 것 / Static member | 3 | ts `static` · dart `static` · swift `static` |
| `common/access-control` | 밖에서 못 보게 하기 / Access control | 2 | ts `private` · swift `private` · dart `_name` |
| `common/reference-identity` | 같은 상자인지 묻기 / Reference identity | 3 | py `is` · ts `===` · swift `===` · dart `identical()` |
| `common/immutable-binding` | 다시 못 넣는 이름 / Immutable binding | 2 | swift `let` · dart `final` · rs 기본값 |
| `common/equality-contract` | 「같다」를 직접 정하기 / Equality contract | 4 | py `__eq__`+`__hash__` · dart `==`+`hashCode` · rs `PartialEq`+`Hash` |
| `common/entry-point` | 프로그램이 시작하는 자리 / Entry point | 2 | go `func main` · rs `fn main` · dart `void main` |

### `universal: null` 로 둘 것 — 3개

| id | 왜 전이시키지 않나 |
|---|---|
| `java/checked-exception` | 잡거나 넘기거나를 **문법이 강제**하는 언어가 Java 말고 없다. 전이할 상대가 없다 |
| `java/autoboxing` | 원시 타입과 참조 타입의 이중성이 Java 의 것이다. 파이썬·TS 에는 원시 타입 자체가 없다 |
| `java/annotation` | 파이썬·TS 의 데코레이터는 **실행되는 함수**이고 Java 애너테이션은 **읽히기를 기다리는 표시**다. 전이시키면 「붙이면 뭔가 일어난다」는 틀린 모형을 1겹으로 물려준다 |

33 = 재사용 18 + 신규 12 + null 3.

---

## §7 `cs/` 로 밀어낼 것

문법이 아니라 기계·이론인 것. id 와 한 줄 정의, 그리고 **Java 의 어느 개념이 이것을 필요로 하는가**.

| 제안 `cs/` id | 한 줄 | 이것을 필요로 하는 Java 개념 |
|---|---|---|
| `cs/stack-and-heap` | 지역 변수가 사는 곳과 `new` 로 만든 것이 사는 곳이 다르다 | `new-expression` · `null` · `reference-equality` |
| `cs/value-and-reference` | 이름이 값을 담느냐, 값이 있는 데를 가리키느냐 | `reference-equality` · `for-each` · `final` |
| `cs/integer-width` | 정수는 정해진 비트 수를 쓰고 넘으면 되감긴다 (`int` 32 · `long` 64) | `arithmetic` · `autoboxing` |
| `cs/floating-point` | 소수는 2진 근사라 `0.1 + 0.2 != 0.3` 이다 | `arithmetic` |
| `cs/hashing` | 값 하나를 고정 크기 숫자로 줄이는 일과, 같은 값이 같은 숫자를 내야 하는 이유 | `equals-hashcode` |
| `cs/compile-time-and-run-time` | 컴파일 때 아는 것과 실행 때 아는 것이 다르다 | `generics-erasure` · `inheritance-override` · `checked-exception` |
| `cs/dynamic-dispatch` | 어느 몸이 불릴지가 실행 때 실제 상자를 보고 정해진다 | `inheritance-override` · `interface` |
| `cs/garbage-collection` | 아무도 안 가리키는 상자를 언제 치우나 | `new-expression` · `null` |
| `cs/character-encoding` | 글자 하나가 늘 저장 단위 하나는 아니다 — Java `char` 는 16비트 UTF-16 코드 단위라 이모지 하나가 `char` 둘이고 `"😀".length()` 가 `2` 다 | `string-literal` |
| `cs/laziness` | 계산을 적어만 두고 필요할 때 한 번에 흘린다 | `stream-pipeline` |

`cs/compile-time-and-run-time` 이 Java 에서 특히 무겁다 — 타입 소거·오버로드와 오버라이드·
선언 타입과 실제 타입이 전부 이 한 축에서 갈린다. Java 사전을 짜면서 `cs/` 를 하나만 만든다면 이것이다.

---

## §8 tree-sitter 현실

| 항목 | 값 | 확인 방법 |
|---|---|---|
| `grammar` 키 | `java` | `grammar.js` 의 `name: 'java'` |
| 크레이트 | `tree-sitter-java = "0.23"` → **0.23.5** (2024-12-21) | crates.io. 0.23.5 가 최신이고 그 뒤 릴리스가 없다 |
| **`grammar_abi`** | **14** | `v0.23.5` 태그의 `src/parser.c` 에서 `#define LANGUAGE_VERSION 14` 를 직접 읽었다. 파이썬과 같고 **TS(15)와 다르다** |
| 규모 | `STATE_COUNT 1385` · `SYMBOL_COUNT 320` · `TOKEN_COUNT 138` · 외부 스캐너 **없음** | 같은 파일 |
| 확장자 | `java: [.java]` | — |
| 등록 | `crates/parse/src/langs.rs` 의 표 한 줄 + `Cargo.toml` 의 `lang-java` feature | 파일 주석이 「한 줄 + 한 줄」이라고 적어 둔다 |

**선결 조건 하나 — `grammarSchema` 에 `java` 가 없다.** `packages/dictionary/src/schema.ts:29` 의 열거값은
`typescript · tsx · javascript · python · go · rust · swift · dart · sql` 아홉이다. 파이썬은 D152 때 이미
들어 있었지만 **Java 는 없다.** `_lang.yaml` 의 `grammars: [java]` 와 `extensions` 가 이 열거를 쓰므로
(`schema.ts:233`), 여기에 `'java'` 를 더하기 전에는 사전이 로드 단계에서 막힌다. 생성물
`dictionary/schema/concept.schema.json` 도 `pnpm dict:schema` 로 다시 내야 한다.

### 파싱 함정

**① `modifiers` 가 평평하다 — 애너테이션과 키워드가 한 노드에 섞인다.**

```
modifiers: repeat1(choice(_annotation, 'public', 'protected', 'private',
                          'abstract', 'static', 'final', 'sealed', …))
```

`@Autowired`·`public`·`static` 이 **같은 `modifiers` 노드의 형제**로 들어가고 필드 이름이 없다.
결과 둘 — (ㄱ) `static` 을 짚으려면 익명 노드로 `(modifiers "static" @pick.1)` 을 써야 하고,
(ㄴ) **형제 앵커 `.` 를 쓰면 안 된다.** 앵커를 걸면 애너테이션이 앞에 붙은 자리가 통째로 빠지는데,
Spring 코드는 전부 그런 자리다. 파이썬 `comparison` 이 앵커로 연쇄 비교를 잘라낸 것과 정반대로,
Java 에서는 **앵커가 잡아야 할 것을 잘라낸다**.

**② `@site` 가 애너테이션 줄부터 시작한다.** `method_declaration` 은 `optional(modifiers)` 로 시작하고
애너테이션은 그 안에 있다. Spring 컨트롤러 메서드는 애너테이션이 3~4줄이라 `site.line` 과 T1 코드
창이 그만큼 위로 밀린다. **`@site` 를 `name:` 필드 기준으로 잡거나 줄 계산에서 `modifiers` 를 빼야 한다.**

**③ `<` 의 모호성 — GLR 이 갈라지고 제네릭이 이긴다.** `PREC.GENERIC` 과 `PREC.REL` 이 **둘 다 10** 이고
`generic_type` 만 `prec.dynamic(PREC.GENERIC, …)` 이다. 그리고 `conflicts` 에
`[$.generic_type, $.primary_expression]` 과 `[$._unannotated_type, $.generic_type]` 이 들어 있다.
즉 `f(a<b, c>(d))` 처럼 Java 명세 자체가 모호한 자리에서 파서가 두 갈래로 갈렸다가 **제네릭 쪽을
고른다**. 우리 `comparison` 쿼리는 `(binary_expression operator: "<")` 로 잡으므로 제네릭이 이긴
자리에서는 사용처가 안 생긴다 — 이건 원하는 동작이다.

닫는 각괄호 쪽이 더 위험하다. `>>` 와 `>>>` 는 `binary_expression` 의 **단일 익명 토큰**이라
`Map<String, List<Integer>>` 의 끝을 렉서가 상태로 갈라야 한다. 이건 **추정이다** — 문법 원문으로는
갈릴 것으로 보이지만 실제 트리를 못 봤다. **확인할 것**: `cargo test -p chickadee-parse --test dictionary`
골든에 `Map<String, List<Integer>> m = new HashMap<>();` 와 `if (a < b && c > d)` 와 `f(a<b, c>(d))`
셋을 넣고 `ERROR` 노드가 없는지, `comparison` 사용처가 몇 개 잡히는지를 센다.

**④ 압축 소스 파일(JEP 512)이 이미 파싱된다.**

```
program: repeat($._toplevel_statement)
_toplevel_statement: choice($.statement, $.method_declaration)
```

v0.23.5 문법 원문에서 확인했다 — 클래스 없는 `void main() { … }` 이 `program` 바로 아래
`method_declaration` 으로 붙는다. 다만 **클래스 밖 필드는 `field_declaration` 이 아니라
`local_variable_declaration`** 으로 잡힌다(`statement` 갈래로 가므로). 같은 Java 필드가 파일 모양에
따라 다른 노드가 되는 것이다. LLM 이 압축 소스를 안 쓰니 실제로 걸릴 확률은 낮지만
`java/field-declaration` 쿼리는 두 노드를 다 보게 하고 `examples:` 에 한 줄 넣는다.

**⑤ `field_declaration` 과 `local_variable_declaration` 이 모양이 같다.** 둘 다
`optional(modifiers) type declarator_list ';'` 이고 노드 이름만 다르다(문맥이 가른다).
그래서 쿼리는 노드 이름만으로 안전하게 갈린다. **파이썬이 `assignment` 하나로 뭉친 자리를 Java 는
문법이 갈라 준다** — D152ⓐ 가 「없는 구별을 가르치지 않는다」로 하나로 묶은 것의 정반대라,
Java 에서는 `variable-declaration` 과 `assignment` 를 **갈라야** 한다. 선언은
`variable_declarator` 안의 `= value` 이고 재대입은 `assignment_expression` 이라 노드부터 다르다.

**⑥ 텍스트 블록이 `string_literal` 의 한 갈래다.** `string_literal: choice(_string_literal,
_multiline_string_literal)` 이라 `"""…"""` 도 같은 노드다. LLM 이 SQL·JSON 을 텍스트 블록에 넣으면
그 덩어리가 통째로 `java/string-literal` 사용처가 된다 — **길이 상한을 걸지 않으면 T1 코드 창(40줄)을
넘긴다.**

**⑦ `_imports.scm` 은 세 모양이다.** `import_declaration` 하나가 `import a.b.C;` ·
`import a.b.*;` · `import static a.b.C.d;` 를 다 담는다. 파이썬의 `from`/`static` 두 모양보다
하나 많다. T2 import 해석기는 **패키지 이름이 폴더 경로와 같아야 한다**는 Java 규칙을 쓸 수 있어
파이썬의 `__init__.py` 폴백 같은 것이 필요 없다.

---

## §9 오개념

`misconceptions:` 와 오답 `diag` 가 이 표를 그대로 쓴다. 항목 이름은 progmiscon.org 의 Java 목록
55건에서 **이름만** 가져왔다(D148 ⑤ 대로 산문은 안 가져온다). 「실제로는」 줄은 우리가 쓴다.

| # | 무엇을 믿나 | 실제로는 | 걸리는 개념 |
|---|---|---|---|
| 1 | `==` 가 내용을 견주고 `.equals` 는 상자를 견준다 | 반대다. `==` 는 「같은 상자냐」, `.equals` 는 클래스가 정한 「내용이 같냐」 — **안 정했으면 `.equals` 도 `==` 다** | `reference-equality` |
| 2 | `b = a` 가 상자를 복사한다 | 가리키는 곳만 복사된다. 그 뒤 `b.x = 1` 이 `a.x` 도 바꾼다 | `assignment` · `new-expression` |
| 3 | 지역 변수도 필드처럼 `0`·`null` 로 시작한다 | 필드만 그렇다. 지역 변수는 넣기 전에 읽으면 **컴파일이 멈춘다** | `field-declaration` |
| 4 | `final List<String> xs` 면 목록이 안 바뀐다 | 다시 **가리키지** 못할 뿐이다. `xs.add(…)` 는 된다 | `final` |
| 5 | `static` 메서드 안에서도 필드를 이름만으로 쓸 수 있다 | `static` 에는 상자가 없어 `this` 도 없다. 인스턴스 필드를 그냥 못 읽는다 | `static` |
| 6 | `private` 은 객체 하나에 갇힌다 | **클래스** 단위다. 같은 클래스의 *다른* 인스턴스의 `private` 도 읽힌다 | `access-modifier` |
| 7 | 생성자가 객체를 만들어 돌려준다 | `new` 가 만들고 생성자는 **이미 만들어진 것을 채우기만** 한다. 그래서 반환 타입 칸이 없다 | `constructor` |
| 8 | `null` 도 객체라 메서드를 부를 수 있다 | 가리키는 데가 없다는 표시다. 점을 찍으면 `NullPointerException` | `null` |
| 9 | 길이는 다 같은 방법으로 잰다 | 셋이 다르다 — 배열은 `length` **필드**, `String` 은 `length()` **메서드**, `List` 는 `size()` | `collection-generic` |
| 10 | 배열에 더 넣으면 커진다 | 크기가 만들 때 정해져 안 바뀐다. `ArrayList` 가 그 일을 대신한다 | `collection-generic` |
| 11 | `if (done = true)` 는 견주기다 | 넣고 나서 그 값을 조건으로 쓴다. Java 는 `boolean` 일 때**만** 이것을 통과시킨다 — `=`/`==` 실수가 살아남는 유일한 자리다 | `assignment` · `comparison` |
| 12 | `a && b` 는 `b` 를 언제나 계산한다 | `a` 가 거짓이면 `b` 는 실행되지 않는다. `if (s != null && s.length() > 0)` 이 성립하는 이유다 | `if-statement` · `null` |
| 13 | `Integer a = 1000, b = 1000;` 이면 `a == b` 가 참이다 | −128~127 만 캐시되어 참이고 그 밖은 거짓이다(JLS 5.1.7) | `autoboxing` · `reference-equality` |

1·5·6·7 은 Ragonis & Ben-Ari 의 장기 조사(2005, 초심자 OOP 이해)가 「클래스 대 객체 / 생성과
생성자 / 프로그램 흐름」 세 덩어리로 묶어 보고한 것과 겹친다. 우리 목록은 그 논문의 분류를
확인용으로만 쓰고 문장은 가져오지 않았다.

---

## §10 근거와 출처

| 무엇 | URL | 확인 상태 |
|---|---|---|
| Exercism Java 트랙 `config.json` (MIT · © 2021 Exercism) | `https://github.com/exercism/java/blob/main/config.json` | 확인. 개념 **26개** · 개념 연습 **23개**. 깊이 0~3 에 해당하는 것은 `basics · booleans · numbers · strings · arrays · for-loops · foreach-loops · if-else-statements · switch-statement · ternary-operators · classes · constructors · lists · generic-types · chars · exceptions`. **선행 간선은 안 가져왔다**(D148 ③) |
| tree-sitter-java 문법 원문 (v0.23.5 태그) | `https://github.com/tree-sitter/tree-sitter-java/blob/v0.23.5/grammar.js` | 확인. `program` · `modifiers` · `type_arguments` · `binary_expression` · `field_declaration` 규칙을 직접 읽었다 |
| tree-sitter-java `LANGUAGE_VERSION` | `https://github.com/tree-sitter/tree-sitter-java/blob/v0.23.5/src/parser.c` | 확인. **14** |
| crates.io `tree-sitter-java` | `https://crates.io/crates/tree-sitter-java` | 확인. 최신 0.23.5 (2024-12-21) |
| JEP 512 Compact Source Files and Instance Main Methods | `https://openjdk.org/jeps/512` | 확인. Java **25 에서 정식**. 445(21) → 463(22) → 477(23) → 495(24) 경로 |
| JEP 430 String Templates 철회 | `https://bugs.openjdk.org/browse/JDK-8329949` | 확인. JDK 23 에서 프리뷰 제거. Java 26(2026-03-17)까지 대체안 없음 |
| Java 26 JEP 목록 | `https://openjdk.org/projects/jdk/26/` | 확인. 10개 JEP. 언어 문법 변경 없음(`500` 준비 · `517` HTTP/3 · `530` 패턴의 원시 타입 4차 프리뷰) |
| TIOBE 2026-08 | `https://www.tiobe.com/tiobe-index/` | 확인(경유: TechRepublic 2026-08 기사). Java 4위 8.25% |
| progmiscon.org Java 오개념 55건 | `https://progmiscon.org/misconceptions/Java/` | 확인. **이름만** 참고. 재사용 라이선스가 없어 문장은 안 가져왔다(D148) |
| Ragonis & Ben-Ari, *A long-term investigation of the comprehension of OOP concepts by novices*, Computer Science Education 15(3), 2005 | `https://doi.org/10.1080/08993400500224310` | **초록 수준만 확인.** 본문 58개 항목의 원문은 못 봤다 — 분류(클래스 대 객체 / 생성과 생성자 / 프로그램 흐름)만 대조에 썼다 |
| `Integer` 캐시 −128~127 | JLS §5.1.7 | **확인 못 함(문서 원문 미열람).** 널리 알려진 사실이고 오개념 13 의 근거지만 사전에 넣기 전에 JLS 원문을 봐야 한다 |
| Spring Boot 이 LLM Java 출력의 기본값이라는 것 | — | **수치 없음.** 벤치마크로 확인하지 못했다. §1 은 관찰이지 측정이 아니다. `spring/` 네임스페이스를 실제로 만들기 전에 리포 표본으로 세야 한다 |
