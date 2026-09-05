; 함정 1 — 주석 안의 코드. 트리에 없으니 잡히는 것은 함수 안의 하나뿐이어야 한다 (06 §1.2).
((if_statement
   "if" @pick.3
   condition: [(identifier) (attribute) (subscript)] @pick.1
   consequence: (block) @pick.2) @site
 (#set! form "bare-if"))
