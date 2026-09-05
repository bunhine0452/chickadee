; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; **최상위 문(`global_statement`)을 반드시 넣는다** (`docs/curriculum/csharp.md` §0.7 ⑤·§8 ⑥).
; .NET 6 이후 `Program.cs` 는 클래스 없이 문이 바로 오고, ASP.NET Core 모양을 기준으로
; 잡았으므로 그 노드가 첫 화면의 대부분이다. 이름이 없는 문(`builder.Build();`)은 이름 잡을
; 자리가 없어 빠진다 — 이름 있는 줄(`var app = …`)만 블록이 된다.
((class_declaration name: (identifier) @block.name) @block.function
 (#set! form "class"))

((struct_declaration name: (identifier) @block.name) @block.function
 (#set! form "class"))

((record_declaration name: (identifier) @block.name) @block.function
 (#set! form "class"))

((interface_declaration name: (identifier) @block.name) @block.function
 (#set! form "class"))

((method_declaration name: (identifier) @block.name) @block.function
 (#set! form "method"))

((constructor_declaration name: (identifier) @block.name) @block.function
 (#set! form "method"))

((local_function_statement name: (identifier) @block.name) @block.function
 (#set! form "method"))

((global_statement
   (local_declaration_statement
     (variable_declaration (variable_declarator name: (identifier) @block.name)))) @block.function
 (#set! form "toplevel"))
