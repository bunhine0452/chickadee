; 자리가 모자랄 때. 코드에 드러나는 자리는 둘이다 — 한계를 이름으로 부르는 곳과,
; 부호 없는 타입을 골라 「돌아가도 된다」고 적은 곳.
;
; **넘침 자체는 정적으로 안 보인다.** `a + b` 가 넘치는지는 두 값을 알아야 하고 소스에는
; 없다 — 그래서 합성이 정본이고 사용처는 이 둘을 빌린다 (`cpp.md` §0.3).
((call_expression
   function: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (qualified_identifier
       scope: (template_type name: (type_identifier) @pick.3)
       name: (identifier) @pick.1 @hole))) @site
 (#eq? @pick.3 "numeric_limits")
 (#any-of? @pick.1 "max" "min")
 (#set! form "limit"))

; C 에서 물려받은 한계 매크로.
((declaration
   type: (primitive_type) @pick.3
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (identifier) @pick.1)) @site
 (#any-of? @pick.1 "INT_MAX" "INT_MIN" "UINT_MAX" "LONG_MAX" "LONG_MIN" "SIZE_MAX")
 (#set! form "macro-limit"))

; 부호 없는 타입 — 넘치면 **정의된 대로** 처음으로 돌아간다. 부호 있는 쪽과 갈리는 자리다.
((declaration
   type: (sized_type_specifier) @pick.1
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1
   "unsigned" "unsigned int" "unsigned long" "unsigned short"
   "unsigned char" "unsigned long long")
 (#set! form "wraps"))
