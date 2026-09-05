# Java 학습법 — `java.md` §12

`java.md` 가 903줄이라 이 절만 파일을 뺐다. **정본은 `java.md`** 이고 이 파일은 그 §12 다.
§1~§11 을 고치지 않았다. 여기서 나온 변경 제안은 전부 §12.6 의 표에 있고 본문은 안 건드렸다.

전제: 정본 §1·§2·§4 · `docs/program/pedagogy.md`(언어 무관 근거와 §4 판정 기준) ·
`docs/program/fundamentals.md`(형식 넷) · `docs/program/exercises.md`(유형 16) ·
`design/system/diagrams.md` · `docs/program/course.md` · `docs/program/chapter-login.md` ·
`docs/curriculum/README.md` §8·§12 · `java.md` 전체.

**`pedagogy.md` 와 겹치지 않는다.** 인출·간격·Parsons·워크드 예제처럼 언어를 안 가리는 근거는
그 문서의 것이고, 여기는 **자바의 의미론에서만 나오는 것**을 쓴다. `pedagogy.md` §4 의 세 시험
(T1 이식 · T2 조항 · T3 사전)을 §12.3 의 표가 열로 들고 있다.

---

## §12 학습법 — 이 언어를 이해한다는 것

### §12.1 이 언어의 기계 — 한 문장과 그림 하나

> **스택의 이름은 값 아니면 자리를 담고, `new` 로 만든 것은 힙에만 산다.
> 그래서 이름을 복사하면 원시는 값이 가고 참조는 자리가 간다.**

notional machine 은 「프로그램이 도는 기계에 대해 학습자가 가져야 할 상」이다(du Boulay 1986 ·
Sorva 2013). du Boulay 가 초보의 어려움을 다섯으로 가르면서 **의미론(semantics)** 을
「제어하려는 기계의 성질 — notional machine」으로 정의했고, 나머지 넷(orientation · syntax ·
strategies · pragmatics)과 갈랐다(Chiodini 외 2021 §2 가 원문을 인용한다).

**이 한 문장이 자바에서 학습 목표인 근거는 측정된 것이다.** Ma, Ferguson, Roper & Wood(2007)가
1학년 자바 과정을 **마친** 학생의 모형을 조사했더니 — 값 대입의 **비생존 모형이 3분의 1**,
객체 참조 대입의 **생존 모형이 17%** 였다. 그리고 생존 모형을 가진 학생이 시험과 과제에서
유의하게 나았다. 한 해 배우고도 다섯 중 넷이 「`b = a` 가 무엇을 복사하나」를 못 가진다.

Kaczmarczyk 외(2010)는 같은 자리를 면담으로 봤다. UCSD 에서 11명을 면담(10명 분석)해 32개 코드를
뽑았고, 네 갈래로 묶였다 — **T1 언어 요소와 메모리의 관계** · T2 `while` 이 도는 과정 ·
T3 Object 개념 자체의 부재 · **T4 코드를 선형으로 못 따라간다**. T1 안의 이름 붙은 오개념이
일곱이다(MMR1 semantics-to-semantics · MMR2 모든 객체는 같은 크기 · MMR3 인스턴스화했는데 메모리
없음 · MMR4 인스턴스화 안 했는데 메모리 있음 · MMR5 배열 0..length 포함 · PVR1 원시에 기본값
없음 · PVR2 값 없는 원시는 메모리도 없음). T3 이 특히 아프다 — 저자들이 「오개념이 아니라
**개념이 없었다**」고 적었다(면담에서 얼어붙거나 모른다고 답했다).

#### 이 문장이 §10 오개념 몇 개를 설명하나

| §10 # | 무엇을 믿나 | 기계의 어느 부분이 틀렸나 | 이 문장이 설명하나 |
|---|---|---|---|
| 1 | `==` 가 내용, `.equals` 가 상자 | 스택의 이름이 담는 것 | ○ |
| 2 | `b = a` 가 상자를 복사한다 | 복사 규칙(값 대 자리) | ○ |
| 3 | 지역 변수도 `0`·`null` 로 시작한다 | 스택 프레임과 힙 상자가 다른 규칙 | ○ |
| 4 | `final List` 면 목록이 안 바뀐다 | 자리와 상자를 안 갈랐다 | ○ |
| 5 | `static` 안에서 필드를 이름만으로 | 「어느 상자인가」가 없다 | ○ |
| 6 | `private` 은 객체 하나에 갇힌다 | — 접근 제어는 컴파일 시각 규칙 | **✕** |
| 7 | 생성자가 객체를 만든다 | 만드는 것은 `new` | ○ |
| 8 | `null` 도 객체다 | 자리가 비어 있다 | ○ |
| 9 | 길이는 다 같은 방법으로 잰다 | — 기계가 아니라 API | **✕** |
| 10 | 배열에 더 넣으면 커진다 | 힙 상자의 크기는 만들 때 정해진다 | ○ |
| 11 | `if (done = true)` 는 견주기다 | — 대입이 식이라는 문법 | **✕**(평가 트리) |
| 12 | `a && b` 는 `b` 를 늘 계산한다 | — 평가 순서 | **✕**(평가 트리) |
| 13 | `Integer 1000 == 1000` 이 참 | 스택의 이름이 담는 것 | ○ |

**열셋 중 아홉을 스택·힙 한 문장이 설명한다.** 못 하는 넷 중 둘(11·12)은 **평가 트리**가 설명하고,
6은 `cs/compile-and-run`(컴파일 시각과 실행 시각), 9는 기계가 아니라 어휘다.
「기계 하나로 전부를 설명한다」가 아니라 **아홉이 한 그림에 걸린다**는 것이 이 표의 값이다.

#### 그림 — 「메모리 줄」이 필요한데 자바가 언어 열에 없다

`diagrams.md` §3 의 명세만 다섯 중 **메모리 줄**(순 1)의 언어 열이 `C·C++·Rust·Go` 이고
**스택 프레임**(순 3)이 「전부」다. 그런데 `java.md` §1.5.1 이 이미 넉 장에 메모리 줄을 걸었다 —
`assignment` · `reference-binding` · `reference-equality` · `autoboxing`(타입 변환 사다리와 함께).
**명세와 언어 문서가 어긋나 있다.** 어느 쪽이 옳은지는 위 표가 답한다 — 아홉 개의 오개념이
「스택 칸에 무엇이 들었나 / 힙 상자가 어디 있나」에 걸리는데, 그것을 그리는 것이 메모리 줄이다.

