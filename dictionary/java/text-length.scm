; 글자 하나와 글자 묶음의 길이. 자바의 글자 타입은 16비트 코드 단위 하나라
; 이모지 한 개가 둘로 세어진다 — 길이를 묻는 호출이 그것을 그대로 드러낸다.
((local_variable_declaration
   type: (integral_type) @pick.1
   declarator: (variable_declarator
     name: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#eq? @pick.1 "char")
 (#set! form "chardecl"))

((method_invocation
   object: (_) @pick.2
   name: (identifier) @pick.1 @hole
   arguments: (argument_list) @pick.3) @site
 (#any-of? @pick.1 "length" "charAt" "codePointAt" "codePointCount")
 (#set! form "measure"))
