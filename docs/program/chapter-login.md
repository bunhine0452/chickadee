# 로그인 챕터 — 실물

표본: `MonggleMonggle` (Spring Boot 3.5.8 · Vue 3 · MyBatis · MySQL). 인용한 파일·줄은 전부 열어 확인했다. 프레임은 공통 계약 §2.

---

## 1. 이 챕터가 여는 것

1. 로그인 버튼 한 번에 도는 **21개 지점을 순서대로 짚는다** — Vue 폼에서 MySQL `users` 표까지, 되돌아오는 토큰까지.
2. **「서버는 로그인한 사람을 기억하지 않는다」를 자기 코드의 줄로 말한다** — `SecurityConfig.java:37` 의 `STATELESS` 와 `authService.js:25` 의 `localStorage.setItem("accessToken", ...)` 이 한 문장의 앞뒤다.
3. 토큰을 **만드는 자리**(`JwtUtil.java:32-39`)와 **여는 자리**(`JwtAuthenticationFilter.java:34-47`)를 갈라 짚는다.
4. 없는 아이디는 404, 틀린 비밀번호는 401 이라는 사실(`AuthService.java:79`·`83`)을 찾아내고, 계정 존재 여부가 왜 새는지 말하고 고친다.
5. 서버 로그아웃(`AuthController.java:65-69`)이 **아무 일도 하지 않는 5줄**인 이유를 2번으로 설명한다.

원 물음과 맞대면 — 「로그인은 어떻게 이루어지는가」는 2단이 통째로 답한다. **「JWT 란 무엇인가」는 절반만 답한다.** 서명이 보장하는 것은 이 리포에 코드가 없다. `JwtUtil.java:23` 의 `Keys.hmacShaKeyFor(...)` 한 줄이 전부고 HS256 은 라이브러리 안에 있다. 나머지 절반은 `proto/` 가 대야 한다(§7-4).

---

## 2. 1단 · 읽기

| # | 물음 | 코드 | 정답 | 오답과 진단 |
|---|---|---|---|---|
| 1-1 | 이 줄이 하는 일은 | `AuthController.java:56` `@PostMapping("/login")` | POST `/api/auth/login` 을 이 메서드에 배정한다. 경로는 클래스의 `@RequestMapping("/api/auth")`(32줄)와 **이어 붙은** 것 | 「`/login` 을 받는다」 → 32줄을 안 봤다. 경로가 두 곳에 나뉜 것이 핵심 |
| 1-2 | `@RequestBody` 를 지우면 | `AuthController.java:57` `@Valid @RequestBody LoginRequest request` | 요청 **본문 JSON** 을 `LoginRequest` 로 바꾸지 않는다. 지우면 쿼리 파라미터에서 채우려 해 두 필드가 null 이 된다 | 「`@Valid` 와 같은 일」 → 다르다. `@Valid` 는 `LoginRequest.java:15,18` 의 `@NotBlank` 를 켤 뿐 |
| 1-3 | `authService` 는 어떻게 채워지나 | `AuthController.java:33,36` `@RequiredArgsConstructor` + `private final AuthService` | Lombok 이 final 필드를 받는 생성자를 만들고 Spring 이 그것으로 주입한다. 이 클래스에 `new` 가 없다 | 「Lombok 이 객체를 만든다」 → Lombok 은 **생성자만** 만든다 |
| 1-4 | `#{loginId}` 는 최종 SQL 에서 무엇이 되나 | `UserMapper.xml:34` | `?` 자리표시자가 되고 값은 JDBC 가 따로 바인딩한다 | 「`${loginId}` 와 같다」 → `${}` 는 문자열 치환이라 SQL 주입이 열린다. 이 한 글자가 그 차이 |
| 1-5 | `isLoggedIn` 이 `computed` 인 이유 | `authStore.js:8,13` | `token` 에서 파생돼 자동으로 다시 계산되므로 | 「`ref(false)` 를 로그인 때 true 로」 → 갱신 자리가 는다(`logout()` 99줄·만료). 파생 값을 상태로 둔 실수 |

---

## 3. 2단 · 추적

