; 추상 클래스 — 몸을 안 적은 자리를 남겨 두고 물려받는 쪽에 미룬다.
;
; `abstract` 는 `modifiers` 안의 익명 토큰이라 이름 있는 필드가 없다. 형제 앵커는 쓰지 않는다
; — 애너테이션이 앞에 붙은 자리가 통째로 빠진다(§9 ①).
((class_declaration
   (modifiers "abstract" @pick.1 @hole)
   name: (identifier) @pick.2
   body: (class_body) @pick.3) @site
 (#set! form "class"))

((method_declaration
   (modifiers "abstract" @pick.1 @hole)
   name: (identifier) @pick.4) @site
 (#set! form "method"))
