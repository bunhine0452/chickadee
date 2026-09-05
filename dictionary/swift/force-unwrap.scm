; 있다고 보증하기. 「값이 있다고 내가 보증한다」는 문장이고 틀리면 그 줄에서 앱이 끝난다.
; 맨 `postfix_expression` 을 그대로 잡지 않는다 — 그러면 같은 코드가 아래 둘과 겹쳐 두 번 세어진다.
((navigation_expression
   target: (postfix_expression target: (_) @pick.2 operation: (bang) @pick.1)
   suffix: (navigation_suffix suffix: (simple_identifier) @pick.3)) @site
 (#set! form "force-nav"))

((property_declaration
   name: (pattern (simple_identifier) @pick.3)
   value: (postfix_expression target: (_) @pick.2 operation: (bang) @pick.1)) @site
 (#set! form "force-bind"))

((value_argument
   value: (postfix_expression target: (_) @pick.2 operation: (bang) @pick.1)) @site
 (#set! form "force-arg"))
