((await_expression "await" @pick.1 (_) @pick.2) @site
 (#set! form "await"))

((arrow_function "async" @pick.1 "=>" @pick.3 body: (_) @pick.2) @site
 (#set! form "async-arrow"))

((function_declaration "async" @pick.1 name: (identifier) @pick.2
   parameters: (formal_parameters) @pick.3) @site
 (#set! form "async-fn"))