| # | 물음 | 정답 | 오답과 진단 |
|---|---|---|---|
| 2-1 | 로그인 버튼을 누른 뒤 도는 지점을 순서대로 | `LandingView.vue:43`(submit) → `:473`(검증) → `:504` → `authStore.js:64` → `authService.js:21` → `api.js:16`(**토큰이 없어 헤더를 안 붙인다**) → `vite.config.js:22`(프록시) → `JwtAuthenticationFilter.java:34`(헤더 없음 → 통과) → `SecurityConfig.java:40`(permitAll) → `AuthController.java:57` → `AuthService.java:78` → `UserDao.java:17` → `UserMapper.xml:31` → `AuthService.java:82`(해시 대조) → `:87` → `:90` → `:95` → `JwtUtil.java:32` → `AuthController.java:59`(200) → `authService.js:25`(localStorage) → `authStore.js:67` → `LandingView.vue:509` → `router/index.js:81`(가드) | 필터 두 줄을 빼놓는다 → 2-4 |
| 2-2 | 회원가입에서 `.coin(5)`(`AuthService.java:55`)로 넣은 값이 DB 에 들어가나 | **안 들어간다.** `UserMapper.xml:27` 의 `coin` 자리가 `#{coin}` 이 아니라 `DEFAULT` 다. 결과가 5인 것은 `dream_DB.sql:20` 덕이지 자바 덕이 아니다 | 「5가 들어간다」 → 자바만 읽고 SQL 을 안 봤다. **XML 을 반드시 열게 하는 이유** |
| 2-3 | 토큰이 다음 요청 헤더에 붙기까지 | 응답에서 꺼내 `localStorage` 에 넣고(`authService.js:25`), 이후 요청마다 인터셉터가 다시 읽어 `Bearer` 로 붙인다(`api.js:16-18`). 두 코드는 **서로를 부르지 않는다** | 「인터셉터가 `authStore.token` 을 읽는다」 → `api.js` 는 store 를 import 하지 않는다. 사용자 정보는 `authService.js:39` 와 `authStore.js:81` 이 **두 번 쓴다** |
| 2-4 | 로그인 요청과 캘린더 요청 중 `JwtAuthenticationFilter` 가 도는 것은 | **둘 다.** `permitAll` 은 **인가**를 면제하지 필터를 건너뛰지 않는다. 로그인 요청은 헤더가 없어 34줄 조건이 거짓이고 필터는 아무것도 안 한 채 53줄에서 넘긴다 | 「permitAll 이라 안 돈다」 → 필터 체인과 인가 규칙을 한 덩이로 본 것. 가장 자주 틀리는 자리 |

### 기계가 못 보는 간선 — 이 챕터의 어려운 자리

`AuthController.java` 의 import(3-28줄)에 `SecurityConfig` 도 `JwtAuthenticationFilter` 도 없다. 그래프로는 **로그인과 무관한 파일**인데 학습자에게는 경로다. 셋으로 나눈다.

**(a) 문자열로 이어지는 것은 잇는다.** `SecurityConfig.java:40` 의 `"/api/auth/login"` 과 `AuthController.java:32+56` 의 `"/api/auth"`+`"/login"` 은 결합하면 같은 문자열이다. 프론트↔백 HTTP 간선(D159)과 **같은 수**다. `@Mapper`(`UserDao.java:10`) ↔ `UserMapper.xml:5` 의 `namespace` 도 FQCN 이라 정확히 이어진다.

**(b) 타입으로 이어지는 것도 잇는다.** `AuthService.java:5` 가 `UnauthorizedException` 을 import 하고 `GlobalExceptionHandler.java:29` 가 같은 타입을 `@ExceptionHandler` 로 받는다 — 던지는 자리와 401 이 만들어지는 자리가 이어진다. import 그래프에 이미 있는데 안 쓰는 정보다.

**(c) 순서만은 코드에 없다.** 「필터가 컨트롤러보다 먼저 돈다」는 어느 파일에도 없다. Spring 이 런타임에 하는 일이다. 여기서는 정답 근거를 **파일:줄 대신 사전 항목**(`proto/servlet-filter-chain`)이 갖게 한다. 2-4 의 근거는 「`SecurityConfig.java:54` 가 필터를 체인에 **넣었다**」(코드) + 「체인이 디스패처보다 앞선다」(사전)의 합. 선택형이라 채점에 실행은 필요 없다.

---

## 4. 3단 · 예측

