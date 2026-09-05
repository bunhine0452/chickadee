; 값 자리 비워 두기. 자리표(`:name` · `#{name}` · `${name}`)는 이 문법에 노드가 없어서
; 파스 전에 같은 너비의 글자 값으로 가려진다 (`crates/parse/src/params.rs`).
; 술어는 **원문**을 보므로 가려진 자리를 여기서 도로 알아본다 — 값처럼 파싱되고 자리표로 잡힌다.
((binary_expression
   left: (field (identifier) @pick.2)
   operator: ["=" "!=" "<" ">" "<=" ">="] @pick.3
   right: (literal) @pick.1) @site
 (#match? @pick.1 "^[:#$]")
 (#set! form "bind"))
