; 코드가 사는 상자. 구멍은 `class` 라는 **고정 낱말**이다 — 오답 `interface`·`enum`·`record`
; 가 같은 자리에 오는 다른 상자라 보기 넷이 같은 종류로 선다.
((class_declaration
   "class" @pick.1 @hole
   name: (identifier) @pick.2
   body: (class_body) @pick.3) @site
 (#set! form "class"))
