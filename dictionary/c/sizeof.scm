; 몇 바이트인지 묻기. 값이 아니라 타입에 묻고 답이 컴파일할 때 정해진다 — `sizeof(x++)` 는 `x` 를
; 안 늘린다. 타입에 묻는 자리와 값에 묻는 자리를 갈라 낸다. 괄호 없는 `sizeof x` 는 안 잡는다.
((sizeof_expression
   "sizeof" @pick.1 @hole
   type: (type_descriptor type: (_) @pick.3) @pick.2) @site
 (#set! form "of-type"))

((sizeof_expression
   "sizeof" @pick.1 @hole
   value: (parenthesized_expression (_) @pick.3) @pick.2) @site
 (#set! form "of-value"))
