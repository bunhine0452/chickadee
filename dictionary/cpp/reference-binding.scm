; 이름 둘이 한 값. 선언에 붙은 `&` 는 **새 칸을 안 만든다** — 그 이름은 오른쪽 값의
; 두 번째 이름이 된다. 식에 붙은 `&`(주소 얻기)와 같은 글자라서 여기가 갈림이다.
((declaration
   type: (_)
   declarator: (init_declarator
     declarator: (reference_declarator "&" @pick.1 @hole (identifier) @pick.2)
     value: (_) @pick.3)) @site
 (#set! form "bind"))
