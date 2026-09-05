# Java 커리큘럼 — 정식 코스 3부

네임스페이스 `java` · 조사일 2026-09-04 · **3부로 재편 2026-09-05 (D177)**.

이 문서는 두 겹이다. **§2 가 코스의 정본**이고 — 무엇을 어느 부에서 어떤 교재로 가르치는가 —
§3~§5 는 그 부에 담기는 개념의 설계표, §6 이하는 그것을 짜기 전의 조사 기록이다.

> **2026-09-05 — 3부 앞에 0부 「이 언어의 값과 식」을 붙였다(§1.5).** 사용자 요청
> (「기초부터 심화까지 · 언어의 동작 원리부터 · 정수형·실수형·연산식」)이 지금 코스에 자리가
> 없어서다. 0부는 §8 이 초안으로 적어 둔 `cs/` 간선마다 판을 세우고, **1부에서 다섯 장 ·
> 「아직 안 세운 것」에서 세 장 · §5 심화에서 한 장**을 가져간다. **§1.5.4 가 0·1·2·3부 배치의
> 정본**이고 §2 의 부 배치는 그 뺄셈의 원본으로 남는다.
2026-09-05 개정에서 옛 「기초 / 중심 / 심화」 세 절이 §2 의 부 배치로 대체됐고 그 뒤 절 번호가
하나씩 밀렸다(옛 §5 → 지금 §6 …).

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

## §1.5 0부 「이 언어의 값과 식」 — 정식 코스 3부 앞에 붙는 부

**결정 등록부 초안 (번호 미정 — 오케스트레이터가 매긴다).** D177 이 세운 3부(바닥·객체·프레임워크)의
1부는 `class-declaration` 으로 시작해 `variable-declaration` → `assignment` → `arithmetic` 으로 간다.
**값이 무엇인지를 안 가르치고 값을 옮기는 문법부터 가르친다.** 사용자 요청은 「정수형·실수형·
연산식을 이해하고 말 그대로 언어를 이해한다는 느낌」이고, 그 자리가 지금 코스에 없다.

**자바에서 이 구멍이 가장 크다.** §3 의 `java/arithmetic` 규칙은 「`7 / 2` 가 `3` 이다. 정수끼리
나누면 소수를 **버린다**」이고, 이것은 **무슨 일이 일어나는지**의 답이지 **왜**의 답이 아니다.
왜의 답은 「`int` 는 32비트 정수 타입이고 두 `int` 의 연산 결과도 `int` 다」이며 그 문장은 자바 문법
어디에도 없다. 답은 `cs/` 43장(D157 · [`cs.md`](./cs.md))에 있고 **그 층은 이미 서 있다.**
§8 이 이미 열 개의 간선을 초안으로 적어 뒀다 — 0부는 그 간선마다 판을 하나씩 세우는 일이다.

**그리고 §2 의 「아직 안 세운 것」 표가 세 장을 여기서 해소한다** — `java/string-literal` ·
`java/reference-equality` · `java/string-concat`. 셋 다 「1·2부에 있어야 하는데 지금 없다」로 적혀
있었고, 세 장 모두 **값과 식**의 개념이라 0부가 제 자리다.

### §1.5.1 축 여덟 · 19판

각 행의 다섯 열이 이 부의 계약이다 — **어느 기계에 걸리나**(`cs/`) · **어떤 그림이 그것을 보이나**
(그림 계약은 I2 세션이 `design/system/diagrams.md` 에 만드는 중: 비트 배열 · 평가 트리 · 값 상자 ·
메모리 줄 · 스택 프레임 · 타입 변환 사다리) · **초보가 실제로 틀리는 자리**(문항의 씨앗) ·
**문항 형식**(형식 계약은 I1 세션이 `docs/program/fundamentals.md` 에 확정 중 — `value` 값 적기 ·
`step` 한 걸음씩 · `bits` 비트로 보기 · `table` 표 채우기 · `build` 거꾸로 만들기 ·
`predict` 예측 후 실행). **4지선다가 아니다.**

**출처 표시** — `1부↑` 는 §2 의 부 배치 1부 열셋에서 올라온 것, `대기↑` 는 §2 「아직 안 세운 것」에서,
`심화↑` 는 §5 에서, `신규` 는 이 절이 새로 세우는 것.

#### 축 A — 정수형과 그 한계 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/value-bits` **신규** | 값은 켜짐·꺼짐의 묶음이고, `int` 는 **정확히 32칸**이다 | `binary-representation` · `bit-and-byte` · `type` | 비트 배열 | 「`int` 의 크기는 컴퓨터마다 다르다」로 안다(C 에서는 맞지만 자바는 **명세가 고정**한다) | `bits` |
| `java/variable-declaration` `1부↑` | 이름 **앞에** 타입이 오고, 그 뒤로 못 바꾼다 | `type` · `static-vs-dynamic-typing` | 값 상자 | `var` 를 「타입이 없다」로 읽는다. 추론일 뿐이고 타입은 그 자리에서 못 박힌다 | `value` |
| `java/integer-limit` **신규** | 자리가 정해져 있어 **가장 큰 값 다음이 가장 작은 값**이다 | `integer-overflow` · `bit-and-byte` | 비트 배열 (자리가 도는 그림) | `Integer.MAX_VALUE + 1` 을 오류로 예상한다. 조용히 `-2147483648` 이 되고 아무도 안 막는다 | `bits` |

#### 축 B — 실수형과 왜 안 떨어지나 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/floating-type` **신규** | 실수 타입이 **둘**이고 리터럴의 기본은 `double` 이다 | `floating-point` · `bit-and-byte` | 비트 배열 (32칸 대 64칸) | `float f = 1.5;` 가 컴파일 안 되는 이유를 모른다 — `1.5` 는 `double` 이고 좁히기는 명시해야 한다(`1.5f`) | `bits` |
| `java/float-inexact` **신규** | `0.1 + 0.2 != 0.3` — 2진수로 `0.1` 을 정확히 못 적는다 | `floating-point` · `binary-representation` | 비트 배열 (부호·지수·가수) | 소수를 `==` 로 견준다. 돈 계산에 `double` 을 써서 1원이 사라진다 — 그래서 `BigDecimal` 이 있다 | `value` |

#### 축 C — 문자열과 인코딩 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/string-literal` `대기↑` | **큰따옴표만** 글자 묶음이다 | `text-encoding` | 값 상자 | `'ab'` 를 문자열로 쓴다. 작은따옴표는 **글자 한 개**(`char`)라 컴파일이 멈춘다 | `value` |
| `java/text-length` **신규** | `char` 은 16비트 코드 단위 **하나**다 — 글자 하나가 아니다 | `text-encoding` · `bit-and-byte` | 비트 배열 | `"😀".length()` 를 1 로 예상한다(실제 2). `'a' + 'b'` 가 `"ab"` 가 아니라 `195`(`int`) 다 | `value` |