| # | 바꾸는 것 | 정답 | 오답과 진단 |
|---|---|---|---|
| 3-1 | `UserMapper.xml:35` 의 `AND deleted_date IS NULL` 을 지우면 | **탈퇴한 회원이 다시 로그인된다.** 탈퇴는 행을 지우지 않고 `deleted_date` 에 시각을 넣을 뿐(`:89-93`) | 「아무것도 안 달라진다」 → soft delete 를 안 봤다 |
| 3-2 | `SecurityConfig.java:54` 의 `.addFilterBefore(...)` 를 지우면 | **로그인은 그대로 성공한다.** 대신 이후 요청에서 `SecurityContext` 가 비어 `/api/auth/me` 가 막힌다 — 토큰은 유효한데 아무도 열어 보지 않는다 | 「토큰이 발급되지 않는다」 → 발급은 `AuthService.java:95` 로 필터와 무관. **만드는 쪽과 여는 쪽을 갈라 보는지**를 잰다 |
| 3-3 | 24시간 지난 토큰으로 캘린더를 열면 화면에 무엇이 보이나 | `validateToken` false → 익명으로 `/api/**`(`SecurityConfig.java:51`)에 걸려 거부. Spring Security 6 은 폼·Basic 이 없으면 기본 진입점이 **403** 이다. `api.js:35` 는 401 만 처리하므로 토큰이 지워지지도 튕기지도 않고 `:48` 이 콘솔에만 찍는다 — **아무 일도 안 일어난다** | 「401 이 오고 로그인 화면으로 간다」 → 대부분 이렇게 답한다. 정답 쪽이 실제 결함이다. (읽기로 세운 예측이고 403 여부는 띄워서 확인해야 한다) |
| 3-4 | `AuthService.java:87` 의 호출은 새 트랜잭션을 여나 (`:112` 가 `REQUIRES_NEW`) | **안 연다.** 같은 클래스에서 `this` 로 부르면 프록시를 안 지나 애너테이션이 무시되고 바깥 `login()` 에 참여한다 | 「적혔으니 연다」 → 애너테이션을 명령으로 읽은 것. `AuthController.java:76` 이 부를 때는 프록시를 지나 **부르는 자리에 따라 다르게 돈다** |

---

## 5. 4단 · 수정

| # | 과제 | 대상 | 채점 |
|---|---|---|---|
| 4-1 | 없는 아이디와 틀린 비밀번호가 **구별되지 않게** 하라 | `AuthService.java:78-84` | 79줄 `orElseThrow` 의 예외 타입이 `UnauthorizedException` 이 되고 메시지가 83줄과 같은지. AST 로 잰다 |
| 4-2 | 토큰 만료를 프론트가 알아채게 하라 (3-3 의 후속) | `SecurityConfig` 또는 `api.js:46` | 401 진입점을 달거나 프론트 403 분기에서 처리 — 둘 다 정답. 다만 **프론트만 고치면 권한 부족 403**(`GlobalExceptionHandler.java:50-58`)**과 구별이 안 된다.** 이 구별을 적었는지가 채점 항목 |
| 4-3 | `getCurrentUserId()` 가 익명 요청에서 터지지 않게 | `SecurityUtil.java:9-15` | 익명이면 principal 이 `"anonymousUser"` 문자열인데 `isAuthenticated()` 가 true 라 11줄 방어를 지나 14줄 캐스트에서 터진다. `instanceof Long` 검사가 정답. 지금은 `SecurityConfig.java:51` 이 막지만 `:52` `permitAll()` 아래 엔드포인트를 만들면 즉시 터진다 |
| 4-4 | 로그인 실패 5회를 막아라 | 새 코드 | 「어디에 세느냐」를 묻는 설계 과제. 서버가 상태를 안 갖기로 했으니 **DB 아니면 캐시** 말고 자리가 없다 |

**실행이 필요한 선.** 넷 중 실행해야 판정되는 것은 0개다. 실행이 있어야 보이는 것(BCrypt 가 매번 다른 해시를 낸다)은 `proto/password-hashing` 이 문장으로 준다. 4-2·4-4 는 「왜」가 답의 절반이라 AST 로 못 잰다 — **막히는 것은 실행이 아니라 서술이다**(§7-5).

---

## 6. 5단 · 재구현

| # | 무엇을 비우나 | 크기 | 주는 것 | 채점 |
|---|---|---|---|---|
| 5-1 | `JwtUtil.java` 의 `generateToken`·`validateToken`·`getUserIdFromToken` | 79줄 중 ~55 | 클래스 껍데기·세 시그니처·생성자(20-25줄). **무엇이 아니라 어떻게가 문제여야 한다** | T1 필사 채점기(AST 비교). `setSubject` 에 `userId`, `claim` 에 `loginId`·`role` 을 넣었는지 |
| 5-2 | `UserMapper.xml` 의 `findByLoginId` | 7줄 | `resultMap`(7-22)과 `dream_DB.sql:12-28` | `mybatis_sql` 파싱 + `deleted_date IS NULL` 유무. **3-1 에서 지워 본 절을 스스로 쓴다** |
| 5-3 | `authService.js` 의 `login`·`logout` | 27줄(20-54) | `api.js` 전체 | 토큰을 꺼내 저장하는지, `logout` 이 `finally` 에서 지우는지(서버 호출이 실패해도 지워야 한다 — 48-53줄) |

