; class 선언. 본문의 첫 멤버 하나만 짚는다 — 멤버마다 매치하면 사용처가 부풀어 오른다.
((class_declaration
   name: (_) @pick.1
   body: (class_body . (_) @pick.2)) @site
 (#set! form "class"))

; 생성자를 가진 class — `new` 로 만들 때 그 자리가 먼저 돈다. 클래스마다 하나뿐이다.
((class_declaration
   name: (_) @pick.1
   body: (class_body (method_definition name: (_) @pick.3))) @site
 (#eq? @pick.3 "constructor")
 (#set! form "with-ctor"))
