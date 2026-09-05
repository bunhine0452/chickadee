; 만들 때 한 번 하는 준비. **반환 타입 칸이 없다**는 것이 눈으로 보이는 자리이고
; (`method_declaration` 은 `type:` 이 있다) 이름이 클래스 이름과 같다.
;
; 빈칸은 안 낸다 — 지울 고정 낱말이 없다. yaml 의 `no_hole_reason` 을 보라.
((constructor_declaration
   (modifiers)? @pick.4
   name: (identifier) @pick.1
   parameters: (formal_parameters) @pick.2
   body: (constructor_body) @pick.3) @site
 (#set! form "ctor"))