#### 축 D — 참·거짓 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/boolean-literal` `1부↑` | `boolean` 은 숫자가 **아니다** | `type` | 값 상자 | `true == 1` 도 `(int) true` 도 컴파일이 안 된다. 파이썬의 `True + 1 == 2` 와 정반대다 | `value` |
| `java/boolean-only-condition` **신규** | 조건 자리에 `boolean` 말고는 **못 온다** | `static-vs-dynamic-typing` | 표 (세 언어 대조) | `if (list)` · `if (count)` · `if (name)` 을 쓴다. 파이썬·JS 습관이 그대로 넘어와 전부 그 자리에서 멈춘다 | `table` |

#### 축 E — 연산자와 우선순위 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/arithmetic` `1부↑` | 정수끼리 나누면 소수를 **버린다** — `7 / 2` 가 `3` 이다 | `integer-overflow` · `type` | 평가 트리 | `1 / 2 * 2.0` 을 `1.0` 으로 예상한다. `1 / 2` 가 먼저 `0` 이 되어 답은 `0.0` 이다. **버림은 0 쪽**이라 `-7 / 2` 가 `-3` 이다(파이썬 `//` 는 `-4`) | `step` |
| `java/operator-precedence` **신규** | `2 + 3 * 4` 가 어떤 순서로 접히나. `&&` 는 **단락 평가**한다 | — | 평가 트리 | `if (s != null && s.length() > 0)` 의 두 항을 바꿔도 된다고 믿는다. 바꾸면 NPE 다 | `step` |
| `java/string-concat` `대기↑` | `+` 가 더하기와 잇기를 겸하고 **왼쪽부터** 접힌다 | `text-encoding` | 평가 트리 | `1 + 2 + "a"` 는 `"3a"` 인데 `"a" + 1 + 2` 는 `"a12"` 다. 자바에는 문자열 보간이 없어(JEP 430 철회) 이 자리를 피할 수 없다 | `step` |

#### 축 F — 형 변환 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/implicit-conversion` **신규** | 좁은 타입 → 넓은 타입은 **자동**이다 (`int` → `long` → `float` → `double`) | `type` | 타입 변환 사다리 | `int` 를 `double` 자리에 그냥 넣는 것이 왜 되는지 모른다. 규칙이지 예외가 아니다 | `table` |
| `java/explicit-conversion` **신규** | 넓은 → 좁은 은 `(int)` 를 적어야 하고 **자른다** | `integer-overflow` | 타입 변환 사다리 | `(int) 3.9` 를 4 로 예상한다. 반올림이 아니라 **버림**이라 3 이다. `(byte) 300` 은 `44` 다 | `value` |
| `java/autoboxing` `심화↑` | `int` 와 `Integer` 가 소리 없이 오간다 | `value-vs-reference` · `null-reference` · `type` | 타입 변환 사다리 + 메모리 줄 | `Integer` 가 `null` 인데 `int` 에 넣어 NPE 가 난다 — 「숫자인데 왜 NPE 냐」에서 멈춘다 | `predict` |

#### 축 G — 대입과 이름 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/assignment` `1부↑` | 대입이 **식**이라 값을 낸다 | `state` | 메모리 줄 | `if (done = true)` 가 통과한다 — `boolean` 일 때만 열리는 문이고, `=`/`==` 실수가 살아남는 자바의 유일한 자리다 | `predict` |
| `java/reference-binding` **신규** | 원시는 **값이** 복사되고 참조는 **자리가** 복사된다 | `value-vs-reference` · `aliasing` · `stack-and-heap` | 메모리 줄 (스택 칸 · 힙 상자) | 메서드에 객체를 넘기면 복사된다고 믿는다. `int` 는 복사되고 `List` 는 안 된다 — 같은 문법에 다른 규칙 | `predict` |

#### 축 H — 비교와 같음 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `java/comparison` `1부↑` | `<`·`>` 는 **숫자에만** 쓴다 | — | 평가 트리 | 글자를 `<` 로 견주려 한다. 문자열은 `compareTo` 다 | `value` |
| `java/reference-equality` `대기↑` | `==` 는 「같은 상자냐」, `.equals` 는 「내용이 같냐」 | `identity-vs-equality` · `value-vs-reference` | 메모리 줄 | `new String("a") == "a"` 가 거짓이다. `Integer a = 1000, b = 1000` 이면 `a == b` 가 거짓인데 `127` 이면 참이다(캐시 −128~127) | `predict` |

**그림 여섯 중 다섯만 쓴다.** 비트 배열 · 평가 트리 · 값 상자 · 메모리 줄 · 타입 변환 사다리.
**스택 프레임은 0부에 없다** — 메서드가 아직 안 나왔다. 1부 `java/method-declaration`·
`java/return-statement` 가 그 그림의 첫 소비자다. 다만 `reference-binding` 의 메모리 줄이
스택 칸과 힙 상자를 함께 그리므로 **그 그림이 스택 프레임의 예고 노릇을 한다.**

### §1.5.2 언어마다 다른 자리

세 언어(파이썬 · JS/TS · 자바)를 같은 여덟 축으로 대조한다. **자바 열이 이 문서의 몫**이고
나머지 둘은 [`py.md`](./py.md) §1.5 · [`ts.md`](./ts.md) §1.5 가 같은 표를 든다.
이 표가 0부의 존재 이유다 — 같은 축에서 세 언어의 답이 **서로 다르고**, 그 차이를 모르면
두 번째 언어에서 첫 언어의 습관이 그대로 틀린 답이 된다.

