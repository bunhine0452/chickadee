((import_from_statement
   module_name: (_) @import.source)
 (#set! form "from"))

((import_statement
   name: (dotted_name) @import.source)
 (#set! form "static"))

((import_statement
   name: (aliased_import (dotted_name) @import.source))
 (#set! form "static"))

; ── 라우트 (D168) ────────────────────────────────────────────────────
; FastAPI·Flask 의 `@app.post("/api/v1/…")`. Spring 의 `route-*` 와 같은 `form` 이라
; 색인(`resolve-imports.ts`)이 그대로 받는다. 기본 경로(`APIRouter(prefix=…)`)는 안 본다.
((decorated_definition
   (decorator (call
     function: (attribute object: (identifier) attribute: (identifier) @ctx.verb)
     arguments: (argument_list . (string) @import.source))))
 (#eq? @ctx.verb "get") (#set! form "route-get"))
((decorated_definition
   (decorator (call
     function: (attribute object: (identifier) attribute: (identifier) @ctx.verb)
     arguments: (argument_list . (string) @import.source))))
 (#eq? @ctx.verb "post") (#set! form "route-post"))
((decorated_definition
   (decorator (call
     function: (attribute object: (identifier) attribute: (identifier) @ctx.verb)
     arguments: (argument_list . (string) @import.source))))
 (#eq? @ctx.verb "put") (#set! form "route-put"))
((decorated_definition
   (decorator (call
     function: (attribute object: (identifier) attribute: (identifier) @ctx.verb)
     arguments: (argument_list . (string) @import.source))))
 (#eq? @ctx.verb "patch") (#set! form "route-patch"))
((decorated_definition
   (decorator (call
     function: (attribute object: (identifier) attribute: (identifier) @ctx.verb)
     arguments: (argument_list . (string) @import.source))))
 (#eq? @ctx.verb "delete") (#set! form "route-delete"))

; ── 호출 그래프 (D168) ───────────────────────────────────────────────
((call function: (attribute object: (identifier) @ctx.recv attribute: (identifier) @import.source))
 (#set! form "call"))
((call function: (identifier) @import.source)
 (#set! form "call-self"))
