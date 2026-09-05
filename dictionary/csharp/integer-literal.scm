; 정수 타입으로 이름 만들기. 요점은 값이 아니라 **칸 수**다 — 타입 이름이 폭을 못 박는다.
; 글자(`char`)는 여기 안 든다. 그 자리는 `csharp/text-literal` 이 진다.
((local_declaration_statement
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator
       name: (identifier) @pick.2
       (_) @pick.3))) @site
 (#any-of? @pick.1 "int" "long" "short" "byte" "uint" "ulong" "ushort" "sbyte")
 (#set! form "intdecl"))

((field_declaration
   (variable_declaration
     type: (predefined_type) @pick.1 @hole
     (variable_declarator name: (identifier) @pick.2))) @site
 (#any-of? @pick.1 "int" "long" "short" "byte" "uint" "ulong" "ushort" "sbyte")
 (#set! form "intfield"))

((parameter
   type: (predefined_type) @pick.1 @hole
   name: (identifier) @pick.2) @site
 (#any-of? @pick.1 "int" "long" "short" "byte" "uint" "ulong" "ushort" "sbyte")
 (#set! form "intparam"))
