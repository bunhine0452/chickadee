; 점 찍어 꺼내기. 같은 점이 **패키지**에도 **필드**에도 쓰인다 — AST 만으로는 못 가른다
; (`go.md` §8 ③). 그래서 이 개념은 그 둘을 **한 판으로** 가르친다: 「점 왼쪽이 무엇인지는
; import 목록을 봐야 안다」가 판의 요점이다.
((selector_expression
   operand: (identifier) @pick.2
   "." @pick.1 @hole
   field: (field_identifier) @pick.3) @site
 (#set! form "sel"))
