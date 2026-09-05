; 터진 것을 받아 잇기. 잡을 것을 **타입으로** 적고, 무엇이 잡히는지가 예외 클래스의
; 상속 관계로 정해진다 — 그래서 `catch (Exception e)` 가 거의 다 삼킨다.
((try_statement
   "try" @pick.1
   body: (block) @pick.2
   (catch_clause
     "catch" @pick.3 @hole
     (catch_formal_parameter (catch_type) @pick.4)
     body: (block) @pick.5)) @site
 (#set! form "try"))
