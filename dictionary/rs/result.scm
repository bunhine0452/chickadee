; 실패가 값으로 온다. 던져지지 않고 **반환값으로** 온다 — `try`/`catch` 가 없어 오류 경로가
; 서명에 다 적혀 있다. 구멍은 `Result`.
;
; `.unwrap()`·`.expect()` 도 여기 잡는다 — 「실패면 그냥 터져라」이고, AI 가 오류 경로를
; 안 쓰려고 가장 자주 넣는 것(ai-pm 2,797곳)이다. 수신자가 `Option` 일 수도 있지만 뜻은 같다.
((generic_type
   type: (type_identifier) @pick.1 @hole
   type_arguments: (type_arguments "<" @pick.3 . (_) @pick.2)) @site
 (#eq? @pick.1 "Result")
 (#set! form "result-type"))

((call_expression
   function: (identifier) @pick.1
   arguments: (arguments "(" @pick.3 . (_) @pick.2)) @site
 (#any-of? @pick.1 "Ok" "Err")
 (#set! form "ok-err"))

((match_arm
   pattern: (match_pattern (tuple_struct_pattern type: (identifier) @pick.1 . (_) @pick.2))
   "=>" @pick.3) @site
 (#any-of? @pick.1 "Ok" "Err")
 (#set! form "arm"))

((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "unwrap" "expect")
 (#set! form "unwrap"))
