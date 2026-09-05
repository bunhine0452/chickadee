; 시스템 쿼리 — 이 파일이 내놓는 「지정자」 둘. 해석은 TS 가 한다 (D18).
;
; ① 진짜 import — `import com.ssafy.finalproject.model.dto.LoginRequest;`
; ② **Spring 라우트** (D159). 프론트가 부르는 자리와 백이 받는 자리가 양쪽 다 문자열
;    리터럴이라 이으면 HTTP 간선이 선다. 경로는 클래스 수준(`@RequestMapping`)과
;    메서드 수준(`@PostMapping`)이 **나뉘어 있어** 한 캡처로 못 붙인다 — `form` 으로
;    갈라 내보내고 TS 가 파일 안에서 합친다.
;
; `form` 이 패턴마다 고정이라 HTTP 메서드 수만큼 패턴이 갈린다. 그 대가로 TS 가
; 메서드까지 맞춰 이을 수 있다 — 경로만 맞고 메서드가 다른 짝을 잇지 않는다.

((import_declaration (scoped_identifier) @import.source)
 (#set! form "static"))

; ── 클래스 수준 기본 경로 ────────────────────────────────────────────
((class_declaration
   (modifiers
     (annotation
       name: (identifier) @ctx.ann
       arguments: (annotation_argument_list (string_literal) @import.source))))
 (#eq? @ctx.ann "RequestMapping")
 (#set! form "route-base"))

; ── 메서드 수준, 경로가 있는 것 ──────────────────────────────────────
((method_declaration
   (modifiers
     (annotation
       name: (identifier) @ctx.ann
       arguments: (annotation_argument_list (string_literal) @import.source))))
 (#eq? @ctx.ann "GetMapping")
 (#set! form "route-get"))

((method_declaration
   (modifiers
     (annotation
       name: (identifier) @ctx.ann
       arguments: (annotation_argument_list (string_literal) @import.source))))
 (#eq? @ctx.ann "PostMapping")
 (#set! form "route-post"))

((method_declaration
   (modifiers
     (annotation
       name: (identifier) @ctx.ann
       arguments: (annotation_argument_list (string_literal) @import.source))))
 (#eq? @ctx.ann "PutMapping")
 (#set! form "route-put"))

((method_declaration
   (modifiers
     (annotation
       name: (identifier) @ctx.ann
       arguments: (annotation_argument_list (string_literal) @import.source))))
 (#eq? @ctx.ann "PatchMapping")
 (#set! form "route-patch"))

((method_declaration
   (modifiers
     (annotation
       name: (identifier) @ctx.ann
       arguments: (annotation_argument_list (string_literal) @import.source))))
 (#eq? @ctx.ann "DeleteMapping")
 (#set! form "route-delete"))

; ── 메서드 수준, 경로가 없는 것 (`@GetMapping` 만) ───────────────────
; 경로가 클래스 기본 경로 그대로다. 캡처할 문자열이 없어 애너테이션 이름을 지정자로
; 내보낸다 — TS 는 `form` 만 보고 「경로는 기본 경로」로 읽는다.
((method_declaration (modifiers (marker_annotation name: (identifier) @import.source)))
 (#eq? @import.source "GetMapping")
 (#set! form "route-bare-get"))

((method_declaration (modifiers (marker_annotation name: (identifier) @import.source)))
 (#eq? @import.source "PostMapping")
 (#set! form "route-bare-post"))

((method_declaration (modifiers (marker_annotation name: (identifier) @import.source)))
 (#eq? @import.source "PutMapping")
 (#set! form "route-bare-put"))

((method_declaration (modifiers (marker_annotation name: (identifier) @import.source)))
 (#eq? @import.source "PatchMapping")
 (#set! form "route-bare-patch"))

((method_declaration (modifiers (marker_annotation name: (identifier) @import.source)))
 (#eq? @import.source "DeleteMapping")
 (#set! form "route-bare-delete"))

; ── 같은 패키지 참조 (D163) ──────────────────────────────────────────
; 자바는 같은 패키지의 클래스를 **`import` 없이** 쓴다. `JwtAuthenticationFilter` 가 `JwtUtil` 을
; 그렇게 쓰고, 그래서 필터 체인이 어느 기능 폐포에도 안 붙었다 — 실측 20간선.
;
; 「모든 `type_identifier`」를 잡지 않는다. 타입은 자바 파일에 흔해서 캡처가 부풀고, 그중
; 의존을 뜻하는 것은 **쓰이는 자리 다섯**이다. 못 푸는 이름(`String`·제네릭 인자·외부 타입)은
; 파일이 없어 자연히 간선이 안 선다 — 이름으로 거르지 않는다 (`resolveJava`).
((field_declaration type: (type_identifier) @import.source) (#set! form "same-package"))
((formal_parameter type: (type_identifier) @import.source) (#set! form "same-package"))
((local_variable_declaration type: (type_identifier) @import.source) (#set! form "same-package"))
((object_creation_expression type: (type_identifier) @import.source) (#set! form "same-package"))
((method_declaration type: (type_identifier) @import.source) (#set! form "same-package"))
; `extends`·`implements` 도 의존이다 — 예외 계층(`CustomException` 을 잇는 여섯)이 이것으로만 이어진다 (D168).
((superclass (type_identifier) @import.source) (#set! form "same-package"))
((super_interfaces (type_list (type_identifier) @import.source)) (#set! form "same-package"))

; ── 호출 그래프 (D168) ───────────────────────────────────────────────
; 요청 줄기를 **메서드 단위**로 내리는 재료. 파일 간선만으로는 로그인과 회원가입이 둘째 칸부터
; 같은 줄기를 쓴다 — 컨트롤러 메서드가 어느 서비스 메서드를 부르는지가 있어야 갈린다.
; 이음매는 전부 이름이다: 필드의 타입은 파일 이름(`AuthService` → `AuthService.java`)이고,
; 부르는 이름은 그 파일의 메서드 이름이다. 해석은 TS(`calls.ts`)가 한다.
;
; 이름 → 타입. `private final AuthService authService;` 는 `authService: AuthService`.
((field_declaration
   type: (type_identifier) @ctx.type
   declarator: (variable_declarator name: (identifier) @import.source))
 (#set! form "field"))
((local_variable_declaration
   type: (type_identifier) @ctx.type
   declarator: (variable_declarator name: (identifier) @import.source))
 (#set! form "local"))
((formal_parameter type: (type_identifier) @ctx.type name: (identifier) @import.source)
 (#set! form "local"))

; 호출. `userDao.findByLoginId(…)` → 수신자 `userDao` + 이름. 체인(`a.b().c()`)은 안쪽의
; `a.b` 만 수신자가 식별자라 잡히고, 바깥 `.c()` 는 수신자가 호출이라 안 잡힌다 — 그 바깥은
; 대개 라이브러리(`orElseThrow`·`retrieve`)라 어차피 파일이 없다.
((method_invocation object: (identifier) @ctx.recv name: (identifier) @import.source)
 (#set! form "call"))
; 자기 호출 — `resetDailyCoinIfNeeded(…)` · `this.helper()`. 같은 파일의 메서드다.
((method_invocation !object name: (identifier) @import.source)
 (#set! form "call-self"))
((method_invocation object: (this) name: (identifier) @import.source)
 (#set! form "call-self"))

; ── 진입점 (D168) ────────────────────────────────────────────────────
; HTTP 로 안 들어오는 기능 — `@Scheduled(cron = …)`. 무엇이 부르나가 곧 문항이다.
((method_declaration (modifiers (annotation name: (identifier) @import.source)))
 (#eq? @import.source "Scheduled")
 (#set! form "entry-scheduled"))
((method_declaration (modifiers (marker_annotation name: (identifier) @import.source)))
 (#eq? @import.source "Scheduled")
 (#set! form "entry-scheduled"))

; 서버가 서버를 부른다 — `webClient.post().uri("/api/v1/…")`. 동사는 앞 칸(`post()`)에 있어
; 한 캡처로 못 붙는다. 동사 미상으로 내보내고 TS 가 경로만으로 라우트를 찾는다.
((method_invocation
   name: (identifier) @ctx.m
   arguments: (argument_list . (string_literal) @import.source))
 (#eq? @ctx.m "uri")
 (#set! form "http-any"))
