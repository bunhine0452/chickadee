; 손으로 잡고 손으로 놓기. `malloc` 과 달리 **만들 때 도는 함수와 끝날 때 도는 함수를 부른다** —
; 그 차이가 이 판의 전부다 (`cpp.md` §4 #28).
((new_expression
   "new" @pick.1 @hole
   type: (_) @pick.2
   arguments: (argument_list) @pick.3) @site
 (#set! form "new"))

((new_expression
   !arguments
   "new" @pick.1 @hole
   type: (_) @pick.2) @site
 (#set! form "new-bare"))

((delete_expression (_) @pick.2) @site
 (#set! form "delete"))
