; 계산 계획을 들고 있기. 이 타입이 적힌 자리는 **값이 아니라 계산 방법**을 들고 있고,
; 훑을 때 비로소 돈다. 두 번 훑으면 두 번 돈다.
((method_declaration
   returns: (generic_name
     (identifier) @pick.1 @hole
     (type_argument_list . (_) @pick.2))
   name: (identifier) @pick.3) @site
 (#any-of? @pick.1 "IEnumerable" "IQueryable" "IAsyncEnumerable")
 (#set! form "returns"))

((local_declaration_statement
   (variable_declaration
     type: (generic_name
       (identifier) @pick.1 @hole
       (type_argument_list . (_) @pick.2))
     (variable_declarator name: (identifier) @pick.3))) @site
 (#any-of? @pick.1 "IEnumerable" "IQueryable" "IAsyncEnumerable")
 (#set! form "local"))

((parameter
   type: (generic_name
     (identifier) @pick.1 @hole
     (type_argument_list . (_) @pick.2))
   name: (identifier) @pick.3) @site
 (#any-of? @pick.1 "IEnumerable" "IQueryable" "IAsyncEnumerable")
 (#set! form "param"))

((property_declaration
   type: (generic_name
     (identifier) @pick.1 @hole
     (type_argument_list . (_) @pick.2))
   name: (identifier) @pick.3) @site
 (#any-of? @pick.1 "IEnumerable" "IQueryable" "IAsyncEnumerable")
 (#set! form "property"))
