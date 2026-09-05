; 함수 정의 — 줄 몇 개에 이름을 붙여 둔다. 정의한 자리에서는 돌지 않는다.
((function_declaration
   "function" @pick.1 @hole
   name: (identifier) @pick.2
   parameters: (formal_parameters) @pick.3
   body: (statement_block) @pick.4) @site
 (#set! form "function"))
