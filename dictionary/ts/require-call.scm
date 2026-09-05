; CJS — `import`/`export` 와 같은 일을 하는 다른 체계. 두 짝을 다 잡는다.
((variable_declarator
   name: (_) @pick.1
   value: (call_expression
     function: (identifier) @pick.2
     arguments: (arguments . (string) @pick.3))) @site
 (#eq? @pick.2 "require")
 (#set! form "require"))

((assignment_expression
   left: (member_expression object: (identifier) @pick.1 property: (property_identifier) @pick.2)
   right: (_) @pick.3) @site
 (#eq? @pick.1 "module")
 (#eq? @pick.2 "exports")
 (#set! form "module-exports"))
