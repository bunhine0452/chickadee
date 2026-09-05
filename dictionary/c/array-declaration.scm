; 칸이 정해진 목록. 칸 수가 타입의 일부이고 아무도 범위를 안 본다 — `a[5]` 가 컴파일되고 돌아간다.
; 문자열로 초기화되는 배열(`char s[] = "hi"`)은 `c/string-literal` 의 것이라 여기 안 든다.
((declaration
   type: (_) @pick.1
   declarator: (array_declarator
     declarator: (identifier) @pick.2
     size: (_) @pick.3)) @site
 (#set! form "array"))

((declaration
   type: (_) @pick.1
   declarator: (init_declarator
     declarator: (array_declarator
       declarator: (identifier) @pick.2
       size: (_)? @pick.3)
     value: (initializer_list))) @site
 (#set! form "array-init"))
