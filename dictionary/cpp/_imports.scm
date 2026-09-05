; 시스템 쿼리 — 이 파일이 내놓는 「지정자」. 해석은 TS 가 한다 (D18).
;
; ① `#include <vector>` — 꺾쇠는 `system_lib_string`, 따옴표는 `string_literal` 이다.
;    전처리기는 **실행되지 않으므로** `#ifdef` 로 갈린 양쪽이 다 잡힌다 (`cpp.md` §8 ④).
; ② 호출 그래프 (D168) — 이름 → 타입, 그리고 부르는 자리. 형식 이름은
;    `resolve-imports.ts` 의 `GRAPH_FORM` 이 아는 것 그대로다.
;
; C++20 `import std;`(`import_declaration`)은 안 잡는다 — 표본 두 리포(fmt · nlohmann/json)
; 527파일에서 한 곳도 없다.

((preproc_include path: (system_lib_string) @import.source)
 (#set! form "static"))

((preproc_include path: (string_literal) @import.source)
 (#set! form "static"))

; ── 이름 → 타입 ──────────────────────────────────────────────────────
; `Parser parser_;` 는 `parser_: Parser` 다. 수신자의 타입을 알아야 `parser_.run()` 이
; 어느 파일의 메서드인지 풀린다.
((field_declaration
   type: (type_identifier) @ctx.type
   declarator: (field_identifier) @import.source)
 (#set! form "field"))

((declaration
   type: (type_identifier) @ctx.type
   declarator: (init_declarator declarator: (identifier) @import.source))
 (#set! form "local"))

((declaration
   type: (type_identifier) @ctx.type
   declarator: (identifier) @import.source)
 (#set! form "local"))

((parameter_declaration
   type: (type_identifier) @ctx.type
   declarator: (identifier) @import.source)
 (#set! form "local"))

((parameter_declaration
   type: (type_identifier) @ctx.type
   declarator: (reference_declarator (identifier) @import.source))
 (#set! form "local"))

; ── 호출 ─────────────────────────────────────────────────────────────
; `parser_.run(…)` · `p->run(…)` — 수신자가 식별자인 것만 잡는다. 체인의 바깥
; (`a.b().c()`)은 수신자가 호출이라 안 잡히고, 그쪽은 대개 표준 라이브러리라 파일이 없다.
((call_expression
   function: (field_expression
     argument: (identifier) @ctx.recv
     field: (field_identifier) @import.source))
 (#set! form "call"))

; 같은 파일·같은 네임스페이스의 함수 — `format_to(…)`.
((call_expression function: (identifier) @import.source)
 (#set! form "call-self"))

; `Widget::make(…)` — 이름공간이나 클래스로 한정한 호출.
((call_expression
   function: (qualified_identifier
     scope: (namespace_identifier) @ctx.recv
     name: (identifier) @import.source))
 (#set! form "call"))
