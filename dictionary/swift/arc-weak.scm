; 세지 않는 참조. 가리키는 수를 세어 0이 되면 지우는데 둘이 서로를 가리키면 영영 0이 안 된다.
; `weak` 는 메모리를 아끼는 게 아니라 **세는 것을 그만두는 것**이다.
((property_declaration
   (modifiers (ownership_modifier) @pick.1 @hole)
   name: (pattern (simple_identifier) @pick.2)
   (type_annotation (_) @pick.3)) @site
 (#set! form "weakprop"))
