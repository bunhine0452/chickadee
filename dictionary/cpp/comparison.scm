; 두 값 견주기. 구멍은 견주는 기호이고 요점은 `=`(넣기)와 `==`(묻기)의 갈림이다.
;
; **`<` 와 `>` 단독은 안 잡는다.** 같은 글자가 템플릿 인자를 여는 자리라 문법 자신이
; `prec.dynamic` 가중치로만 가른다 (`cpp.md` §8 ①). 교육 목표는 넣기와 묻기의 갈림이라
; 넷으로도 다 선다.
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!=" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))
