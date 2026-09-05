; 파일 안에만 두거나 값을 남기기. 같은 낱말이 자리에 따라 다른 일을 한다 — 맨 바깥에서는 「이 파일 밖에서
; 안 보임」, 함수 안에서는 「부를 때마다 값이 남음」. 부모 노드로 그 둘을 가른다. `#ifdef` 안의 파일 범위
; 선언은 부모가 다르라 안 잡힌다 — 드물어서 받아들인다.
((translation_unit
   (declaration
     (storage_class_specifier) @pick.1 @hole
     type: (_) @pick.2
     declarator: (_) @pick.3) @site)
 (#eq? @pick.1 "static")
 (#set! form "file-scope"))

((compound_statement
   (declaration
     (storage_class_specifier) @pick.1 @hole
     type: (_) @pick.2
     declarator: (_) @pick.3) @site)
 (#eq? @pick.1 "static")
 (#set! form "local"))

((function_definition
   (storage_class_specifier) @pick.1 @hole
   type: (_) @pick.2
   declarator: (function_declarator declarator: (identifier) @pick.3)) @site
 (#eq? @pick.1 "static")
 (#set! form "function"))
