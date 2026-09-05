; 시스템 쿼리 — 이 파일이 내놓는 「지정자」. 해석은 TS 가 한다 (D18).
;
; ① import 경로. `resolveGo` 가 `go.mod` 의 모듈 경로로 리포 안·밖을 가른다
;    (`resolve-imports.ts:269`).
; ② 별칭이 붙은 import — 경로가 지정자이고 별칭은 맥락이다.
; ③ 호출 그래프 (D168) — 수신자와 이름. 자바·파이썬의 `call`·`call-self` 와 같은 `form`
;    이라 색인이 그대로 받는다.
;
; **라우트는 안 낸다.** Go 에는 애너테이션이 없고 경로가 `mux.HandleFunc("/x", h)` 처럼
; 그냥 인자라 HTTP 동사를 문법에서 못 읽는다 — 3부 네임스페이스가 없는 것과 같은 원인이다
; (`go.md` §0.5). 억지로 잡으면 아무 문자열 인자나 라우트가 된다.

((import_spec !name path: (interpreted_string_literal) @import.source)
 (#set! form "static"))

((import_spec
   name: (package_identifier) @ctx.alias
   path: (interpreted_string_literal) @import.source)
 (#set! form "static"))

; ── 호출 그래프 (D168) ───────────────────────────────────────────────
((call_expression
   function: (selector_expression
     operand: (identifier) @ctx.recv
     field: (field_identifier) @import.source))
 (#set! form "call"))

((call_expression function: (identifier) @import.source)
 (#set! form "call-self"))
