# 기능 경로 — 학습 단위를 올린다

**결정 등록부** D158(조건부 해제 · `ds/`·`oop/`) · D159(기능 경로가 단위다 · `proto/`).
이 문서는 [`README.md`](./README.md)(언어 열 편)와 [`cs.md`](./cs.md)(기계) 위에 놓인다 —
앞의 둘이 「무엇을 담나」라면 이것은 **「무엇을 단위로 삼나」**다.

---

## 1. 무엇이 바뀌었나

지금까지의 단위는 **개념**이었다. `py/assignment` 한 장, `ts/optional-chaining` 한 장.
사용자가 원한 것은 그게 아니었다.

> 로그인 기능은 어떻게 이루어지며 JWT 란 무엇인가? 이 데이터베이스의 스키마는 어떻게
> 설계되어 있는가? 자바 객체지향이란 무엇이며, **이 기능을 하나 만들기 위해 어떤 코드들이
> 유기적으로 연결되어 있는가?**

단위가 **기능**이고, 재료가 **경로**다. 개념은 그 경로 위에 얹힌다.

---

## 2. 실측 — `MonggleMonggle` (Spring + Vue)

291파일 · 254커밋. 확장자 분포와 **오늘 읽히는지**:

| | 파일 | 읽히나 | 막는 것 |
|---|---|---|---|
| Java (Spring) | 99 | ✗ | `langs.rs` 에 `tree-sitter-java` 크레이트 없음 |
| SQL | 27 | ✓ | (다만 진짜 스키마는 XML 안에 있다) |
| Vue | 24 | ✗ | 문법 없음 · SFC 는 한 파일에 문법 셋 |
| JS | 22 | ✓ | |
| XML (MyBatis 매퍼) | 20 | ✗ | 문법 없음 · SQL 이 이 안에 산다(2단 파싱) |
| Python (AI API) | 16 | ✓ | |

### 로그인 하나가 17파일 · 8디렉터리다

```
config/SecurityConfig.java              필터 체인
security/JwtAuthenticationFilter.java   헤더를 열어 본다
security/JwtUtil.java                   토큰을 만들고 검증한다
controller/AuthController.java          @PostMapping("/login")
service/AuthService.java                업무 규칙
model/dao/UserDao.java                  자료 접근
model/dto/request/LoginRequest.java     들어오는 모양
model/dto/response/LoginResponse.java   나가는 모양
model/entity/User.java                  표 한 줄
util/SecurityUtil.java
exception/UnauthorizedException.java
resources/mapper/user/UserMapper.xml    ← SQL 이 여기 산다
FRONT/src/services/authService.js       api.post("/auth/login")
FRONT/src/stores/authStore.js
FRONT/src/composables/useUserStorage.js
```

**오늘 읽히는 것은 프론트 JS 셋뿐이다.** 가르치려는 것의 심장이 통째로 안 보인다.

---

## 3. 이음매가 문자열이다 — 이 문서에서 가장 중요한 사실

```js
// FRONT/src/services/authService.js
const response = await api.post("/auth/login", credentials);
```
```java
// BACK/.../controller/AuthController.java
@RestController
@RequestMapping("/api/auth")     // ←
@PostMapping("/login")           // ← 둘을 이으면 위의 줄과 만난다
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request)
```

프론트가 부르는 자리와 백이 받는 자리가 **양쪽 다 문자열 리터럴**이다. tree-sitter 로 뽑아
이을 수 있다. 그리고 자리가 이미 있다 —

- `import_edge.kind` 가 `('static','type','dynamic','http')` 다. **`http` 가 이미 스키마에 있다.**
- `resolve-imports.ts:219` 가 Next.js 라우트로 **이미 `kind: 'http'` 간선을 만든다.**

프레임워크가 다를 뿐 같은 수다. 「뷰가 백엔드와 어떻게 통신하는가」는 **설명해 줄 것이 아니라
간선으로 그려 보여 줄 것**이다.

