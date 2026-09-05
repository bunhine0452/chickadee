; 이름을 세우는 줄과 옮기는 줄. C# 은 둘을 **낱말 하나**로 가른다 — 세우는 줄에는 이름 앞에
; 타입 이름이나 `var` 가 있고, 옮기는 줄에는 없다.
;
; 두 패턴의 `@pick.1` 이 같은 물음을 진다: **이 줄이 세우는 줄인지 옮기는 줄인지 정하는 자리.**
; 세우는 줄에서는 타입 낱말이고 옮기는 줄에서는 등호 자체다.
((local_declaration_statement
   (variable_declaration
     type: (_) @pick.1 @hole
     (variable_declarator
       name: (identifier) @pick.2
       (_) @pick.3))) @site
 (#set! form "declare"))

((expression_statement
   (assignment_expression
     left: (identifier) @pick.2
     operator: "=" @pick.1
     right: (_) @pick.3)) @site
 (#set! form "reassign"))