| 축 | 파이썬 | JS / TS | **자바** |
|---|---|---|---|
| 정수형 | 자릿수 한계가 없다 — `2**100` 이 그대로 | 정수 타입이 **없다**. 전부 64비트 부동소수 | **`int` 32비트 고정.** `MAX_VALUE + 1` 이 가장 작은 음수 |
| 나눗셈 | `/` 는 늘 `float`, `//` 는 **아래로** 버림 (`-7 // 2 == -4`) | `/` 는 늘 소수. 버림이 `Math.floor`(아래)와 `Math.trunc`(0 쪽)로 갈린다 | **`/` 가 정수끼리면 0 쪽으로 버림** (`-7 / 2 == -3`) |
| 실수 | `0.1 + 0.2 != 0.3`. 정확한 소수는 `decimal` | 같음. 정수도 같은 타입이라 큰 정수까지 샌다 | 같음. **`float`/`double` 둘이고 리터럴 기본이 `double`.** 돈은 `BigDecimal` |
| 문자열 길이 | `len` 이 **코드 포인트** — `len("가") == 1` | `.length` 가 UTF-16 코드 단위 — `'👍'.length === 2` | `.length()` 도 UTF-16 코드 단위. **`char` 타입이 따로 있고** 이모지 하나가 `char` 둘 |
| 참·거짓 | `bool` ⊂ `int` (`True + True == 2`). 빈 것이 거짓 | 거짓이 **여섯**이고 `[]`·`{}` 는 참 | **`boolean` 이 숫자가 아니고** 조건 자리에 `boolean` 말고는 **못 온다** |
| 형 변환 | 수 사이는 올라가지만 **문자열과 숫자는 안 섞인다** | **자동으로 섞인다** — `1 + '1' === '11'` | **넓히기는 자동, 좁히기는 `(int)` 명시.** 문자열은 `+` 로만 자동 |
| 대입 | 대입은 **문**이라 값이 없다 (`:=` 만 식) | 대입이 **식** — `a = b = 0` | 대입이 **식** — `if (done = true)` 가 **`boolean` 일 때만** 통과 |
| 같음 | `==` 는 값, `is` 는 자리 | `===` 는 타입까지, `==` 는 강제 변환. `NaN !== NaN` | **`==` 는 자리, `.equals` 는 내용.** `Integer` 는 −128~127 만 캐시 |

**이 표에서 자바가 혼자인 자리 셋.** ① 조건 자리에 `boolean` 말고는 못 오는 것 ② `char` 이 별도
타입인 것 ③ 좁히기 변환을 사람이 적어야 하는 것. 셋 다 **파이썬·JS 를 먼저 배운 사람이 자바에서
컴파일 오류로 처음 만나는 자리**다. 컴파일 오류라 조용히 틀리지는 않지만, **왜 막는지를 모르면
`(int)` 를 아무 데나 붙여 통과시키는 습관이 든다** — 그때 `(int) 3.9 == 3` 이 조용한 버그가 된다.

반대 방향도 있다. `java/arithmetic` 의 「`7 / 2 == 3`」을 배운 사람이 파이썬에서 `7 / 2` 를 `3` 으로
예상하고 `3.5` 를 받는다. **0부 문항이 다른 언어의 답을 오답 선택지로 쓴다** — D4 전이의 반대
방향이고, 이것이 이 부가 하는 일 중 하나다.

### §1.5.3 실측 — 0부 개념이 사용자 리포에 몇 곳 나오나

`MonggleMonggle`(java 99파일 4,908줄)을 정규식으로 셌다. **주석과 문자열 리터럴을 먼저 지우고**
셌으므로 §2 의 원시 계수와 값이 다르다 — `/` 가 그 차이를 가장 크게 낸다.

| 0부 판 | 근거 모양 | `MonggleMonggle` | 판정 |
|---|---|---|---|
| `value-bits` · `variable-declaration` | `int`/`long`/`short`/`byte` 선언 · 정수 리터럴 | 선언 31곳 / 13파일 · 리터럴 37 / 14 | 내 코드에서 확인 |
| `integer-limit` | `MAX_VALUE` · `MIN_VALUE` · `long` | **2곳 / 1파일** | **합성 + 「네 코드엔 없다」**(`scale`) |
| `floating-type` | `double`/`float`/`BigDecimal` | 9곳 / 3파일 | 얇다 — `thin_threshold`(min_files 2 · min_sites 3)를 겨우 넘는다 |
| `float-inexact` | 실수 리터럴 | 3곳 / 2파일 | **합성 + 「네 코드엔 없다」**(`scale`) |
| `string-literal` | 큰따옴표 리터럴 | 560곳 / 66파일 | 내 코드에서 확인 |
| `text-length` | `char` · `charAt(` · `Character` | **0곳 / 0파일** | **합성 + 「네 코드엔 없다」**(`idiom` — `String` 이 그 자리를 다 가져갔다) |
| `boolean-literal` | `true`/`false` · `boolean`/`Boolean` | 27곳 / 15파일 · 타입 18 / 15 | 내 코드에서 확인 |
| `boolean-only-condition` | (없는 것에 대한 주장이라 사용처가 안 생긴다) | — | 합성이 정본 |
| `arithmetic` | 나눗셈 `/` · 나머지 `%` | **0곳 / 0파일 (둘 다)** | **합성 + 「네 코드엔 없다」**(`scale`) |
| `operator-precedence` | `+` 와 `*` 가 섞인 식 · `&&`/`\|\|` | 섞인 식 5 / 3 · `&&`/`\|\|` 20 / 10 | 얇다 |
| `string-concat` | `"" +` · `+ ""` | 15곳 / 9파일 | 내 코드에서 확인 |
| `implicit-conversion` · `explicit-conversion` | `(int)` 류 캐스트 | **캐스트 0곳** · `parseInt`/`valueOf` 6 / 4 | **합성 + 「네 코드엔 없다」**(`scale`) |
| `autoboxing` | `Integer`/`Long`/`Double`/`Boolean`/`Character` | **256곳 / 65파일** | 내 코드에서 확인 |
| `assignment` | 선언 대입 · 재대입 | 선언 187 / 34 · 재대입 17 / 9 | 내 코드에서 확인 |
| `reference-binding` | (대입·매개변수와 같은 노드) | 위와 같음 | 내 코드에서 확인 |
| `comparison` | `==` · `!=` | 46곳 / 14파일 | 내 코드에서 확인 |
| `reference-equality` | `.equals(` · `Objects.equals` | 15곳 / 5파일 | 내 코드에서 확인 |

**19판 중 여섯이 사용처 0 이거나 그에 가깝다** — `integer-limit`(2) · `float-inexact`(3) ·
`text-length`(**0**) · `arithmetic` 의 나눗셈(**0**) · 캐스트(**0**) · `floating-type`(9).

**이것이 D177 의 가장 강한 증거다.** §2 가 이미 「`for (;;)` 0곳 · 배열 1곳 · `abstract class` 0곳」으로
같은 논증을 했는데, **0부에서는 그 비율이 더 높다** — 19판 중 여섯(32%)이다. 사칙연산의 나눗셈이
99파일에 한 곳도 없는 리포에서 「`7 / 2` 가 왜 `3` 인가」를 내 코드로 가르칠 방법은 없다.
옛 방식(리포가 쓰는 문법만)이었다면 이 여섯은 코스에 아예 없었을 것이고, 사용자는
**정수 나눗셈을 모른 채 자바를 「배웠다」**가 된다.

