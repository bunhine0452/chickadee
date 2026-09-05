; 클래스에 하나뿐인 것. `modifiers` 안의 익명 낱말이라 그대로 짚는다(03 §8 ①).
; 구멍은 `static` 고정이고, 오답 셋은 전부 같은 `modifiers` 자리에 설 수 있는 낱말이다.
((field_declaration
   (modifiers "static" @pick.1 @hole)
   type: (_) @pick.2
   declarator: (variable_declarator name: (identifier) @pick.3)) @site
 (#set! form "field"))

((method_declaration
   (modifiers "static" @pick.1 @hole)
   type: (_) @pick.2
   name: (identifier) @pick.3) @site
 (#set! form "method"))