새 그림을 신청하지 않는다. **기존 명세의 언어 열에 `java` 를 더하는 것**이 전부다(§12.6 ①).
근거 둘.

- Holliday & Luginbuhl(2004)이 **자바 기반 CS1** 에서 메모리 다이어그램을 그리는 능력과 객체지향
  개념 이해 사이의 상관을 보고했다. 우리 그림이 자바를 안 그리면 그 상관이 걸릴 자리가 없다.
- van Breugel & Roumani 는 화살표 그림이 **참조의 값(주소)을 지운다**고 지적한다 — 두 변수가
  같은지 따지고 인자 전달을 설명할 때 쓰는 것이 그 값인데, 화살표로 바꾸면 학습자가 이미 아는
  「같음」의 직관에 못 기댄다. 우리 메모리 줄 모델은 `slots: {addr, value, name?}` 이라
  **주소를 이미 들고 있다.** 화살표만 그리는 그림으로 바꿀 이유가 없다.
  (이 논문은 논증이고 실측이 없다 — 근거가 아니라 설계 논거로 인용한다.)

`cs/` 간선은 43장 안에 있다 — `value-vs-reference` · `stack-and-heap` · `aliasing` ·
`identity-vs-equality` · `null-reference` · `compile-and-run`. **신청할 것이 없다.**

---

### §12.2 최고의 교재·코스가 수렴한 순서 — 그리고 objects-first 논쟁

#### 논쟁의 실제 근거

| 연구 | 설계 | 결과 | 확인 |
|---|---|---|---|
| Ehlert & Schulte 2009 (ICER) | 중등학교, **1년**, 두 접근의 내용을 맞춰 **순서만** 다르게 | **학습 이득에 차이가 없다.** 다만 objects-later 쪽이 체감 난이도가 낮고 comfort level 이 높았다 | 초록·2차 (ACM PDF 403) |
| Reges 2006 (SIGCSE) | 워싱턴대 CS1 을 objects-early → 정적 메서드 절차형으로 전면 개편 | 강의평가 「과목 전체」 평균 C 3.71 / 옛 자바 3.30 / **새 자바 4.06**. CS1 등록 반등(+120명), CS1 여학생 22.7%→25.5%, 전공 입학 여학생 24/98(24.5%) | **전문** |
| Uysal 2012 (JSEA 5(10)) | 대학원 과목, BlueJ, 내용 동일·순서만 다름 | **objects-first 쪽이 유의하게 높았다** | 초록 |

**세 개가 같은 방향을 안 가리킨다.** Reges 는 스스로 「한꺼번에 많은 것을 바꿨으므로 통제 실험이
아니다. 어느 변화가 얼마나 기여했는지 알 수 없다」고 적고, 결론을 「절차형 강조가 **된다**」는
존재 증명으로 좁혔다 — 「낫다」가 아니다. Ehlert & Schulte 는 순서만 갈라 1년을 돌려 **차이 없음**을
얻었다. Uysal 은 반대 방향인데 표본이 **대학원생**이라 이미 프로그래밍을 아는 사람들이고, 우리
대상(프로그래밍이 처음인 사용자, 정본 §1)과 겹치지 않는다.

**정리 — 순서에는 근거가 없고, 갈리는 것은 조건이다.** Ehlert & Schulte 가 발견한 차이는 성취가
아니라 **체감 난이도**였고, 그것은 우리에게 성취보다 중요한 축이다(정본 §3-1 「벌이 아니라 공정」 ·
하루 15분을 스스로 이어 가야 하는 앱이다). 그 한 줄이 우리가 objects-late 를 고른 이유의 전부다 —
「낫다」가 아니라 「같은 이득에 체감이 덜 무겁다」.

#### 표준 문서는 무엇을 말하나

CS2001 은 여섯 모델을 두고 objects-first 를 「객체지향의 원리와 설계를 처음부터 강조하고 객체와
상속의 개념으로 즉시 시작하는」 과정으로 정의했다(Reges 2006 §1 이 원문을 인용한다).

**CS2023 은 그 규정을 하지 않는다.** SDF(Software Development Fundamentals) 지식 영역 문서
(Gamma, 2023-09, 43시간)를 열어 확인했다 — 「paradigm」이라는 낱말이 **0회** 나온다. 대신 CS Core
주제 목록의 순서가 이렇다.

1. **변수 · 원시 데이터 타입 · 식과 그 평가**
2. **명령형 프로그램이 도는 방식 — 문 실행에 따른 상태와 상태 전이, 제어 흐름**
3. 대입문 · 조건문 · 반복문 · 기본 입출력
4. 모듈성 — 함수(**그리고 언어가 지원하면 메서드와 클래스**) · 인자 전달 · 스코프 · 추상화 · 캡슐화
5. 파일·API 입출력 → 6. 구조화된 데이터 타입 → 7. 라이브러리 → 8. 재귀 → 9. 실행 오류 →
   10. 시험·디버깅 → 11. 문서화

학습 성과 열넷 중 셋이 우리 단과 그대로 겹친다 — **11 「주어진 프로그램을 읽고 무엇을 하는지
설명한다」** · 12 「모듈이 무엇을 하는지 명세를 쓴다」 · **13 「실행 중 제어 흐름을 추적한다」**.

**1번이 우리 0부이고 2번이 `cs/` 와 값 상자다. 클래스는 4번의 괄호 안에 있다.** 우리 부 배치
(0부 값과 식 → 1부 흐름과 묶기 → 2부 객체 → 3부 프레임워크)와 CS2023 SDF 의 주제 순서가 **1·2·3·4
에서 그대로 맞는다.** 이것이 이 절에서 가장 강한 대조다 — 논쟁의 두 진영 중 하나를 고른 것이
아니라, 규정을 그만둔 최신 표준의 주제 순서와 같다.

#### 교재·코스 여섯의 목차 (전부 직접 확인)