---

## 4. 지금 대지 탐지는 「기능」이 아니라 「층」을 낸다

`units.ts` 는 `source='dir'` 만 MVP 다. Spring 은 package-by-layer 라 이 리포에 돌리면
대지가 **「컨트롤러」·「서비스」·「DAO」**로 나온다. 층이지 기능이 아니다.
사용자가 알고 싶은 「로그인」은 그 층들을 **세로로 관통한다.**

커밋 클러스터(254개)가 이걸 훨씬 잘 잡는다 — 로그인은 몇 개 커밋으로 만들어졌다.
`units.ts` 주석이 이미 자리를 비워 뒀다.

---

## 5. 가르치는 모양

대지 하나 = 기능 하나 = 경로 한 줄기. 그 **위에서** 네 층의 문항이 나온다.

```
로그인 (대지)
 LoginView.vue          버튼을 누른다
   └ authService.js     api.post("/auth/login")        ← HTTP 이음매
       └ AuthController.java   @PostMapping("/login")
           └ AuthService.java
               └ UserDao.java
                   └ UserMapper.xml   ← SQL
                       └ DB
 돌아오는 길: LoginResponse.token → localStorage
 다음 요청부터: JwtAuthenticationFilter → SecurityConfig 의 필터 체인
```

| 층 | 네임스페이스 | 이 경로에서 나오는 물음 |
|---|---|---|
| **어휘** | `<lang>/` · `common/` | `@PostMapping` 이 무엇을 하나 · `@RequestBody` 는 무엇을 바꾸나 |
| **기계** | `cs/` · `exec/` | 토큰이 왜 localStorage 에 있고 **서버는 왜 기억하지 않나** |
| **판단** | `arch/` · `ds/` · `oop/` | Controller·Service·Dao 를 왜 갈랐나 · DTO 와 Entity 를 왜 따로 두나 |
| **규약** | **`proto/`** (신설) | **JWT 가 무엇이며 세션과 무엇이 다른가** |

「JWT 란 무엇인가」는 언어도 기계도 설계도 아니다. **네 번째 종류**이고 새 네임스페이스가 필요하다.
HTTP 메서드·상태 코드·REST·CORS·비밀번호 해싱이 같은 통에 든다.

---

## 6. 범용성 — 어디까지 되고 어디서 내려앉나

**「깃허브의 어느 프로젝트든 이 수준으로」는 안 된다.** 정확한 약속은 셋으로 갈린다.

### 티어 A — 한 번 쓰면 모든 리포에 듣는다

| 무엇 | 왜 범용인가 |
|---|---|
| 언어 어휘 (`<lang>/`, 10언어) | 그 언어면 어느 리포든 같다 |
| 기계 (`cs/`, 43개) | 값과 참조·부동소수·복잡도는 프레임워크를 안 탄다 |
| **규약 (`proto/`)** | **JWT 가 무엇인가는 리포마다 다르지 않다.** 한 번 쓰면 끝 |
| 판단 (`arch/`·`ds/`·`oop/`) | AST·그래프에서 **재는** 것이라 프레임워크 무관. 중첩 반복은 어디서나 중첩 반복 |

**사용자가 말한 것의 상당 부분이 여기 있다** — 「자바 객체지향이란 무엇인가」 ·
「JWT 란 무엇인가」 · 「수학적 사고를 위한 알고리즘」 · 「CSS 정의」 · 「자바스크립트의 역할」.
이것들은 그 리포에 관한 물음이 아니라 **그 리포를 계기로 하는 물음**이다.

### 티어 B — 프레임워크마다 규칙 하나씩

| 무엇 | 왜 안 끝나나 |
|---|---|
| HTTP 간선 | 라우트를 적는 법이 Spring·Django·Express·NestJS·Rails 마다 다르다 |
| 기능 대지 탐지 | 층으로 나누는지 기능으로 나누는지가 관례마다 다르다 |
| 스키마 추출 | JPA 엔티티 · MyBatis XML · 마이그레이션 · Prisma · Django models |
| 프레임워크 사전 | `spring/` · `vue/` · … 개수가 안 끝난다 |