사유(`AbsenceReason` · `packages/cards/src/t0-synthetic.ts`)는 다섯이 `scale`, 하나가 `idiom` 이다.
`scale` 은 「이 규모에서는 필요가 안 생겼다」 — CRUD API 서버는 산술도 캐스트도 큰 수도 안 쓴다.
`idiom` 은 `char` 이고, 그 자리를 `String` 이 다 가져갔다(`String` 리터럴 560곳).

**반대로 `autoboxing` 이 256곳 / 65파일이다.** §5 가 이것을 **심화**(난이도 4)에 두었는데, 표본에서
0부의 어떤 판보다도 많다. 65/99 파일에 `Integer`·`Long`·`Boolean` 이 있다 — JPA 엔티티와 DTO 가
전부 래퍼 타입을 쓰기 때문이고, 그것이 요즘 자바다. **심화에 두면 사용자는 자기 코드 3분의 2에
있는 문법을 코스 끝까지 안 배운다.** 0부 축 F 로 올린 근거가 이 수치다.

### §1.5.4 부 배치가 어떻게 바뀌나 — 겹침 정리

0부는 새 개념 열한 장을 세우고 **여덟 장을 다른 데서 받는다.** 받은 자리는 원래 부에서 **지운다** —
같은 개념이 두 부에 서면 판이 두 번 나오고, 그 순간 「기초부터 심화까지 이어진다」가 깨진다.

| 어디서 | 무엇이 0부로 | 몇 장 |
|---|---|---|
| §2 1부 바닥 (13장) | `variable-declaration` · `assignment` · `arithmetic` · `boolean-literal` · `comparison` | **5** |
| §2 「아직 안 세운 것」 | `string-literal` · `reference-equality` · `string-concat` | **3** |
| §5 심화 | `autoboxing` | **1** |
| 신규 | `value-bits` · `integer-limit` · `floating-type` · `float-inexact` · `text-length` · `boolean-only-condition` · `operator-precedence` · `implicit-conversion` · `explicit-conversion` · `reference-binding` | **10** |

**2부 열여섯은 한 장도 안 움직인다.** 2부는 「클래스와 객체」축이고 0부는 「값과 식」축이라 겹치는
개념이 없다. 겹치는 것처럼 보이는 둘을 짚어 둔다 — ① `java/null`(2부)은 0부 `autoboxing` 과
`reference-binding` 이 함께 만드는 자리지만, 2부의 것은 **`new` 로 만든 것이 없는 상태**이고
0부의 것은 **원시와 참조가 다른 규칙을 따른다**는 것이라 층이 다르다. `null` 의 `prereq` 에
`reference-binding` 을 걸면 순서가 스스로 선다. ② `java/equals-hashcode`(2부)는 0부
`reference-equality` 를 선행으로 갖는다 — 0부가 「`==` 와 `.equals` 가 다르다」를 맡고, 2부가
「내가 `.equals` 를 정할 때 `hashCode` 도 같이 정해야 한다」를 맡는다.

| 부 | 이름 | 판 | 담기는 것 |
|---|---|---|---|
| **0부** | 이 언어의 값과 식 | **19** | 위 축 여덟 |
| **1부** | 흐름과 묶기 | **8** | `class-declaration` · `if-statement` · `method-declaration` · `return-statement` · `array` · `for-loop` · `for-each` · `import` |
| **2부** | 객체 | **16** | §2 그대로 (`access-modifier` … `annotation`) |
| **3부** | 프레임워크 | **15** | `spring/` 전량 (D176). 표본에서는 14 — `spring/bean-lifecycle` 이 안 선다 |

**1부가 여덟으로 줄어든 것이 이 배치의 값이다.** 지금 1부는 「값·타입·조건·반복·메서드·배열」
열셋이라 안에 축이 둘 섞여 있다. 0부가 값 축을 가져가면 1부에 **흐름과 묶기**만 남는다 —
`class-declaration`(코드가 사는 상자) · `method-declaration`(묶기) · `if`/`for`/`for-each`(흐름) ·
`array`(모으기) · `import`(파일 사이). 이 여덟은 서로 선행이 걸려 한 덩어리다.

**판 수와 일수** (하루 새 판 2장 · D12 · 정본 §2 의 하루 15분):

| 부 | 판 | 일 |
|---|---|---|
| 0부 | 19 | **10** (마지막 날 1장) |
| 1부 | 8 | 4 |
| 2부 | 16 | 8 |
| 3부 | 15 (표본 14) | 8 (표본 7) |
| **합** | **58** (표본 **57**) | **29** |

0부 이전은 §2 가 잰 **43판 = 22일**이었다. **0부가 더하는 것은 이레**(19판 중 다섯은 1부에서
옮겨온 것이라 순증은 14판)다. 그 이레 뒤에 사용자는 「`7 / 2` 가 왜 `3` 인가」·「`Integer` 가 왜
NPE 를 내나」에 답할 수 있다. 이레가 맞는 값인지는 **사용자 결정이다** — 줄이려면 축 A·B 를
각 2판·1판으로 접어 16판(8일)까지 내려간다. 접으면 잃는 것은 비트 배열 그림이 걸리는 자리 넷
(`value-bits`·`integer-limit`·`floating-type`·`float-inexact`)이 둘로 뭉쳐, 「32칸이 도는 것」과
「소수가 안 떨어지는 것」을 한 판에서 둘 다 보여야 한다는 것이다.

### §1.5.5 0장(프롤로그)과의 관계 — 안 건드린다

`ZERO_CHAPTER_MAX = 24` 의 0장과 이 0부는 **다른 것**이다. 0장은 `zeroChapterPlates` 가 `_lang.yaml` 의
`essential` 에서 깊이 ≤ 2 를 뽑아 만드는 예고이고, 0부는 코스의 부다. 이름이 닮아 헷갈리므로 적어 둔다.

자바의 0장 후보는 §6 이 **24/24** 로 쟀다 — 마진이 0 이다. 0부의 신규 열 장을 `essential` 에 올리면
**34** 가 되어 상한이 열을 자르고, 넷째 정렬 키(id 알파벳순)가 실제로 돌기 시작한다.
[`py.md`](./py.md) §1.5.5 · [`ts.md`](./ts.md) §1.5.5 와 **같은 결정**이고 [`cs.md`](./cs.md) §6 의
미해결과도 같다. **세 갈래(0부를 `essential` 밖에 두기 / 상한을 30 으로 올리기 / 입력을 두 목록으로
가르기)를 함께 재야 하고, 이 문서에서는 안 정했다.**

