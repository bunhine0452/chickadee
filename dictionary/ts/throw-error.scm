; 터뜨리기 — 이 줄 아래는 안 돌고, 받아 줄 곳을 찾아 호출 스택을 거슬러 올라간다.
((throw_statement
   "throw" @pick.1
   (new_expression constructor: (_) @pick.2 arguments: (arguments . (_) @pick.3))) @site
 (#set! form "new-error"))

; 값이면 무엇이든 던져진다 — `catch (e)` 의 e 가 Error 라는 보장이 없는 이유가 이것이다.
((throw_statement
   "throw" @pick.1
   [(identifier) (string) (object) (call_expression) (template_string)] @pick.2) @site
 (#set! form "value"))
