; `+` 로 글자를 잇기 — 템플릿 리터럴과 같은 일을 하는 다른 표기다.
; 한쪽이 글자로 적힌 식만 잡는다. 두 이름을 더한 식은 타입을 알아야 해서 여기서 안 보인다.
((binary_expression
   left: [(string) (template_string)] @pick.1
   operator: "+" @pick.2
   right: (_) @pick.3) @site
 (#set! form "left-text"))

((binary_expression
   left: (_) @pick.1
   operator: "+" @pick.2
   right: [(string) (template_string)] @pick.3) @site
 (#set! form "right-text"))
