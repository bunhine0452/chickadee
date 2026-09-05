; 시스템 쿼리 — 이 파일이 내놓는 「지정자」. 해석은 TS 가 한다 (D18 · `resolve-imports.ts` 의
; `resolveRs`). 계수와 근거는 `docs/plan/rust-axis.md` §1.3 — 아래는 그 후보를 그대로 파일로 옮긴 것이다.
;
; `use a::b::C` · `use a::{B, C}` · `use a::*` · `use a::b as c` · `mod x;` 전부 `static` 이다 —
; 지정자 문자열(`crate::`·`self::`·`super::`·형제 이름)만으로 파일이 정해지므로 form 을 가를 이유가 없다.
((use_declaration argument: (scoped_identifier) @import.source)
 (#set! form "static"))

((use_declaration argument: (scoped_use_list path: (_) @import.source))
 (#set! form "static"))

((use_declaration argument: (use_wildcard (_) @import.source))
 (#set! form "static"))

((use_declaration argument: (use_as_clause path: (_) @import.source))
 (#set! form "static"))

((use_declaration argument: (identifier) @import.source)
 (#set! form "static"))

; `mod x;` — 본문이 없으면 형제 파일 `x.rs` 이거나 `x/mod.rs` 다.
((mod_item name: (identifier) @import.source !body)
 (#set! form "static"))

; ── 진입점 — Tauri 커맨드 (rust-axis §4) ──────────────────────────────────
; `#[tauri::command]` 는 `function_item` 의 자식이 아니라 **형제**다. 줄 번호만 내보내고
; 「그 줄 다음의 첫 fn 블록」과 짝짓는 일은 TS 가 한다.
((attribute_item (attribute (scoped_identifier) @import.source))
 (#eq? @import.source "tauri::command")
 (#set! form "entry-command"))

; ── 호출 그래프 (D168) ───────────────────────────────────────────────
; `recv.name(…)` — 수신자 이름 + 메서드 이름. 체인의 바깥은 수신자가 호출이라 안 잡힌다.
((call_expression
   function: (field_expression
     value: (identifier) @ctx.recv
     field: (field_identifier) @import.source))
 (#set! form "call"))

; `Type::name(…)` · `Self::name(…)`.
((call_expression
   function: (scoped_identifier
     path: (identifier) @ctx.recv
     name: (identifier) @import.source))
 (#set! form "call-assoc"))

; `f(x)` 는 안 잡는다 — ai-pm 에서 8,234 개인데 대부분이 `Ok(x)`·`Some(x)`·`Err(e)` 라
; 열거형 생성자와 자기 호출이 구별되지 않는다 (rust-axis §1.3).

; 이름 → 타입. 수신자 해석은 러스트에서 `field` 와 파라미터에만 기댄다 — `let` 은 타입을
; 추론해 버려 적힌 것이 118곳뿐이다.
((field_declaration
   name: (field_identifier) @import.source
   type: (type_identifier) @ctx.type)
 (#set! form "field"))

((parameter
   pattern: (identifier) @import.source
   type: (type_identifier) @ctx.type)
 (#set! form "local"))