**하나 더 — `packages/course/src/curriculum.ts` 의 `JAVA_PARTS`.** §2 가 「`_lang.yaml` 의 `essential`
순서가 곧 1·2부의 순서이고 `JAVA_PARTS` 가 같은 목록을 든다. 시험이 둘을 대조한다」고 적어 뒀다.
0부를 세우면 **그 상수에 부가 하나 늘고 시험도 함께 바뀐다.** 이 문서는 명세이고 그 변경은
`packages/**` 라 범위 밖이다 — 여기 적어 두는 것이 인계다.

---

### §1.5.6 I6 조정 규약 — 공통 id 조각 · 0부 상한 · `cs/` 신청

세 언어(그리고 나머지 일곱)가 **같은 축에 같은 id 조각**을 쓴다. 조각이 같으면 `universal` 로
`common/` 에 묶기 쉽고, 다르면 [`cs.md`](./cs.md) §10.1 이 적은 사고 — 「같은 기계에 여덟 가지 이름이
붙었다」 — 가 0부에서 되풀이된다.

| 조각 | 축 | `py` | `ts` | **`java`** |
|---|---|---|---|---|
| `value-bits` | A | `py/value-bits` **신규** | `ts/value-bits` **신규** | `java/value-bits` **신규** |
| `integer-literal` | A | `py/number-literal` | `ts/number-literal` | `java/variable-declaration` |
| `integer-limit` | A | `py/integer-limit` **신규** | `ts/number-is-double` | `java/integer-limit` **신규** |
| `float-type` | B | `py/number-literal` 이 겸한다 | `ts/number-is-double` 이 겸한다 | `java/floating-type` **신규** |
| `float-inexact` | B | `py/float-inexact` **신규** | `ts/float-inexact` **신규** | `java/float-inexact` **신규** |
| `integer-division` | B | `py/integer-division` **신규** | `ts/integer-division` **신규** | `java/arithmetic` 이 겸한다 |
| `string-literal` | C | `py/string-literal` | `ts/string-literal` | `java/string-literal` |
| `string-interpolation` | C | `py/f-string` | `ts/template-literal` | **없다** — `java/string-concat` 이 그 자리 |
| `text-length` | C | `py/text-length` **신규** | `ts/text-length` **신규** | `java/text-length` **신규** |
| `boolean-literal` | D | `py/boolean-literal` | `ts/boolean-literal` | `java/boolean-literal` |
| `truthiness` | D | `py/truthiness` | `ts/truthy-falsy` | `java/boolean-only-condition` **신규** (반대 방향 — 못 한다는 규칙) |
| `absent-value` | D | 1부 `py/none-value` | `ts/undefined-null` | 2부 `java/null` |
| `arithmetic` | E | `py/arithmetic` | `ts/arithmetic` | `java/arithmetic` |
| `operator-precedence` | E | `py/operator-precedence` **신규** | `ts/operator-precedence` **신규** | `java/operator-precedence` **신규** |
| `logical-operator-value` | E | `py/bool-op-value` **신규** | `ts/operator-precedence` 가 겸한다 | **없다** — `&&` 가 `boolean` 만 낸다 |
| `conditional-expression` | E | 부 밖 (심화) | `ts/conditional-ternary` | 부 밖 (표본 13곳) |
| `implicit-conversion` | F | `py/implicit-conversion` **신규** | `ts/implicit-conversion` **신규** | `java/implicit-conversion` **신규** |
| `explicit-conversion` | F | `py/explicit-conversion` **신규** | `ts/explicit-conversion` **신규** | `java/explicit-conversion` **신규** |
| `assignment` | G | `py/assignment` | `ts/const-declaration` · `ts/reassignment` | `java/assignment` |
| `reference-binding` | G | `py/reference-binding` **신규** | `ts/reference-sharing` | `java/reference-binding` **신규** |
| `comparison` | H | `py/comparison` | `ts/comparison` | `java/comparison` |
| `identity-equality` | H | `py/is-identity` | `ts/loose-equality` | `java/reference-equality` |

**이 표가 드러내는 구멍 셋.** ① 자바에는 문자열 보간이 없다(JEP 430 철회) — `string-concat` 이
그 자리를 진다. ② 자바의 `&&` 는 `boolean` 만 내므로 `logical-operator-value` 조각이 안 선다.
③ `truthiness` 는 자바에서 **반대 방향**이다 — 파이썬·JS 는 「무엇이 거짓이 되나」이고 자바는
「`boolean` 말고는 못 온다」다. 같은 조각 이름을 쓰되 `universal` 은 안 건다.

#### 0부 상한 — 언어당 12장

I6 규약: 0부가 `essential` 에 새로 올리는 개념은 **언어당 12장까지**다. 근거는 0장 상한 24 에서
기초 8 을 뺀 값이고, 이 상한이 없으면 §1.5.5 가 적은 「후보가 넘쳐 id 알파벳순이 실제로 돈다」가
그대로 일어난다.

`essential` 에 새로 드는 것을 세면 **열넷**이다 — 신규 열에 `string-literal` ·
`reference-equality` · `string-concat` · `autoboxing` 넷(§2 「아직 안 세운 것」과 §5 심화)이 붙는다.
**둘이 넘으므로 둘을 `essential` 밖에 둔다** — `java/string-concat`(표본 15곳 / 9파일)과
`java/autoboxing`(256곳 / 65파일). 둘 다 사용처가 넉넉해 **카드는 그대로 서고**, 빠지는 것은
구멍 지도(03 §6)의 분모와 0장 후보뿐이다. 파이썬이 심화 열 개를 `essential` 밖에 둔 것과 같은
판단이다(§5 의 반례). **12 ≤ 12 — 상한을 지킨다.**

**0부의 판 수(19)와 이 12는 다른 수다.** 판은 **코스에서 며칠 걸리나**를 재고,
12는 **0장 후보와 구멍 지도 분모가 얼마나 커지나**를 잰다. 이미 `essential`(29)에 있던 것을
0부로 옮기는 것은 후자를 한 톨도 안 늘린다 — 부는 **교재 축**이고 `essential` 은 **분모 축**이다.

#### `cs/` 에 없는 것 셋 — 신청 목록

`cs/` 43장(D157)을 0부의 간선으로 쓰려고 대조했더니 **셋이 없다.**

