; 아니면 여기서 나가기. `else` 안에서는 **반드시 나가야** 하고, 성공한 값만 아래로 내려간다.
((guard_statement
   "guard" @pick.1 @hole
   bound_identifier: (simple_identifier) @pick.2
   (statements) @pick.3) @site
 (#set! form "guardlet"))
