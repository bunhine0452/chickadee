; 시스템 쿼리 — 이 파일이 내놓는 「지정자」. 해석은 TS 가 한다 (D18).
;
; ① 진짜 using — `using Microsoft.eShopWeb.ApplicationCore.Entities;`
; ② **ASP.NET Core 라우트** (D159). 경로가 클래스 수준(`[Route("api/v1")]`)과 메서드 수준
;    (`[HttpGet("items/{id}")]`)으로 나뉘어 있어 자바의 `@RequestMapping`/`@GetMapping` 과
;    같은 모양이다 — `form` 을 자바와 **같은 이름**으로 내보내 색인(`resolve-imports.ts`)이
;    그대로 받게 한다.
; ③ 같은 어셈블리의 타입 참조 · 호출 그래프 (D163 · D168). C# 은 같은 네임스페이스의 타입을
;    `using` 없이 쓰므로, 그것만 보면 파일 간선이 통째로 빈다 — 자바와 같은 자리다.
;
; **못 잡는 것을 적어 둔다.** `global using`(C# 10)과 `ImplicitUsings` 는 이 파일에 안 적힌
; 이름을 들이는데, 앞의 것은 `using_directive` 라 잡히고 **뒤의 것은 소스에 줄이 없다.**
; `.csproj` 를 읽는 코드가 없으므로(README §6 #3) 그 이름들은 간선이 안 선다.

; ── using ────────────────────────────────────────────────────────────
((using_directive (qualified_name) @import.source)
 (#set! form "static"))
((using_directive (identifier) @import.source)
 (#set! form "static"))

; ── 클래스 수준 기본 경로 ────────────────────────────────────────────
((class_declaration
   (attribute_list
     (attribute
       name: (identifier) @ctx.ann
       (attribute_argument_list (attribute_argument (string_literal) @import.source)))))
 (#eq? @ctx.ann "Route")
 (#set! form "route-base"))

; ── 메서드 수준, 경로가 있는 것 ──────────────────────────────────────
; `form` 이 패턴마다 고정이라 HTTP 메서드 수만큼 패턴이 갈린다. 그 대가로 TS 가 메서드까지
; 맞춰 이을 수 있다 — 경로만 맞고 메서드가 다른 짝을 잇지 않는다.
((method_declaration
   (attribute_list
     (attribute
       name: (identifier) @ctx.ann
       (attribute_argument_list (attribute_argument (string_literal) @import.source)))))
 (#eq? @ctx.ann "HttpGet")
 (#set! form "route-get"))

((method_declaration
   (attribute_list
     (attribute
       name: (identifier) @ctx.ann
       (attribute_argument_list (attribute_argument (string_literal) @import.source)))))
 (#eq? @ctx.ann "HttpPost")
 (#set! form "route-post"))

((method_declaration
   (attribute_list
     (attribute
       name: (identifier) @ctx.ann
       (attribute_argument_list (attribute_argument (string_literal) @import.source)))))
 (#eq? @ctx.ann "HttpPut")
 (#set! form "route-put"))

((method_declaration
   (attribute_list
     (attribute
       name: (identifier) @ctx.ann
       (attribute_argument_list (attribute_argument (string_literal) @import.source)))))
 (#eq? @ctx.ann "HttpPatch")
 (#set! form "route-patch"))

((method_declaration
   (attribute_list
     (attribute
       name: (identifier) @ctx.ann
       (attribute_argument_list (attribute_argument (string_literal) @import.source)))))
 (#eq? @ctx.ann "HttpDelete")
 (#set! form "route-delete"))

; ── 메서드 수준, 경로가 없는 것 (`[HttpGet]` 만) ─────────────────────
; 경로가 클래스 기본 경로 그대로다. 캡처할 문자열이 없어 애트리뷰트 이름을 지정자로
; 내보낸다 — TS 는 `form` 만 보고 「경로는 기본 경로」로 읽는다.
((method_declaration (attribute_list (attribute name: (identifier) @import.source)))
 (#eq? @import.source "HttpGet")
 (#set! form "route-bare-get"))

((method_declaration (attribute_list (attribute name: (identifier) @import.source)))
 (#eq? @import.source "HttpPost")
 (#set! form "route-bare-post"))

((method_declaration (attribute_list (attribute name: (identifier) @import.source)))
 (#eq? @import.source "HttpPut")
 (#set! form "route-bare-put"))

((method_declaration (attribute_list (attribute name: (identifier) @import.source)))
 (#eq? @import.source "HttpPatch")
 (#set! form "route-bare-patch"))

((method_declaration (attribute_list (attribute name: (identifier) @import.source)))
 (#eq? @import.source "HttpDelete")
 (#set! form "route-bare-delete"))

; ── 같은 네임스페이스 참조 (D163) ────────────────────────────────────
; 「모든 타입 이름」을 잡지 않는다 — 타입은 C# 파일에 흔해서 캡처가 부풀고, 그중 의존을
; 뜻하는 것은 **쓰이는 자리 여섯**이다. 못 푸는 이름(`string`·제네릭 인자·외부 타입)은
; 파일이 없어 자연히 간선이 안 선다.
((field_declaration (variable_declaration type: (identifier) @import.source))
 (#set! form "same-package"))
((parameter type: (identifier) @import.source) (#set! form "same-package"))
((local_declaration_statement (variable_declaration type: (identifier) @import.source))
 (#set! form "same-package"))
((object_creation_expression type: (identifier) @import.source) (#set! form "same-package"))
((method_declaration returns: (identifier) @import.source) (#set! form "same-package"))
((property_declaration type: (identifier) @import.source) (#set! form "same-package"))
; 상속·구현도 의존이다 — 예외 계층과 엔드포인트 기반 클래스가 이것으로만 이어진다.
((base_list (identifier) @import.source) (#set! form "same-package"))

; ── 호출 그래프 (D168) ───────────────────────────────────────────────
; 이음매는 전부 이름이다: 필드의 타입은 파일 이름(`IOrderService` → `IOrderService.cs`)이고,
; 부르는 이름은 그 파일의 메서드 이름이다. 해석은 TS(`calls.ts`)가 한다.
((field_declaration
   (variable_declaration
     type: (identifier) @ctx.type
     (variable_declarator name: (identifier) @import.source)))
 (#set! form "field"))
((local_declaration_statement
   (variable_declaration
     type: (identifier) @ctx.type
     (variable_declarator name: (identifier) @import.source)))
 (#set! form "local"))
((parameter type: (identifier) @ctx.type name: (identifier) @import.source)
 (#set! form "local"))

; 호출. `_repo.GetByIdAsync(…)` → 수신자 `_repo` + 이름. 체인(`a.b().c()`)은 안쪽의 `a.b` 만
; 수신자가 식별자라 잡히고, 바깥 `.c()` 는 수신자가 호출이라 안 잡힌다 — 그 바깥은 대개
; LINQ·라이브러리(`ToListAsync`·`FirstOrDefault`)라 어차피 파일이 없다.
((invocation_expression
   function: (member_access_expression expression: (identifier) @ctx.recv name: (identifier) @import.source))
 (#set! form "call"))
((invocation_expression function: (identifier) @import.source)
 (#set! form "call-self"))
((invocation_expression
   function: (member_access_expression expression: "this" name: (identifier) @import.source))
 (#set! form "call-self"))

; ── 진입점 ───────────────────────────────────────────────────────────
; 서버가 서버를 부른다 — `client.GetAsync("/api/v1/…")`. 동사는 메서드 이름에 있어
; 한 캡처로 못 붙는다. 동사 미상으로 내보내고 TS 가 경로만으로 라우트를 찾는다.
((invocation_expression
   function: (member_access_expression name: (identifier) @ctx.m)
   arguments: (argument_list . (argument (string_literal) @import.source)))
 (#any-of? @ctx.m "GetAsync" "PostAsync" "PutAsync" "DeleteAsync" "GetFromJsonAsync")
 (#set! form "http-any"))