| 신청 `cs/` id | 한 줄 | 이 문서에서 이것을 요구하는 판 | 그림 |
|---|---|---|---|
| `cs/operator-precedence` | 식은 왼쪽부터 읽히지 않는다 — 연산자마다 세기와 방향이 있고, 그것이 **접히는 순서**를 정한다 | `java/operator-precedence` · `java/arithmetic` | **평가 트리** |
| `cs/type-conversion` | 타입이 다른 값을 만나면 ① 언어가 바꾸거나 ② 사람이 적거나 ③ 멈춘다 — 셋 중 무엇이냐가 언어를 가른다 | `java/implicit-conversion` · `java/explicit-conversion` | **타입 변환 사다리** |
| `cs/truthiness` | 참·거짓이 아닌 값을 조건 자리에 두면 무슨 일이 일어나나 | `java/boolean-only-condition` | 값 상자 |

**앞의 둘이 특히 크다** — I2 세션이 만드는 그림 여섯 중 **평가 트리와 타입 변환 사다리 둘이
이 두 개념의 그림**이다. `cs/` 에 개념이 없으면 그 그림이 걸릴 데가 없고, 언어마다 따로 그리면
`cs.md` §10.1 이 경고한 「같은 기계에 여러 이름」이 그림 층에서 되풀이된다.

셋을 세우는 것은 `dictionary/cs/**` 와 `docs/curriculum/cs.md` 의 일이라 **이 문서의 범위 밖**이다.
여기 적어 두는 것이 신청이다. 셋이 서기 전까지 위 표의 해당 칸은 「없음」으로 두고, 판은
`cs/` 간선 없이 선다 — 판은 뜨되 「왜」의 아래층이 비어 있다.

#### 파서 — 이 언어는 오늘 실제로 파싱된다

I6 이 찾은 것: `packages/dictionary/src/schema.ts:29` 의 `grammarSchema` 열거값에는 `c`·`cpp`·
`c_sharp`·`swift`·`dart` 가 있는데 `crates/parse/Cargo.toml` 의 `lang-*` 기능에는 없다. 그 다섯은
**사전이 로드되고 린트도 통과하는데 캡처가 0곳**이 된다 — [`README.md`](./README.md) §6 표의
「열었다」는 로드 단계이지 파서가 아니다.

**이 문서의 언어는 그 자리가 아니다.** `Cargo.toml` 을 직접 확인했다 — 문법 `java` 는
`lang-java` = `tree-sitter-java 0.23` 로 실제 링크되어 있고, §1.5.3 의 실측이 그 위에서 돈 것이 아니라 **정규식으로 돈 것**이므로
(정규식은 파서 유무와 무관하다) 두 사실을 섞지 않는다. 파서가 붙어 있다는 것은 **0부 판이
사용처를 실제로 얻는다**는 뜻이고, 사용처가 0 인 판(§1.5.3 의 「합성 + 「네 코드엔 없다」」)은
파서가 없어서가 아니라 **그 코드가 리포에 없어서** 0 이다. 그 둘은 다른 결론으로 이어진다 —
앞의 것은 크레이트를 붙이면 풀리고, 뒤의 것은 D177 규칙 ①(합성 + 사유 명시)이 답이다.

---

## §2 코스 3부 — 무엇을 어느 부에서 가르치나

정본 §4 · D177. **별도 입문 과정을 만들지 않는다**와 **교재는 내 코드뿐**이 사용자 결정으로
폐기됐다. 뒤집은 근거는 취향이 아니라 셈이다 — 표본 리포 `MonggleMonggle`(자바 99장)에서:

| 무엇 | 곳 | 파일 |
|---|---|---|
| `for (;;)` 세 칸짜리 되풀이 | **0** | 0 |
| for-each | **1** | 1 |
| 배열 `[]` | **1** (`String[] args` 하나) | 1 |
| `abstract class` | **0** | 0 |
| 제네릭 경계 `<T extends …>` · 와일드카드 `? extends` | **0** | 0 |
| `equals`/`hashCode` 재정의 | **0** | 0 |
| `Set<` · `switch` · `instanceof` · `enum` · `char` | **각 0** | 0 |
| `implements` | 1 | 1 |
| `extends` | 9 (그중 8이 예외 계층) | 9 |
| `->` 람다 | 53 | 14 |
| `.stream()` | 9 | 7 |
| `.equals(` 호출 | 15 | 5 |
| `return` | 118 | 35 |

읽는 법은 이렇다. **이 리포만으로 「반복」을 가르치면 교재가 한 줄이고, 「배열」도 한 줄이고,
「상속 계층」은 예외 클래스 여덟 줄이 전부다.** 반복의 자리를 스트림과 람다가 다 가져갔기
때문이고, 그것은 이 리포가 이상해서가 아니라 요즘 자바가 그렇게 쓰이기 때문이다.
그래서 교재를 둘로 나눈다.

| 부 | 교재 | 담기는 것 | 판 |
|---|---|---|---|
| **1부 바닥** | **합성 예제** | 변수·타입·조건·반복·메서드·배열 | 13 |
| **2부 객체** | 합성 + 내 코드 | 클래스와 객체 · 생성 · 상속과 오버라이드 · 인터페이스 · 다형성 · 캡슐화 · 컬렉션과 제네릭 · 예외 | 16 |
| **3부 프레임워크** | **내 코드 중심** | 의존성 주입 · 빈 생명주기 · 프록시와 AOP · 트랜잭션 전파 · 요청 디스패치 · 필터와 인터셉터 · 영속성 매핑 | 15 (`spring/` · D176) |

3부가 끝나면 코스는 **내 리포의 기능 챕터**로 넘어간다(`docs/program/course.md` §2).

### 규칙 셋

**① 개념마다 내 코드의 자리를 짚는다.** 합성으로 배운 뒤 「네 리포의 여기가 그것이다」가
반드시 따라붙는다. 자리가 없으면 **「네 코드엔 없다」를 명시하고 왜 없는지를 함께 낸다** —
그것 자체가 공학 문항이다(D158 ②). 사유는 넷뿐이고 개념마다 다르지 않아 사전이 아니라
생성기 카탈로그에 있다(`packages/cards/src/t0-synthetic.ts` 의 `AbsenceReason`):

| 사유 | 뜻 | 이 리포의 실물 |
|---|---|---|
| `framework` | 프레임워크가 대신 만들어 준다 | 롬복이 지운 생성자 · `@EqualsAndHashCode` |
| `library` | 이미 있는 것을 부르지 직접 짜지 않는다 | 제네릭 경계 |
| `scale` | 이 규모에서는 필요가 안 생겼다 | 추상 클래스 계층 |
| `idiom` | 다른 문법이 그 자리를 가져갔다 | `for (;;)` ← 스트림·for-each |

