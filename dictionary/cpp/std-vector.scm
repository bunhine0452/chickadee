; 늘어나는 목록. 요점은 **값으로 넘기면 원소가 전부 복사된다**는 것이다 —
; 이 한 줄이 C++ 성능 사고의 절반이다 (`cpp.md` §3 #11).
((declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (_)) @site
 (#eq? @pick.1 "vector")
 (#set! form "vecdecl"))

((parameter_declaration
   type: (qualified_identifier
     scope: (namespace_identifier) @pick.2
     name: (template_type
       name: (type_identifier) @pick.1 @hole
       arguments: (template_argument_list) @pick.3))
   declarator: (_)) @site
 (#eq? @pick.1 "vector")
 (#set! form "vecparam"))

; 끝에 하나 더 붙이는 자리 — 대개 싸고 가끔 전체를 옮긴다.
((call_expression
   function: (field_expression
     argument: (identifier) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (argument_list) @pick.3) @site
 (#any-of? @pick.1 "push_back" "emplace_back" "reserve")
 (#set! form "grow"))