| 교재·코스 | 값·식 | 객체 | **참조 의미론** | 갈래 |
|---|---|---|---|---|
| Head First Java 3e (2022) | **ch3** Know Your Variables (p49) | **ch2** A Trip to Objectville (p27) | ch3 (primitives and references) | objects-first |
| Core Java v1 13e (Horstmann) | ch3 Fundamental Programming Structures | ch4 Objects and Classes | ch4 (Method Parameters) | fundamentals-first |
| Think Java 2e (Downey & Mayfield) | **ch2** (§2.3 Memory Diagrams · §2.7 Rounding Errors) | ch9 Immutable / ch10 Mutable Objects | **ch7** Arrays and References | objects-late |
| Building Java Programs 5e (Reges & Stepp) | ch2 Primitive Data | **ch8** Classes | ch3.3 Using Objects · ch4.1 Object Equality | objects-late |
| MOOC.fi Java Programming (헬싱키) | part1 (변수·계산·조건) | **part4** intro to OOP | **part5.3 primitive and reference variables · 5.4 objects and references** | objects-late |
| Oracle Java Tutorials (Learning the Java Language) | lesson2 Language Basics | **lesson1** OOP Concepts · lesson3 Classes and Objects | lesson3 | concepts-first |

**갈리는 자리는 「객체가 언제」가 아니라 「참조 의미론이 언제」다.** 여섯 중 다섯이 참조 의미론을
**객체를 낸 뒤**에 둔다. Think Java 하나만 앞에 두고, 그 방법이 **배열**이다 — ch7 「Arrays and
References」가 사용자 클래스 없이 참조를 가르친다.

MOOC.fi 가 이 순서를 가장 늦게 잡았다. 참조 대 값은 part 5 이고 객체는 part 4 다 — 한 파트가
5~20시간이므로 **참조 의미론까지 40~100시간**이다. 이 코스는 Extreme Apprenticeship(Vihavainen,
Paksula & Luukkainen 2011, SIGCSE)이 붙어 있어 순서와 연습 형태가 공개돼 있고 이탈률 감소가
보고돼 있다 — 순서의 근거가 아니라 **연습 방식의 근거**다.

#### 우리 순서와의 대조 — 우리가 여섯 전부보다 앞이다

`java.md` §1.5.1 은 `java/reference-binding`(축 G)과 `java/reference-equality`(축 H)를 **0부**에
둔다. 0부는 1부(`class-declaration`·`method-declaration`)보다 앞이고 2부(`new-expression`)보다
훨씬 앞이다. **여섯 교재 어느 것보다도 이르다.**

근거가 있는 결정이다 — Ma 2007 의 17% 가 「나중에 가르쳤더니 안 됐다」는 실측이고, 뒤로 미룰수록
좋아진다는 근거는 없다. 그러나 **걸리는 것이 하나 있다.**