**② 3부는 내 코드가 먼저다.** 합성은 그 모양이 내 코드에 **없을 때만**. 프레임워크가 묻는
것은 「이 표시가 런타임에 무엇을 하나」이고 그 답이 실물로 내 코드에 있기 때문이다. 1·2부는
반대다 — 바닥 문법은 이 리포에 없거나 한 줄뿐이라 합성이 정본이고 내 코드가 확인이다.

**③ 순서는 개념 그래프의 위상 정렬**이고 부 안에서 선행이 먼저다. `topoOrder` 를 그대로 쓴다.

### 부 배치

`dictionary/java/_lang.yaml` 의 `essential` 순서가 곧 1·2부의 순서이고,
`packages/course/src/curriculum.ts` 의 `JAVA_PARTS` 가 같은 목록을 든다. 시험이 둘을 대조한다.

> **0부(§1.5)가 1부에서 다섯 장을 가져갔다** — `variable-declaration` · `assignment` ·
> `arithmetic` · `boolean-literal` · `comparison`. 아래 열셋은 그 뺄셈의 원본이고 갱신된 1부는
> 여덟 장(§1.5.4)이다.

**1부 바닥 열셋** — `class-declaration` · `variable-declaration` · `assignment` · `arithmetic` ·
`boolean-literal` · `comparison` · `if-statement` · `method-declaration` · **`return-statement`** ·
**`array`** · `for-loop` · **`for-each`** · `import`.

**2부 객체 열여섯** — `access-modifier` · `field-declaration` · `new-expression` · `constructor` ·
`static` · `null` · `collection-generic` · `interface` · `inheritance-override` ·
**`abstract-class`** · **`generic-bound`** · **`equals-hashcode`** · **`lambda`** ·
**`stream-pipeline`** · `try-catch` · `annotation`.

**3부 프레임워크 열다섯** — `spring/` 전량(D176). 스프링이 아닌 자바 리포에서는 이 사전이
로드되지 않아 3부가 0판이고, 코스는 2부에서 기능 챕터로 넘어간다.

굵은 여덟이 D177 이 새로 세운 개념이다. 셋(`abstract-class`·`generic-bound`·`equals-hashcode`)은
표본 리포에 **0곳**이라 그 자체가 규칙 ①의 시험이다 — 이 셋이 카드로 서면 「내 코드에 없는
것을 가르친다」가 실물로 증명되고, 안 서면 3부까지 갈 것도 없이 D177 이 실패한 것이다.

### 표본 리포에서 실제로 서는 목차 (2026-09-05 실측)

`MonggleMonggle` 에 대고 `buildCurriculum` → `courseOutline` 을 돌린 결과다. 자리 판정은
자바 99장에 대한 정규식 근사이고(파서 CLI 가 없다) 3부는 `spring/` 의 `evidence` 낱말을 센 것이다.

| 목차 | 판 | 내 코드 | 「네 코드엔 없다」 | 안 서는 것 |
|---|---|---|---|---|
| 1부 바닥 | 13 | 12 | 1 (`for-loop` · `idiom`) | — |
| 2부 객체 | 16 | 13 | 3 (`abstract-class` `scale` · `generic-bound` `library` · `equals-hashcode` `framework`) | — |
| 3부 프레임워크 | **14** | 14 | 0 | **1 — `spring/bean-lifecycle`** |
| **1 로그인 챕터** | 관문 ≤ 6 + 다섯 단 | 24파일 · 요청 6 | — | — |

**부 셋 43판 = 22일**(하루 새 판 2장 · D12), 그 뒤로 기능 챕터가 이어진다.

읽을 것 셋.

**① 부가 자바 어휘를 다 흡수해 로그인 챕터의 관문에 자바가 0개다.** 남는 것은 js·SQL·
규약(`proto/`)·기계(`cs/`)뿐이다 — `chapterGates` 의 `taught` 가 그 뺄셈이다.

**② 「네 코드엔 없다」가 네 자리에 실제로 선다.** 이 넷이 D177 의 시험이고, 옛 방식(리포가
쓰는 문법만)이었다면 넷 다 코스에 없었을 것이다.

**③ `spring/bean-lifecycle` 은 판이 안 선다.** 근거 낱말이 이 리포에 **0곳**이고, `spring/` 은
쿼리가 없는 네임스페이스라 합성으로 돌릴 `examples[]` 도 없다. 자리도 사유도 못 대면 만들지
않는다는 규칙이 그대로 걸린 것이다. 고치는 길은 둘 — `evidence` 를 넓히거나(`@PostConstruct`
밖의 낱말) `spring/` 개념에 `examples[]` 를 다는 것이고, 둘 다 `dictionary/spring/**` 쪽 일이다.

### 다형성은 개념 하나가 아니다

정본 §4 의 2부 목록에 「다형성」이 있는데 개념으로 세우지 않았다. 짚을 노드가 없기 때문이다 —
다형성은 `inheritance-override` · `interface` · `abstract-class` 셋이 **함께** 만드는 성질이고,
「어느 몸이 불릴지가 실행 때 정해진다」는 문법이 아니라 기계라 `cs/dynamic-dispatch`(§9)의
자리다. 그래서 이 축은 셋의 문항이 나눠 지고, 기계 층은 아직 미착수다.

### 아직 안 세운 것

1·2부에 있어야 하는데 지금 없는 것들이다. 다음 물결의 순서대로 적는다.

| id | 왜 필요한가 | 왜 아직 없나 |
|---|---|---|
| `java/string-literal` | 1부의 「값」이 숫자·참거짓뿐이다. 텍스트 블록 함정(§9 ⑥)도 여기 걸린다 | 짚을 자리가 한 노드뿐이라 `@pick` 셋을 못 채운다. 쿼리를 둘로 갈라야 한다 |
| `java/reference-equality` | 오개념 1번(`==` 대 `.equals`)이 지금 `equals-hashcode` 의 `misconceptions` 에만 있다 | `==` 쿼리가 `java/comparison` 과 겹친다. 참조 타입만 고르려면 타입을 알아야 하는데 파서는 모른다 |
| `java/map-and-set` | 컬렉션 자료구조를 「목록 하나」로만 가르치고 있다. 이 리포에 `Map<` 13곳 · `Set<` **0곳** | `collection-generic` 과 노드가 같아 갈라야 하고, 그 판단이 어휘가 아니라 **자료구조 선택**이라 `ds/`(D158 ③) 쪽일 수 있다 |
| `java/main-method` · `java/string-concat` | 옛 §4 가 설계해 둔 것 | 저작이 밀렸다 |
| `java/checked-exception` · `java/autoboxing` · `java/generics-erasure` · `java/final` | 심화 | 저작이 밀렸다 |

---

