; 자기 값을 바꾸는 메서드. 값 타입은 기본이 못 바꾸는 것이고, `mutating` 은 **자기 자신을
; 새 값으로 바꿔 담겠다**는 선언이다.
((function_declaration
   (modifiers (mutation_modifier) @pick.1 @hole)
   name: (simple_identifier) @pick.2
   body: (function_body (statements) @pick.3)) @site
 (#set! form "mutating"))
