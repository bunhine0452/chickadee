; 글자 값 적기. 작은따옴표에 싸인 것만 값이다 — 그 밖은 이름으로 읽힌다.
; **값을 넣는 자리**만 잡는다(넣기·고치기). 견주는 자리는 `sql/value-and-name` 이 든다.
; `#match?` 는 원문을 보므로 자리표(`:id`·`#{id}`)는 여기 안 걸린다 (`crates/parse/src/params.rs`).
((insert
   (object_reference (identifier) @pick.2)
   (keyword_values) @pick.3
   (list (literal) @pick.1)) @site
 (#match? @pick.1 "^'")
 (#set! form "text-literal"))

((assignment
   (field (identifier) @pick.2)
   "=" @pick.3
   (literal) @pick.1) @site
 (#match? @pick.1 "^'")
 (#set! form "text-literal"))