**계약이 예로 든 「로그아웃을 처음부터」는 성립하지 않는다.** 서버 로그아웃이 5줄이고 하는 일이 없다. 프론트(`authService.js:47-54`+`authStore.js:93-102`)를 대상으로 삼고, 서버 쪽은 서술 문항 「왜 서버가 할 일이 없나」로 돌린다.

---

## 7. 부딪힌 것 — 다른 문서로 되먹인다

| # | 부딪힌 것 | 수치·파일 | 무엇을 고쳐야 하나 |
|---|---|---|---|
| 1 | **안 보이는 간선이 둘이 아니라 다섯이다** | `AuthController` 가 import 안 하는데 로그인에 도는 파일: `SecurityConfig`·`JwtAuthenticationFilter`·`GlobalExceptionHandler`·`WebConfig`·`UserMapper.xml`. **19파일 중 5개, 26%** | `feature-paths.md` §5 그림은 둘만 달았다. §3(a)(b) 의 **문자열 결합 간선과 예외 타입 간선을 만들면 다섯 중 넷이 이어진다.** 안 이어지는 것은 「순서」뿐 |
| 2 | **경로의 단위가 파일이면 안 된다** | `LandingView.vue` 1,527줄 중 로그인은 폼 43-159·핸들러 467-515 로 **약 130줄, 8.5%** | `entryUnits`(D160)가 파일 단위다. 1,527줄을 던지면 챕터가 죽는다. **폐포의 원소를 `(fileId, byteRange)` 로** — `AstLite` 블록이 이미 있다 |
| 3 | **첫 챕터가 거의 전부 미해독이다** | 19파일 중 오늘 읽히는 것은 JS 4개(55+99+186+103 = **443줄, 2,927줄의 15%**). Java 9·XML 1·Vue 1 이 안 열린다 | 1단 문항 5개 중 **4개를 오늘 만들 수 없다.** `feature-paths.md` §7 의 순서 1(java 문법)·5(Vue SFC·MyBatis XML)는 나중 일이 아니라 이 챕터의 **선결 조건** |
| 4 | **`proto/` 없이는 1단·3단이 안 선다** | 코드에 없는데 물어야 하는 것 **5개** — 필터 체인 순서 · HS256 이 보장하는 것 · BCrypt 의 salt · 401 과 403 의 차이 · dev 에서 CORS 가 프록시로 우회된다(`vite.config.js:21-26` 이 `WebConfig.java:22-34` 를 무의미하게 만든다) | 「정답 근거 = 파일:줄」이 깨진다. 스키마에 **근거가 사전 항목인 경우**가 필요하고, 2-4 처럼 코드 근거와 사전 근거가 **합쳐진** 문항이 주력이 된다 |
| 5 | **4단 채점의 절반이 서술이다** | 4-1·4-3 은 AST 로 잰다. **4-2·4-4 는 「왜」가 답의 절반** | 계약 §2-④ 는 실행에만 선을 그었는데 실제로 걸린 것은 서술이다. 안 하면 4단이 T1 필사로 퇴화한다. 오답마다 진단이 붙은 선택형이 현실적 |
| 6 | **재구현 대상 조건이 좁다** | 「30~120줄 + 바깥 의존 3개 이하」를 통과하는 것은 `JwtUtil`(79)·`JwtAuthenticationFilter`(64)·`authService.js`(99) **3개뿐**. `SecurityUtil`(17)·서버 로그아웃(5)은 작고 `LandingView.vue`(1,527)는 크다 | 후보 선정 규칙이 필요하다. 기능마다 3개면 **챕터당 5단 문항 상한이 3개** |
| 7 | **커밋 클러스터가 로그인을 못 잡는다** | 254커밋 중 로그인 백엔드 8파일을 건드린 커밋 **24개**. `LandingView.vue` 는 **2개** — 로그인 폼이 랜딩에 통째로 합쳐진 커밋이다 | `feature-paths.md` §4 는 커밋 클러스터에 기대를 걸었다. 여기서는 **로그인과 랜딩이 한 덩이로 묶인다.** 진입점 폐포가 낫고 커밋 클러스터는 보조 |
| 8 | **경로에 죽은 코드가 섞인다** | `useUserStorage.js`(102줄)는 백엔드 이전의 localStorage 「DB」다. 9함수 중 `getSessionUser`·`clearSessionUser` 둘만 `MyPageView.vue:166`·`LoadingView.vue:47` 에서 쓰이고 **7개는 안 불린다** | 이 파일이 계약이 준 로그인 목록에 있었다. 죽은 코드가 섞이면 **학습자가 그것도 읽는다.** 폐포에 「실제로 호출되는가」 필터가 필요하다 |
