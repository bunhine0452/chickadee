; 함정 1 — 주석 안의 코드. 트리에 없으니 잡히는 것은 메서드 안의 하나뿐이어야 한다 (06 §1.2).
((try_statement
   "try" @pick.1
   body: (block) @pick.2
   (catch_clause
     "catch" @pick.3 @hole
     (catch_formal_parameter (catch_type) @pick.4)
     body: (block) @pick.5)) @site
 (#set! form "try"))
