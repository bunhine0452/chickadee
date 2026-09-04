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
; 객체 이름(`api`·`axios`·인스턴스명)을 못박지 않는 이유는 리포마다 다르기 때문이고,
; 대신 `#match?` 로 경로 모양을 요구해 `arr.post("hello")` 류를 거른다.
; 앵커 `.` 는 **첫 인자**를 뜻한다 — `api.post(url, body)` 의 body 를 잡지 않는다.
;
; 템플릿 문자열도 같이 잡는다 — `` api.get(`/notices/${id}`) ``. 서버는 그 자리를
; `@GetMapping("/{noticeId}")` 로 적으므로 **둘 다 자리표로 접어** 맞춘다(`resolve-imports.ts`).
; 접지 않으면 경로 변수를 쓰는 라우트가 통째로 안 이어진다 — 이 리포에서 컨트롤러 셋이 그랬다.

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . [(string) (template_string)] @import.source))
 (#eq? @ctx.verb "get") (#match? @import.source "^[\"'`]/")
 (#set! form "http-get"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . [(string) (template_string)] @import.source))
 (#eq? @ctx.verb "post") (#match? @import.source "^[\"'`]/")
 (#set! form "http-post"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . [(string) (template_string)] @import.source))
 (#eq? @ctx.verb "put") (#match? @import.source "^[\"'`]/")
 (#set! form "http-put"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . [(string) (template_string)] @import.source))
 (#eq? @ctx.verb "patch") (#match? @import.source "^[\"'`]/")
 (#set! form "http-patch"))

((call_expression
   function: (member_expression property: (property_identifier) @ctx.verb)
   arguments: (arguments . [(string) (template_string)] @import.source))
 (#eq? @ctx.verb "delete") (#match? @import.source "^[\"'`]/")
 (#set! form "http-delete"))
