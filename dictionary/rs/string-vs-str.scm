; 가진 글자와 빌린 글자. 소유와 빌림의 차이가 **처음 눈에 보이는** 자리 — `String` 은 힙의
; 버퍼를 갖고 `&str` 은 그 일부를 가리킨다. 구멍은 `String` 이고 `str` 자리는 짚기만 한다.
((parameter
   pattern: (identifier) @pick.2
   type: (type_identifier) @pick.1 @hole) @site
 (#eq? @pick.1 "String")
 (#set! form "string-param"))

((parameter
   pattern: (identifier) @pick.2
   type: (reference_type "&" @pick.3 type: (primitive_type) @pick.1)) @site
 (#eq? @pick.1 "str")
 (#set! form "str-param"))

((field_declaration
   name: (field_identifier) @pick.2
   type: (type_identifier) @pick.1 @hole) @site
 (#eq? @pick.1 "String")
 (#set! form "string-field"))

((function_item
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3
   return_type: (type_identifier) @pick.1 @hole) @site
 (#eq? @pick.1 "String")
 (#set! form "string-return"))

((call_expression
   function: (scoped_identifier
     path: (identifier) @pick.1 @hole
     name: (identifier) @pick.2)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "String")
 (#any-of? @pick.2 "from" "new" "with_capacity")
 (#set! form "string-make"))

; 둘 사이를 건너는 자리 — `.as_str()` 은 빌리고 `.to_string()` 은 산다.
((call_expression
   function: (field_expression
     value: [(identifier) (field_expression)] @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "as_str" "to_string" "to_owned")
 (#set! form "cross"))