`java.md` §1.5.1 은 `reference-equality` 의 「초보가 틀리는 자리」로 `new String("a") == "a"` 를
든다. **`new` 는 2부(§4 #16)다.** 0부의 판이 2부의 문법을 쓴다.

Think Java 가 이미 답을 보여 준다 — **참조를 사용자 클래스 없이 가르치는 재료가 있다.**
자바에서 그 재료는 셋이고 셋 다 0부·1부 안에 있다: `String` 리터럴(0부 축 C, 표본 560곳/66파일) ·
배열(1부) · **`Integer` 오토박싱**(0부 축 F, 표본 **256곳/65파일**). 셋 중 오토박싱이 유일하게
`new` 를 안 쓰고 사용처도 가장 두껍다. §12.6 ②가 그 교체다.

---

### §12.3 이 언어에 특유한 연습 형태

`pedagogy.md` §4 의 세 시험을 열로 든다 — **T1 이식**(다른 아홉 언어로 옮기면 답이 **사라지나**.
그저 달라지는 것은 `siblings` 가 이미 하는 일이라 일반론) · **T2 조항**(대표 오답이 명세 조항 ·
오류 코드 · progmiscon 항목 하나로 설명되나) · **T3 사전**(`universal` 이 `null` 인가).

| 후보 연습 | T1 | T2 | T3 | 판정 |
|---|---|---|---|---|
| 스택·힙 그리기 (참조 대 값) | ✕ | ○ | ✕ | **탈락 — 일반론** |
| ↳ 좁힘: **`int` 와 `Integer` 가 같은 자리에서 다른 규칙을 따른다** | ○ | ○ JLS §5.1.7 | ○ `autoboxing` = `null` | **통과** |
| `static` 대 인스턴스 예측 | 부분 | ○ | ✕ | 부분 |
| ↳ 좁힘: **`static` 문맥에서 인스턴스 필드를 이름만으로 읽으면 컴파일이 멈춘다** | ○ | ○ `non-static variable … cannot be referenced from a static context` · progmiscon `ThisExistsInStaticMethod`(자바 전용) | ○ `java/static` → `common/static-member` 이지만 이 오답은 자바 전용 | **통과** |
| 오버로딩/오버라이딩 해석 예측 | 부분 | ○ JLS §15.12.2 | ✕ `common/inheritance` | **부분 통과 — 「정적 오버로딩이 있는 언어군」**(java·csharp·swift) |
| 예외 전파 추적 | ✕ | 부분 | ✕ | **탈락 — 일반론** |
| ↳ 좁힘: **검사 예외 — 잡거나 `throws` 로 넘기거나를 문법이 강제한다** | ○ | ○ JLS §11.2 | ○ `checked-exception` = `null` | **통과** |
| **DI 추적 — 「`new` 없이 온 객체는 누가 만들었나」** | ✕ | ○ | — | **탈락 — 자바가 아니라 `spring/` 의 것** |
| 제네릭 소거 예측 | ✕ | ○ | ✕ `common/generics` | **탈락 — 답이 다를 뿐 물음은 선다** |
| ↳ 좁힘: **같은 소거를 갖는 두 메서드를 오버로드하면 컴파일이 안 된다** | ○ | ○ JLS §8.4.2 `name clash: … have the same erasure` | ○ `generics-erasure` 의 이 오답은 자바 전용 | **통과** |

**DI 추적의 탈락을 적어 둔다 — 오케스트레이터의 예상과 반대다.** 「`new` 를 안 했는데 객체가 왔다」는
파이썬 FastAPI `Depends` · C# ASP.NET Core · TS NestJS · Go wire 에 그대로 있다. 답이 사라지지
않는다. 그리고 그 물음의 근거는 **자바의 의미론이 아니라 프레임워크의 런타임**이다 — `java/` 21장이
전부 문법 표면이고 그것으로 `@Autowired` 를 설명 못 한다는 것을 `spring.md` §1 이 이미 적었다.
**우리 구조에 이미 자리가 있다: `spring/dependency-injection`, 3부.** 자바 문서가 이것을 「이 언어
특유」로 주장하면 D176 이 만든 경계를 되돌리는 것이 된다.

좁히면 통과하는 자바 쪽 판이 하나 남는다 — **`private final` 필드는 생성자에서만 대입된다**
(JLS §8.3.1.2 · 확정 대입 §16.9). 그런데 스프링 필드 주입은 리플렉션으로 그것을 우회한다.
「언어가 못 하게 한 일이 실행 시각에 일어난다」는 자바 안에서 답이 있고, 이것은 `java/final` 과
`spring/dependency-injection` 이 **함께** 만드는 판이다. 3부의 자리다.

#### 표현 가능한가 — 형식·단·그림

`pedagogy.md` §3.2 가 형식 둘을 새로 세웠다: **`order`**(Parsons — 조각 정렬, `pct` = 맞은 인접
쌍 / (N−1)) · **`trace-table`**(시간 × 변수 격자, `table` 채점기 + `step` 이월 채점).
아래 표는 그 이름을 쓴다. 새로 짓지 않았다.

| 통과한 연습 | 형식 | 단 | 그림 |
|---|---|---|---|
| `int`/`Integer` 두 규칙 | **`trace-table`** (열: `int i` · `Integer boxed` · `i == boxed` · `boxed1 == boxed2`) | 0부(다섯 단 밖) | 메모리 줄 |
| `static` 문맥 | `value` — **답이 「컴파일 오류」다** | 2부 | 스택 프레임 |
| 검사 예외 | `value` — 같음 | 2부 | 스택 프레임 |
| 같은 소거 오버로드 | `value` — 같음 | 2부(심화) | — |
| 오버로딩/오버라이딩 해석 | `value` (호출되는 몸의 클래스 이름을 적는다) | 2부 | 스택 프레임 |

**안 쓰는 형식 셋과 그 이유**(README §12 규약 6) — `step` 은 **0부의 산술 축에서 쓰고 여기서는
안 쓴다**(통과한 연습 다섯 중 접을 식이 있는 것이 없다) · `build` 는 러너를 기다린다
(`fundamentals.md` §2.3, 자바는 어댑터가 있으므로 이 언어가 먼저 열릴 후보다) ·
`order`(Parsons)는 **자바 특유가 아니라서** 안 쓴다 — 여기 통과한 다섯은 전부 「이 코드가 무엇을
내나」이고 순서 문제가 아니다. 4단 `patch-place` 가 이미 한 줄짜리 `order` 다(`pedagogy.md` §2.2).

**넷이 형식 넷으로 안 되는 자리에서 만난다 — 답이 값이 아니다.**

- 「컴파일이 안 된다」가 정답인 판이 셋이다. `value` 의 `expected: FundValue` 는 값만 싣는다.
- 그리고 `Integer a = 128, b = 128; a == b` 의 정답은 `false` 가 **아니다** — §12.4 가 JLS 원문으로
  보인다. **「명세가 안 정한다」**가 정답이다. 오늘 그것을 적을 칸이 없다.

**새 형식이 아니라 `FundValue` 의 변형 둘을 신청한다** — `{t:'compile-error'}` · `{t:'unspecified'}`.
`order`·`trace-table` 로 안 되는 이유는 한 줄이다: **둘 다 답이 있다는 전제 위에 선다**
(`order` 는 순열, `trace-table` 은 격자). 형식이 아니라 **답의 종류**가 모자란 것이라 새 채점기가
안 생긴다 — `gradeValue` 의 분기 둘이다. `fundamentals.md` §9 가 C 의 미정의 동작에 대해
「가르칠 수 있는 것은 답이 없다는 것뿐이고 그것을 정답으로 받는다」고 이미 적었으므로,
`unspecified` 는 **이미 요구된 것이고 이름이 없을 뿐**이다.

---

### §12.4 연구된 오개념과 그 진단

#### 인벤토리 실측 (2026-09-05)

`progmiscon.org` 의 자바 목록을 세었다 — **55개**. 항목 이름만 가져오고 산문은 안 가져온다(D148 ⑤).

Chiodini 외(2021)의 인벤토리는 발표 시점 **198개**였고 그중 **175개**가 저자들의 정의
(「언어의 문법·의미론만으로 반증되는 진술」)를 통과했다. 같은 논문이 Sorva 의 목록 162개 중
114개(70%), Lewis 의 126개 중 26개가 그 정의를 통과한다고 쟀다. 언어는 자바·자바스크립트·파이썬
셋뿐이고 **자바가 가장 많다.**

각 항목의 「In Other PLs」 링크를 세어 T1 의 참고 값을 얻었다.

| | 수 | 비율 |
|---|---|---|
| 자바 항목 전체 | **55** | |
| 나머지 두 언어에 대응 항목이 **없다** | **23** | 42% |
| 대응 항목이 있다 (Python 26 · JavaScript 6, 겹침 포함) | **32** | 58% |

**이 42% 를 T1 의 답으로 쓰면 안 된다.** 인벤토리에 파이썬·JS 항목이 없는 것은 「그 언어에 그
오개념이 없다」가 아니라 **「아직 안 적었다」**일 수 있다. 예로 `ArraysGrow` 는 자바 전용으로
잡히지만 파이썬 `list` 는 실제로 커지므로, 그 진술은 자바에서 거짓이고 파이썬에서 참이다 —
답이 **사라지는** 것이 아니라 **뒤집히는** 것이라 T1 은 탈락이고, 그 자리는 `siblings` 가 낸다.
**T1 은 우리가 판단하고, 이 표는 그 판단의 참고다.**

#### §10 에 없는데 있어야 할 것 — 여섯

| 이름 | 왜 더하나 | 걸리는 개념 |
|---|---|---|
| `VariablesHoldObjects` · `ReferenceToVariable` | §12.1 의 기계 그 자체다. §10 은 그 **결과**(#1·#2)만 들고 원인을 안 든다 | `reference-binding` |
| `CharNotNumeric` | 0부 축 C. `'a' + 'b'` 가 `195`(`int`)다. 자바 전용 항목 | `text-length` |
| `StringPlusStringifiesExpression` · `ArithmeticPlusPrecedes` | 0부 축 E. `1 + 2 + "a"` 가 `"3a"` 인 이유가 둘로 갈린다 — 왼쪽부터 접힌다는 것과, `+` 가 문자열을 만나기 **전에** 숫자로 접힌다는 것 | `string-concat` · `operator-precedence` |
| `LargeIntegerLong` · `NoFloatLiterals` · `NoLongLiterals` | 0부 축 A·B. `1.5` 가 `double` 이라 `float f = 1.5;` 가 막히는 자리(§1.5.1 이 이미 지문에 적었으나 오개념 목록에는 없다) | `floating-type` · `integer-limit` |
| `RecursiveActivationsShareFrame` · `ReturnUnwindsMultipleFrames` | **스택 프레임 그림의 첫 소비자**다. Lister 외 2004 의 12문항 중 두 번째로 어려운 문항(정답률 42%)이 `for` 안의 `return` 이었고, 저자들이 「이 오개념이 기관과 국가를 가로질러 일관된다」고 적었다 | `return-statement` · `method-declaration` |
| `ThisExistsInStaticMethod` | §10 #5 를 갈라야 한다 — 「필드를 못 읽는다」와 「`this` 가 없다」는 다른 진술이고, 후자가 원인이다 | `static` |

#### §10 #13 은 명세와 어긋난다 — 정정

`java.md` §11 이 「JLS §5.1.7 · 확인 못 함」으로 남겨 둔 자리다. **원문을 열어 확인했다**
(JLS SE21 §5.1.7 Boxing Conversion).

> If the value `p` being boxed is the result of evaluating a constant expression … or an integer
> in the range `-128` to `127` inclusive, then let `a` and `b` be the results of any two boxing
> conversions of `p`. It is always the case that `a == b`.

그리고 범위 **밖**에 대해 같은 절이 이렇게 적는다.

> For other values, the rule disallows any assumptions about the identity of the boxed values on
> the programmer's part. This allows (but does not require) sharing of some or all of these references.

**§10 #13 의 「그 밖은 거짓이다」는 틀렸다.** 명세는 거짓을 보장하지 않는다 — **정하지 않는다.**
구현이 캐시해도 된다. 그리고 보장이 걸리는 것은 **상수 식**일 때뿐이다.

이 정정이 문항 설계를 바꾼다.

| 문항 | 오늘 §10 이 함의하는 답 | 명세가 정하는 답 |
|---|---|---|
| `Integer a = 127, b = 127; a == b` | `true` | `true` (보장) |
| `Integer a = 128, b = 128; a == b` | `false` | **「명세가 안 정한다」** |

두 번째를 `false` 로 채점하면 앱이 **틀린 확신을 가르친다.** 여기가 §12.3 의 `unspecified` 가
필요한 실물 자리다.

#### 오답 → 오개념 진단

「값을 적게 했을 때 어떤 오답이 나오면 이 오개념인가」. `fundamentals.md` §5 의 계산된 진단
아홉(`other-language` · `type-drift` · `ideal-math` · `rounding` · `sign` · `spelling` ·
`blank` · `unparsable` · `unknown`)으로 잡히는지를 마지막 열에 적는다.

| 판 | 오답 | 오개념 | 계산된 진단이 잡나 |
|---|---|---|---|
| `7 / 2` | `3.5` | 다른 언어의 규칙 | ○ `other-language`(파이썬) |
| `7 / 2` | `3.0` | 결과 타입이 피연산자 타입에서 온다는 것을 모른다 | ○ `type-drift` |
| `(int) 3.9` | `4` | 캐스트가 반올림이라고 믿는다 | ○ `rounding` |
| `-7 / 2` | `-4` | 버림이 아래쪽이라고 믿는다 | ○ `other-language`(파이썬 `//`) |
| `0.1 + 0.2` | `0.3` | `ideal-math` | ○ |
| `'a' + 'b'` | `"ab"` | `CharNotNumeric` | ○ `other-language`(파이썬·JS 는 `"ab"`) |
| `"a" + 1 + 2` | `"a3"` | `ArithmeticPlusPrecedes` — 왼쪽부터가 아니라 산술이 먼저라고 믿는다 | **✕ 자바 안의 오답이다** |
| `Integer.MAX_VALUE + 1` | `2147483648` | `LargeIntegerLong` — 넘치면 넓은 타입이 된다 | ○ `other-language`(파이썬 무한 정수) |
| `Integer a=128,b=128; a==b` | `true` / `false` | `EqualityOperatorComparesObjectsValues` / **명세를 결정으로 오해** | **✕ 자바 안의 오답이다** |
| `String s = new String("a"); s == "a"` | `true` | `EqualsComparesReferences` 의 반대편 | **✕ 자바 안의 오답이다** |
| `static` 문맥의 필드 접근 | 값을 적는다 | `ThisExistsInStaticMethod` | **✕ 답이 컴파일 오류다** |

**열하나 중 넷이 계산된 진단으로 안 잡힌다.** 넷 다 「다른 언어의 답」이 아니라 **자바 안에서
갈리는 두 규칙 중 틀린 쪽**이다. 그러므로 **자바 전용 오답 카탈로그가 필요하다** — 크지 않다.
넷이 요구하는 것은 `siblings` 옆에 **`javaAlt`**(같은 식에 대해 자바 안의 다른 규칙을 적용했을 때
나오는 값과 그 오개념 이름) 한 칸이고, 값 네 개다. 사전이 아니라 카탈로그다
(`packages/cards/src/fundamentals.ts`) — 개념마다 다르지 않고 **식마다** 다르기 때문이다.

#### 판별력 검사 — 생성기가 지켜야 할 규칙 하나

Ma 외(2007)의 후속 연구가 **실패를 하나 보고했고 그 실패가 우리에게 규칙을 준다.**
60명 중 비생존 모형을 가진 이들에게 인지 갈등 + 시각화를 걸었더니, **대입 과정**의 모형은
18명 중 14명(78%)이 생존 모형으로 바뀌었다. 그런데 **실행 흐름**의 모형은 12명 중 절반이 그대로였다.
저자들이 원인을 찾았다 — 쓴 예제가 이랬다.

```
int a = 10, b = 20, c = 30;
Line1: a = b;
Line2: b = c;
```

「문들이 동시에 실행된다」는 틀린 모형을 가진 학생도 **이 예제에서는 맞는 답을 낸다.**
Line1 이 돌든 안 돌든 Line2 의 결과가 같다. 저자들이 제안한 대체 예제는 `Line2: c = a;` 다.

**규칙**: 값 적기 문항의 식은 **틀린 모형이 다른 답을 내는 식이어야 한다.**
`buildValueItems` 가 카탈로그 식을 고를 때 이 검사를 통과시켜야 한다 — 후보 식마다
`siblings` + `javaAlt` 의 값이 정답과 **전부 다른가**를 보고, 하나라도 같으면 그 식을 안 낸다.
값싸다(문항 생성 시각의 배열 비교). 이 검사가 없으면 §12.4 의 진단 표 전체가 헛돈다.

---

### §12.5 우리 앱에서 그 학습법이 서는 자리

#### 「내 코드가 교재」가 부마다 성립하나

`java.md` §1.5.3 · §2 의 실측을 부별로 가른다(표본 `MonggleMonggle` 자바 99파일 4,908줄).

| 부 | 판 | 내 코드에서 확인 | 판정 |
|---|---|---|---|
| 0부 값과 식 | 19 | **10 (53%)** — 얇음 2, 합성 7 | **갈린다** — 아래 |
| 1부 흐름과 묶기 | 8 | 7 (`for-loop` 하나가 `idiom`) | 선다 |
| 2부 객체 | 16 | 13 (셋이 D158 경로 — `abstract-class`·`generic-bound`·`equals-hashcode`) | 선다 |
| 3부 프레임워크 | 15 | 14 (표본에서 `spring/bean-lifecycle` 만 안 선다) | 선다 |
| **0·1·2부 합** | **43** | **30 (70%)** | |

1·2부의 값은 `java.md` §2 「표본 리포에서 실제로 서는 목차」의 실측이고, 1부는 0부가 다섯을 가져간
뒤의 여덟 기준으로 다시 세었다. 3부는 합에서 뺐다 — 성질 게이트가 재려는 것은 **합성 교재로 배운
개념이 내 코드를 짚는가**이고 3부는 처음부터 내 코드가 정본이다(D177 규칙 ②).

**0부 안에서 축이 갈린다.** 사용처가 0이거나 그에 가까운 여섯이 축 A(정수 한계 2곳)·B(실수 3곳,
`floating-type` 9곳)·C(`char` **0곳**)·E(나눗셈 **0곳**)·F(캐스트 **0곳**)에 몰려 있고,
축 F 뒤쪽·G·H 는 반대다 — 오토박싱 **256곳/65파일** · 선언 대입 187/34 · `==`/`!=` 46/14 ·
`.equals` 15/5.

**§12.1 의 기계가 서는 축이 바로 그 두꺼운 쪽이다.** 참조 의미론(축 G·H)과 원시/래퍼 경계(축 F)는
표본 리포에서 실물로 확인되고, 자바에서 학습자가 실제로 막히는 자리(Ma 2007 의 17%)가 거기다.
못 서는 것은 산술·캐스트·`char` 이고, 그것들은 **합성이 정본**이다(D177 규칙 ① — 「네 코드엔 없다」
+ 사유 `scale`·`idiom`).

#### 로그인 챕터가 §12.1 의 기계를 쓰나 — 오늘은 안 쓴다

`exercises.md` §6 의 2단 `hop` 이 내려가는 반쪽을 이렇게 잡는다: `authService.js:21` →
`AuthController.java:32`+`:56` → `:58` → `AuthService.java:78` → `UserMapper.xml:31`.
`chapter-login.md` 2-1 은 21개 지점을 순서대로 짚게 한다.

**그 어느 것도 값을 안 묻는다.** `pedagogy.md` §1.2 가 지적한 어긋남 그대로다 — 연구의 tracing 은
값과 상태를 굴리는 것인데 우리 2단은 경로다. 그리고 CS2023 SDF 의 학습 성과에도 **둘 다** 있다:
13번 「제어 흐름을 추적한다」(우리 2단)와 CS Core 주제 2번 「문 실행에 따른 **상태와 상태 전이**」
(우리에게 없는 것).

**자리가 있다.** `AuthService.login`(`:76`~`:109`)을 열어 확인했다.

| 줄 | 코드 | 값 축에서 일어나는 일 |
|---|---|---|
| `:78` | `User user = userDao.findByLoginId(...).orElseThrow(...)` | `user` 가 힙 상자 **A** 를 가리킨다 |
| `:82` | `passwordEncoder.matches(request.getPassword(), user.getPassword())` | 평문과 해시 — 두 문자열이 다르다는 것이 정상이다 |
| `:87` | `resetDailyCoinIfNeeded(user.getUserId())` | **DB 가 바뀌고 상자 A 의 `coin` 은 안 바뀐다** |
| `:90` | `user = userDao.findById(user.getUserId()).orElseThrow(...)` | **같은 이름이 다른 상자 B 를 가리키게 된다** |
| `:94` | `String role = user.getRole() != null ? user.getRole() : "USER";` | `null` 이 들어올 수 있고 여기서 `"USER"` 로 바뀐다 |
| `:106` | `.coin(user.getCoin())` | 상자 **B** 의 값이 나간다. A 의 값이 아니다 |

`:87` 과 `:90` 사이 한 칸이 **「참조는 상자를 가리킬 뿐 상자를 들고 있지 않다」의 증거**다.
그리고 리포가 그 이유를 스스로 적어 뒀다 — `:89` 주석 「코인 리셋 후 다시 조회하여 최신 코인 값
가져오기」. `exercises.md` §6 의 3단 `reorder` 가 이미 이 두 줄을 쓰는데, 거기서는 「뒤집으면
무엇이 달라지나」를 **4지**로 묻는다. 같은 두 줄이 값 격자에서는 **적게** 만든다.

**판정 — 선다. 그리고 실행이 필요 없다.** `trace-table` 의 열을
`user 가 가리키는 상자`(A/B) · `role` · `token 이 있나` 로 잡으면 모든 칸이 코드에서 결정된다.
**DB 값(`coin` 의 실제 수)은 못 묻는다** — 그것은 러너와 데이터가 있어야 한다.
격자에 `coin` 을 넣되 칸의 답을 숫자가 아니라 **「A 의 값」/「B 의 값」/「같다고 알 수 없다」**로
받으면 채점이 서고, 그 순간 문항이 묻는 것이 값이 아니라 **어느 상자인가**가 된다. 그것이 정확히
§12.1 의 기계다.

`null` 이 어디서 들어오나는 이미 2단 `origin` 이 묻는다 — 단 **파일·줄**로 묻는다
(`exercises.md` §6 의 `origin` 예가 바로 `role` 이다). `trace-table` 은 같은 것을 **값**으로 묻는다.
둘이 겹치는 것이 아니라 축이 다르다.

#### 0장 상한 폐지의 결과 — 자바 학습법 쪽 판단

**자바에서 문제가 아니다. 근거 둘.** ① 자바의 진짜 벽은 참조 의미론이고(Ma 2007 · Kaczmarczyk
2010 의 T1) 그것은 축 F·G·H 에 있는데 셋 다 표본에서 사용처가 두껍다 — 상한이 잘라 낼 만한
「내 코드와 무관한 판」이 아니다. ② 상한 24 가 실제로 자르면 넷째 정렬 키가 **id 알파벳순**이고
(`java.md` §1.5.5), 그 순서는 축을 가로지른다 — 축 G 의 두 판 중 하나만 남는 식이 된다.
자르는 규칙이 학습 순서를 모르는 상태에서 도는 것이 상한을 지키는 것보다 나쁘다.

**문제인 자리는 하나다.** 축 A·B(정수 한계·실수)가 이 리포에서 0~3곳이라, 0부 15~17일 중
**닷새 안팎이 내 코드와 무관한 합성**이 된다. 그것이 D136·D147 이 상한으로 막던 「튜토리얼로의
변질」의 실물이고, `pedagogy.md` §5 가 권한 **성질 게이트**(내 코드를 짚는 판의 비율)가 재야 할
자리다. 자바의 오늘 값을 위 표가 준다 — **0부 19판 중 10판(53%) · 0·1·2부 합 43판 중 30판(70%)**.
0장(깊이 ≤ 2, 21판)에 대한 비율은 **안 쟀다.**

---

### §12.6 바꿀 것 — diff

**본문은 안 고쳤다.** 아래는 제안이고 등록부 행 번호는 오케스트레이터가 매긴다.

| # | 무엇을 | 어디서 → 어디로 | 근거 |
|---|---|---|---|
| ① | 「메모리 줄」의 언어 열에 `java` 를 더한다 (새 그림이 아니다) | `diagrams.md` §3 명세만 표 `C·C++·Rust·Go` → `+ java` | `java.md` §1.5.1 이 이미 넉 장에 걸었다(명세와 불일치) · §12.1 표의 오개념 아홉이 이 그림에 걸린다 · Holliday & Luginbuhl 2004 |
| ② | 0부 축 H `reference-equality` 의 대표 예를 `new String("a") == "a"` → **`Integer` 캐시**로 | `java.md` §1.5.1 축 H 행 | `new-expression` 이 2부(§4 #16)라 0부가 2부 문법을 쓴다 · 오토박싱 사용처 256곳/65파일 |
| ③ | §10 #13 을 「그 밖은 거짓」 → **「명세가 정하지 않는다. 보장은 상수 식 −128~127 뿐」**으로 | `java.md` §10 · §11 의 「확인 못 함」 행 제거 | JLS SE21 §5.1.7 원문 (§12.4) |
| ④ | `FundValue` 에 `{t:'compile-error'}` · `{t:'unspecified'}` 두 변형 | `fundamentals.md` §6 payload · `packages/grading/src/fundamentals.ts` | §12.3 의 통과 연습 셋이 컴파일 오류를 답으로 갖는다 · ③ · `fundamentals.md` §9 의 UB 항목이 이미 요구 |
| ⑤ | 카탈로그에 **`javaAlt`** 한 칸 (자바 안의 다른 규칙이 내는 값 + 오개념 이름) | `packages/cards/src/fundamentals.ts` | §12.4 진단 표 — 열하나 중 넷이 `siblings` 로 안 잡힌다 |
| ⑥ | **판별력 검사** — 후보 식의 `siblings`·`javaAlt` 값이 정답과 전부 달라야 문항으로 낸다 | 같은 파일 `buildValueItems` | Ma 외 후속 연구의 실패 사례 (§12.4) |
| ⑦ | §10 에 오개념 여섯 추가 | `java.md` §10 | progmiscon 자바 55 중 §10 이 안 든 것 (§12.4) |
| ⑧ | 로그인 챕터 2단에 `trace-table` 한 판 (`AuthService.java:78~106`) | `chapter-login.md` §3 | `pedagogy.md` §1.2 의 구멍 · CS2023 SDF CS Core 주제 2 · §12.5 |
| ⑨ | §2 의 부 배치 · `course.md` §5.1 의 일수 — **안 바꾼다** | — | objects-first 논쟁의 근거가 「같은 이득, 체감만 다름」이라 순서를 바꿀 근거가 없다. CS2023 SDF 주제 순서와 우리 0·1·2부가 이미 맞는다 (§12.2) |

⑨ 를 표에 넣은 이유는 **바꾸지 않는 것도 판단이기 때문**이다. 이 조사의 결과로 부 배치가 흔들릴
것을 예상했는데, 흔들리지 않았다.

---

### §12.7 출처

「확인」 — **전문**(PDF 를 열어 읽음) · **초록** · **2차**. 1차/2차 표시를 함께 단다.

| # | 출처 | 1차/2차 | 확인 |
|---|---|---|---|
| 1 | Reges, S. 2006. *Back to Basics in CS1 and CS2.* SIGCSE '06. https://doi.org/10.1145/1121341.1121432 (저자 사본 https://homes.cs.washington.edu/~reges/sigcse/basics.pdf) | 1차 | **전문** |
| 2 | Ehlert, A. & Schulte, C. 2009. *Empirical comparison of objects-first and objects-later.* ICER '09. https://doi.org/10.1145/1584322.1584326 | 1차 | 초록·2차 (ACM PDF 403) |
| 3 | Uysal, M. P. 2012. *The Effects of Objects-First and Objects-Late Methods on Achievements of OOP Learners.* Journal of Software Engineering and Applications 5(10). https://doi.org/10.4236/jsea.2012.510094 | 1차 | 초록 |
| 4 | ACM/IEEE-CS/AAAI **CS2023**, Software Development Fundamentals (SDF) Knowledge Area, Version Gamma, 2023-09. https://csed.acm.org/wp-content/uploads/2023/09/SDF-Version-Gamma.pdf | 1차 | **전문** (7쪽 전량) |
| 5 | Ma, L., Ferguson, J., Roper, M. & Wood, M. 2007. *Investigating the viability of mental models held by novice programmers.* SIGCSE '07. 및 후속 *Improving the Viability of Mental Models Held by Novice Programmers.* https://strathprints.strath.ac.uk/32280/ | 1차 | **전문**(후속 논문) · 2007 수치는 그 안의 보고 |
| 6 | Kaczmarczyk, L. C., Petrick, E. R., East, J. P. & Herman, G. L. 2010. *Identifying Student Misconceptions of Programming.* SIGCSE '10, 107–111. https://doi.org/10.1145/1734263.1734299 (사본 http://publish.illinois.edu/glherman/files/2016/03/2010-SIGCSE-Programming-Misconceptions.pdf) | 1차 | **전문** |
| 7 | Chiodini, L., Moreno Santos, I., Gallidabino, A., Tafliovich, A., Santos, A. L. & Hauswirth, M. 2021. *A Curated Inventory of Programming Language Misconceptions.* ITiCSE '21. https://doi.org/10.1145/3430665.3456343 (사본 https://www.chiodini.org/publications/iticse21-progmiscon.pdf) | 1차 | **전문** |
| 8 | progmiscon.org 자바 목록 (2026-09-05 실측 55개 · 「In Other PLs」 링크 집계) https://progmiscon.org/misconceptions/Java/ | 1차 | **전문**(목록·항목 페이지. 이름만 인용, 산문 미인용 — D148) |
| 9 | Lister, R. 외 2004. *A Multi-National Study of Reading and Tracing Skills in Novice Programmers.* ACM SIGCSE Bulletin 36(4), 119–150. https://doi.org/10.1145/1041624.1041673 | 1차 | **전문** (N=556 · 문항별 정답률 38~74%) |
| 10 | Holliday, M. & Luginbuhl, D. 2004. *CS1 Assessment Using Memory Diagrams.* SIGCSE '04, 200–204. https://doi.org/10.1145/971300.971373 | 1차 | 초록 |
| 11 | van Breugel, F. & Roumani, H. *Let Numbers Point Students the Way: Address-Based Memory Diagrams for OOP.* http://www.cse.yorku.ca/~roumani/abmd.pdf | 1차 | **전문**. **실측 없음 — 설계 논거로만 인용** |
| 12 | Vihavainen, A., Paksula, M. & Luukkainen, M. 2011. *Extreme apprenticeship method in teaching programming for beginners.* SIGCSE '11. https://doi.org/10.1145/1953163.1953196 | 1차 | 초록 |
| 13 | MOOC.fi *Java Programming* (헬싱키대) 파트 1~14 의 절 목록 https://java-programming.mooc.fi/ | 1차 | **전문**(절 목록 전량 수집) |
| 14 | *Java Language Specification*, Java SE 21, §5.1.7 Boxing Conversion. https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html | 1차 | **전문**(해당 절) |
| 15 | Oracle *Java Tutorials* — Learning the Java Language trail 차례 https://docs.oracle.com/javase/tutorial/java/index.html | 1차 | **전문**(차례) |
| 16 | Downey, A. & Mayfield, C. *Think Java*, 2e. 차례·절 목록 https://greenteapress.com/thinkjava7/thinkjava2.pdf | 1차 | **전문**(차례) |
| 17 | Reges, S. & Stepp, M. *Building Java Programs: A Back to Basics Approach*, 5e. 차례 https://www.buildingjavaprograms.com/toc5.shtml | 1차 | **전문**(차례) |
| 18 | Sierra, K., Bates, B. & Gee, T. *Head First Java*, 3e (2022). 차례 https://www.oreilly.com/library/view/head-first-java/9781492091646/preface02.html | 1차 | 2차(검색 결과의 장 제목·쪽수. 원 페이지 403) |
| 19 | Horstmann, C. *Core Java, Volume I: Fundamentals*, 13e. 차례 https://www.informit.com/store/core-java-volume-i-fundamentals-9780135328378 | 1차 | 2차(출판사 차례 요약) |
| 20 | du Boulay, B. 1986. *Some Difficulties of Learning to Program.* JECR 2(1), 57–73 — 다섯 영역의 정의는 출처 7 §2 의 인용으로 확인 | 1차 | 2차(출처 7 안의 인용) |
| 21 | Sorva, J. 2013. *Notional Machines and Introductory Programming Education.* ACM TOCE 13(2). https://doi.org/10.1145/2483710.2483713 | 1차 | 초록 |

**한계.** ① CS2013 본문을 못 열었다(ACM 호스트 403) — 이 문서는 CS2013 에 대해 아무 주장도 하지
않고 **CS2023 SDF 만** 인용한다. ② Ehlert & Schulte 의 표본 크기와 통계량을 못 봤다. 「학습 이득에
차이가 없다」는 초록과 이차 요약이 일치하는 진술이고, **효과 크기를 인용하지 않았다.**
③ Holliday & Luginbuhl 의 상관계수를 못 봤다 — 「상관이 있다」까지만 적었다.
④ Barnes & Kölling 의 *Objects First with Java* 차례를 못 열었다. objects-first 진영의 대표 교재라
표에서 빠진 것이 구멍이고, 그 자리를 Head First Java 하나가 대신하고 있다.