**덮은 만큼 깊어진다.** 안 덮은 스택에서 앱이 죽지는 않고 **내려앉는다** —
Django 리포라면 티어 A 전부 + 파이썬 import 그래프까지 되고, HTTP 간선이 없어
경로가 백엔드 안에서만 그려진다.

### 티어 C — 코드에 없어서 안 되는 것

- **런타임 서술** — 「필터가 컨트롤러보다 먼저 돈다」는 AST 에 없다. Spring 이 하는 일이다.
- **설계 의도** — 「왜 이렇게 만들었나」
- **실행해 봐야 아는 것** — T3 는 지금 `NOT_IMPLEMENTED` 다(실행이 Tauri `shell` 스코프와
  샌드박스 결정을 끌고 와 MVP 밖).

**그런데 C 에는 이미 답이 설계돼 있다 — 사다리 4단.**
`ladder_event.action` 에 `prompt_built`·`copied` 가 있다. 앱이 프롬프트를 만들고 **사람이 들고 나간다.**
그 프롬프트는 「이 줄과 앞뒤 4줄만, 디렉터리 경로·리포명 제외, 파일 이름만」이다(정본 §3-1).
**「코드는 컴퓨터 밖으로 나가지 않는다」를 지키면서 LLM 을 쓰는 방법이 이미 있다.**

---

## 7. 필요한 것과 순서

| # | 무엇 | 크기 |
|---|---|---|
| 1 | `tree-sitter-java` + `java/*.scm` | 이 리포의 99파일이 열린다. `grammarSchema` 의 `java` 는 D156 이 이미 넣었다 |
| 2 | **HTTP 간선** — 라우트 문자열 양쪽 잇기 | 선례 있음(`resolve-imports.ts:219`). Spring·Vue 규칙 하나씩 |
| 3 | 커밋 클러스터 대지 | `units.ts` 가 자리를 비워 뒀다 |
| 4 | `proto/` — JWT·HTTP·REST·해싱 | `cs/` 와 같은 모양(쿼리 없음, 사용처 빌림) |
| 5 | Vue SFC · MyBatis XML | 한 파일 다중 문법 · 2단 파싱. `extensions` 모델을 손대야 한다 |
| 6 | `spring/` · `vue/` 프레임워크 사전 | `react/` 가 선례. 단 **`framework:` 필드에 소비처가 없다**(README §6-3) |

**첫 조각은 1+2 다** — 그것만 되면 이 리포에서 로그인 경로가 실제로 그려지는지 눈으로 본다.
안 그려지면 나머지 넷을 짓기 전에 알게 된다.

---

## 8. 정본에 요구하는 것 (사용자가 고친다)

이 문서는 정본을 바꾸지 않는다(§7 인계 규칙). 아래는 정본이 달라져야 하는 자리다.

| 정본 절 | 현재 | 갱신해야 하는 것 |
|---|---|---|
| §4 「내 코드가 교재」 | 예외 없음 | **조건부 예외** — 리포에 없는 개념은 「없다」를 명시하고 별도 대지에, 예산의 일부만 (D158) |
| §2 트랙 표 | T0 문법 · T1 클론 · T2 구조 | T2 의 대상이 **파일 관계 + 기능 경로**로 넓어진다 (D159) |
| §2 대상 | 「자기 코드를 이해 못 하는 사람」 | 그대로. 다만 **가르치는 것이 문법에서 기능으로** 올라간다 |
| §9 범위 | — | 범용성의 정확한 약속을 §6 의 세 티어로 적는다 — 「어느 리포든」이 아니라 **「덮은 스택은 이 수준, 안 덮은 스택은 티어 A 까지」** |
