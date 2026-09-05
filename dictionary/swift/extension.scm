; 나중에 붙이기. 남이 만든 타입에 내 메서드를 뒤에서 붙인다 — 그래서 「이 메서드 어디서
; 왔지」가 선언 한 군데를 봐서는 안 나온다. 확장은 이름이 `user_type` 이다.
((class_declaration
   declaration_kind: "extension" @pick.1 @hole
   name: (user_type (type_identifier) @pick.2)
   body: (class_body (function_declaration name: (simple_identifier) @pick.3))) @site
 (#set! form "extension"))
