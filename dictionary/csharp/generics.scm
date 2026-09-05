; 타입 자리 비워 두기. **선언하는 쪽**만 잡는다 — 쓰는 쪽(`List<int>`)은 `csharp/list` 가
; 이미 가져갔고, 여기서 배울 것은 「이 이름이 타입 변수다」이기 때문이다.
;
; 빈칸은 안 낸다 — 타입 변수 이름이 사용처마다 다르다(`T`·`TEntity`·`TKey`).
((class_declaration
   name: (identifier) @pick.1
   (type_parameter_list (type_parameter (identifier) @pick.2))
   body: (declaration_list) @pick.3) @site
 (#set! form "type"))

((interface_declaration
   name: (identifier) @pick.1
   type_parameters: (type_parameter_list (type_parameter (identifier) @pick.2))
   body: (declaration_list) @pick.3) @site
 (#set! form "interface"))

((method_declaration
   returns: (_) @pick.3
   name: (identifier) @pick.1
   type_parameters: (type_parameter_list (type_parameter (identifier) @pick.2))) @site
 (#set! form "method"))
