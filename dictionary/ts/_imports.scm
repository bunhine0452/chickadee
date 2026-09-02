; 시스템 쿼리 — 지정자 문자열 하나만 잡는다. 경로 해석(`./x`·tsconfig paths)은 TS 가 한다 (D18).
((import_statement source: (string) @import.source)
 (#set! form "static"))

((export_statement source: (string) @import.source)
 (#set! form "static"))

((call_expression
   function: (import)
   arguments: (arguments (string) @import.source))
 (#set! form "dynamic"))

((call_expression
   function: (identifier) @ctx.callee
   arguments: (arguments (string) @import.source))
 (#eq? @ctx.callee "require")
 (#set! form "require"))
