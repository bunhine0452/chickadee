; 함정 2 — 문자열 안의 코드. 겹따옴표 셋도 같은 `string` 한 갈래라 통째로 값이다.
; 잡히는 것은 함수 안의 하나뿐이어야 한다.
((if_statement
   "if" @pick.3
   condition: [(identifier) (attribute) (subscript)] @pick.1
   consequence: (block) @pick.2) @site
 (#set! form "bare-if"))
