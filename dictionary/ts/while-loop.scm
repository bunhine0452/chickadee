; 조건이 참인 동안 되풀이 — 갈림과 달리 한 바퀴마다 조건을 다시 본다.
((while_statement
   "while" @pick.1 @hole
   condition: (parenthesized_expression) @pick.2
   body: (_) @pick.3) @site
 (#set! form "while"))
