; 값과 하는 일을 묶는 줄. C++ 에서 두 낱말의 **유일한 차이는 기본 접근**이다 —
; 하나는 감춤이 기본이고 하나는 열림이 기본이다 (`cpp.md` §3 #15).
((class_specifier
   "class" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (field_declaration_list) @pick.3) @site
 (#set! form "class"))

((struct_specifier
   "struct" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (field_declaration_list) @pick.3) @site
 (#set! form "struct"))
