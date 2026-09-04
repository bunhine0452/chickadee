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

; ── HTTP 호출 (D159) ─────────────────────────────────────────────────
; `api.post("/auth/login", …)` 처럼 **첫 인자가 `/` 로 시작하는 문자열**인 호출만 잡는다.
; 객체 이름(`api`·`axios`·`http`·인스턴스명)을 못박지 않는 이유는 리포마다 다르기 때문이고,
; 대신 `#match?` 로 경로 모양을 요구해 `arr.post("hello")` 류를 거른다.
; 앵커 `.` 는 **첫 인자**를 뜻한다 — `api.post(url, body)` 의 body 를 잡지 않는다.
; 템플릿 문자열(`` `/dreams/${id}` ``)은 아직 안 잡는다 — 경로 변수는 다음 판이다.
((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . (string) @import.source))
 (#eq? @ctx.verb "get") (#match? @import.source "^[\"']/")
 (#set! form "http-get"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . (string) @import.source))
 (#eq? @ctx.verb "post") (#match? @import.source "^[\"']/")
 (#set! form "http-post"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . (string) @import.source))
 (#eq? @ctx.verb "put") (#match? @import.source "^[\"']/")
 (#set! form "http-put"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . (string) @import.source))
 (#eq? @ctx.verb "patch") (#match? @import.source "^[\"']/")
 (#set! form "http-patch"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . (string) @import.source))
 (#eq? @ctx.verb "delete") (#match? @import.source "^[\"']/")
 (#set! form "http-delete"))
