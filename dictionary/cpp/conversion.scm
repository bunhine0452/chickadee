; 타입이 다른 둘이 만났을 때. 세 자리에서 보인다 — 사람이 적은 변환, C 에서 물려받은
; 괄호 변환, 그리고 **중괄호가 축소를 막는** 자리.
((call_expression
   function: (template_function
     name: (identifier) @pick.1 @hole
     arguments: (template_argument_list (type_descriptor) @pick.2))
   arguments: (argument_list (_) @pick.3)) @site
 (#any-of? @pick.1 "static_cast" "reinterpret_cast" "const_cast" "dynamic_cast")
 (#set! form "named-cast"))

; C 에서 물려받은 모양. 무엇으로 바꾸는지가 괄호 안에 있고 말없이 자른다.
((cast_expression
   type: (type_descriptor) @pick.2
   value: (_) @pick.3) @site
 (#set! form "c-cast"))

; 중괄호로 채운 자리 — 여기서는 **줄어드는 변환이 컴파일 오류**다. C 와 갈리는 자리다.
((declaration
   type: (primitive_type) @pick.2
   declarator: (init_declarator
     declarator: (identifier) @pick.1
     value: (initializer_list (_) @pick.3))) @site
 (#any-of? @pick.2 "int" "long" "short" "char")
 (#set! form "braced"))
