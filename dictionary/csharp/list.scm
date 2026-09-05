; 순서 있는 목록. 각괄호 안의 타입이 담기는 것이고, 길이가 고정된 배열과는 **다른 타입**이다
; (`Count` 대 `Length`).
;
; 빈칸은 안 낸다 — 바깥 이름이 사용처마다 다르다(`List`·`IReadOnlyList`·`ICollection`).
((local_declaration_statement
   (variable_declaration
     type: (generic_name
       (identifier) @pick.1
       (type_argument_list . (_) @pick.2))
     (variable_declarator name: (identifier) @pick.3))) @site
 (#any-of? @pick.1 "List" "IList" "IReadOnlyList" "ICollection" "IReadOnlyCollection")
 (#set! form "local"))

((field_declaration
   (variable_declaration
     type: (generic_name
       (identifier) @pick.1
       (type_argument_list . (_) @pick.2))
     (variable_declarator name: (identifier) @pick.3))) @site
 (#any-of? @pick.1 "List" "IList" "IReadOnlyList" "ICollection" "IReadOnlyCollection")
 (#set! form "field"))

((property_declaration
   type: (generic_name
     (identifier) @pick.1
     (type_argument_list . (_) @pick.2))
   name: (identifier) @pick.3) @site
 (#any-of? @pick.1 "List" "IList" "IReadOnlyList" "ICollection" "IReadOnlyCollection")
 (#set! form "property"))

((parameter
   type: (generic_name
     (identifier) @pick.1
     (type_argument_list . (_) @pick.2))
   name: (identifier) @pick.3) @site
 (#any-of? @pick.1 "List" "IList" "IReadOnlyList" "ICollection" "IReadOnlyCollection")
 (#set! form "param"))
