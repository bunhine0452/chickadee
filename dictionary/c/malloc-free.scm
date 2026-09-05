; 빌리고 돌려주기. 돌려주는 일을 언어가 안 한다 — 이 앱의 열 언어 중 그것을 사람에게 맡기는 것은
; C 뿐이다. 빌리는 셋과 돌려주는 하나를 이름으로 가른다. 첫 인자를 앵커로 하나만 짚는다.
((call_expression
   function: (identifier) @pick.1 @hole
   arguments: (argument_list . (_)? @pick.3) @pick.2) @site
 (#any-of? @pick.1 "malloc" "calloc" "realloc")
 (#set! form "alloc"))

((call_expression
   function: (identifier) @pick.1 @hole
   arguments: (argument_list . (_)? @pick.3) @pick.2) @site
 (#eq? @pick.1 "free")
 (#set! form "free"))
