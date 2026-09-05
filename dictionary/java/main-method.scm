; 프로그램이 시작하는 자리. 요점은 이름이 **내가 고르는 것이 아니라는 것**이다 —
; JVM 이 `main` 이라는 글자를 찾으므로 한 글자만 달라도 시작점이 아니다.
; 그래서 구멍은 이름이고, 나머지 넷(`public`·`static`·`void`·매개변수)은 짚기만 한다.
((method_declaration
   (modifiers) @pick.4
   type: (void_type) @pick.1
   name: (identifier) @pick.2 @hole
   parameters: (formal_parameters) @pick.3) @site
 (#eq? @pick.2 "main")
 (#set! form "main"))
