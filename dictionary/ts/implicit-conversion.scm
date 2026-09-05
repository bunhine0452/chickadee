; 타입이 다르면 **언어가 한쪽을 바꿔서** 계산한다. 두 피연산자의 타입을 알아야 하는 일이라
; (정규식도 tree-sitter 도 모른다) **한쪽이 리터럴로 적혀 있는 자리**만 잡는다 —
; 거기서는 타입이 코드에 그대로 보인다.
((binary_expression
   left: [(string) (template_string)] @pick.2
   operator: ["-" "*" "/" "%"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "text-left"))

((binary_expression
   left: [(number) (identifier) (member_expression) (call_expression)] @pick.3
   operator: ["-" "*" "/" "%"] @pick.1
   right: [(string) (template_string)] @pick.2) @site
 (#set! form "text-right"))

; `+` 만 문자열 쪽으로 기운다 — `1 + '1'` 은 `'11'` 이고 `'3' - 1` 은 `2` 다.
((binary_expression
   left: [(string) (template_string)] @pick.2
   operator: "+" @pick.1
   right: (number) @pick.3) @site
 (#set! form "plus-text-left"))

((binary_expression
   left: (number) @pick.3
   operator: "+" @pick.1
   right: [(string) (template_string)] @pick.2) @site
 (#set! form "plus-text-right"))