## §3 1부에 담기는 것 — 설계표 (바닥 여덟 + 그 뒤 다섯)

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
| `public` | `java/access-modifier` — §4 | 2 |
| `static` | `java/static` — §4 | 2 |
| `String[]` | **개념으로 세우지 않았다.** 33개 어디에도 배열이 없다 | — |
| `args` | 개념으로 세우지 않았다. 매개변수는 `method-declaration` 안에서 다룬다 | — |

배열을 뺀 것은 실수가 아니라 자리가 없어서다(§6 의 24/24). Exercism Java 트랙은 `arrays` 를
깊이 낮은 자리에 두고 LLM Java 도 `String[]`·`int[]` 를 쓰므로 **다음 물결의 1순위**다.
다섯을 다 바닥 여덟에 넣으면 여덟 중 다섯을 첫 화면 해설에 쓰게 되고 `if`·`return`·셈하기가
밀려난다. 대신 **`java/class-declaration` 하나**를 바닥에 넣어 「모든 코드는 상자 안에 있다」만
세우고, `java/main-method` 는 §4 에 두되 **선행을 `method-declaration` 하나로만 매겨 깊이 2 에
앉힌다**(§6). 그 카드의 일은 다섯 낱말을 다 설명하는 것이 아니라 「넷은 나중에 배운다, 지금 알 것은
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
  `for (int i…)`·for-each·스트림이 그 자리를 다 가져간다. §4 의 `java/for-loop` 에 `common/loop-while`
  을 붙여 전이는 살렸다.
- **`return`** — 「안 적으면 컴파일이 멈춘다」는 좋은 Java 사실이지만(파이썬은 조용히 `None` 을 보낸다)
  선행이 `method-declaration` 이라 깊이 2 다. 여덟 자리를 쓰지 않아도 0장에 든다. §4 으로 옮겼다.
- **`String` 리터럴** — 「작은따옴표는 글자 한 개」라는 Java 사실이 있어 개념으로는 서지만
  깊이 0 이라 여덟 자리를 안 써도 0장 맨 앞에 온다.

---

## §4 2부에 담기는 것 — 설계표 (중심)

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
| 34 | `java/import` | 바깥 이름을 이 파일에 들이기 / Import declaration | `import` | `null` | 1 | — | 이 줄은 **실행되지 않는다** — 파일을 읽어 오는 것이 아니라 긴 이름을 짧게 쓰게 해 줄 뿐이다(파이썬·자바스크립트와 갈리는 자리). 같은 패키지는 안 적어도 쓴다 |

---

## §5 심화 — 2부 뒤쪽과 아직 안 세운 것

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

## §6 prereq 그래프와 적재량 (0장 → 1·2부)

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
바로 그 상태다). 실제로 사전을 짤 때는 `java/array`(§3 가 미룬 `String[]`)·`java/method-call`·
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

### 34번은 이 표를 짠 뒤에 붙었다 (D166)

조사할 때는 `import` 를 개념으로 안 세웠다. 「파일 맨 위의 배관」이라 가르칠 것이 없다고 봤는데,
실측이 반대였다 — `MonggleMonggle` 자바 99장에서 **759곳 · 92파일**로 이 언어에서 가장 흔한
사용처이고, 스프링 파일은 이 줄 열댓 개로 시작한다. 그리고 초심자가 여기서 실제로 헷갈리는 것이
하나 있다: **이 줄이 코드를 읽어 온다고 믿는 것**. 파이썬·자바스크립트에서는 맞는 말이라
전이가 아니라 오개념으로 다뤄야 하고, 그러려면 개념 자리가 있어야 한다. `universal` 은 `null` 이다
— `common/` 에 짝이 될 보편형이 아직 없다.

깊이는 0 이라 §6 의 층 표에서 깊이 0 이 5 → 6, 깊이 ≤ 2 의 합이 24 → 25 가 된다. §6 가 「마진이
0 이라 하나만 더해도 무엇을 자를지가 임의의 문제가 된다」고 적어 둔 그 자리에 실제로 하나가
더해진 것이다. 다만 D166 이 채운 것은 0장이 아니라 **챕터 앞의 어휘 관문**(`course.md` §3.2)이고
관문 0 의 상한은 12판이라, 자르는 규칙이 도는 자리도 거기다. 깊이 2 의 12개 중 무엇을 3 으로
내릴지는 여전히 안 정했다.


### D177 이후 — 실제 사전으로 다시 잰 것 (2026-09-05)

위 표는 **설계한 33개** 기준이다. 사전에 실제로 들어간 것으로 다시 재면 이렇다
(`_lang.yaml` 의 `essential` 29개, 깊이는 `prereqDepth` 가 그 집합 안에서만 센다).

| 깊이 | 개수 | 개념 |
|---|---|---|
| 0 | 8 | `class-declaration` · `variable-declaration` · `assignment` · `arithmetic` · `boolean-literal` · `comparison` · `if-statement` · `import` |
| 1 | 4 | `method-declaration` · `for-loop` · `field-declaration` · `new-expression` |
| 2 | 9 | `return-statement` · `array` · `access-modifier` · `constructor` · `static` · `null` · `collection-generic` · `interface` · `inheritance-override` |
| 3 | 7 | `for-each` · `abstract-class` · `generic-bound` · `equals-hashcode` · `lambda` · `try-catch` · `annotation` |
| 4 | 1 | `stream-pipeline` |

**깊이 ≤ 2 = 21개**로 상한 24 아래다. 조사 때의 24/24 와 다른 이유는 둘이다 — 설계표에만
있고 사전에는 없는 것이 넷(`main-method`·`string-literal`·`string-concat`·`reference-equality`)이고,
`comparison`·`if-statement` 의 선행이 `cs/` 로 가 있어 자바 집합 안에서는 깊이 0 이다.

**그래서 `ZERO_CHAPTER_MAX = 24` 는 손대지 않았다.** 이 상한이 하던 일 —
「무엇을 자를까가 임의의 문제가 되지 않게 한다」 — 을 이제 **부 배치가 대신 한다.
1·2부는 29개 전량을 담고 자르지 않는다.** 자르는 규칙이 도는 자리는 챕터 관문 하나뿐이고,
그쪽 상한은 챕터당 6판 · 코스 전체 40판이다(`packages/course/src/curriculum.ts`).
0장 자체는 코스 밖 대지로 남아 있고 이 언어에서는 21판을 담는다 — 부와 겹치지만 세는 자리가
달라 상한이 서로를 안 건드린다.

---

## §7 `common/` 재사용 대 신규

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

## §8 `cs/` 로 밀어낼 것

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

## §9 tree-sitter 현실

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

## §10 오개념

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

## §11 근거와 출처

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
