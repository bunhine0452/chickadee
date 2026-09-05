; 되풀이 낱말이 하나뿐이다. 세 칸짜리(`for i := 0; i < n; i++`)와 조건만 있는 것
; (`for cond {}` — 다른 언어의 `while`)을 따로 잡는다. 몸통만 있는 `for {}` 는 안 잡는다:
; 세 형태가 같은 노드라 앵커로 못 가르고, 잡으면 앞의 둘과 사이트가 겹친다.
((for_statement
   "for" @pick.1 @hole
   (for_clause
     initializer: (_) @pick.2
     condition: (_) @pick.3
     update: (_) @pick.4)
   body: (block) @pick.5) @site
 (#set! form "clause"))

((for_statement
   "for" @pick.1 @hole
   (binary_expression) @pick.3
   body: (block) @pick.5) @site
 (#set! form "while"))
