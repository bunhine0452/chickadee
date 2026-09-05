; 함정 2 — 문자열 안의 코드. 텍스트 블록(`"""…"""`)도 같은 `string_literal` 한 갈래라
; (03 §8 ⑥) 통째로 값이다. 잡히는 것은 메서드 안의 하나뿐이어야 한다.
((try_statement
   "try" @pick.1
   body: (block) @pick.2
   (catch_clause
     "catch" @pick.3 @hole
     (catch_formal_parameter (catch_type) @pick.4)
     body: (block) @pick.5)) @site
 (#set! form "try"))
