; 잡거나 넘기거나 — 문법이 둘 중 하나를 **시키는** 예외. 넘긴다고 적는 자리가 이 낱말이다.
;
; `throws` 절 전체가 아니라 낱말 하나를 짚는다. 예외 타입이 둘 이상이면 절 안에 타입이
; 여럿 들어오는데, 절을 통째로 잡으면 자리가 하나씩 늘어난다 — 메서드 하나에 자리 하나가
; 맞으므로 절 노드에는 캡처를 안 건다.
((method_declaration
   type: (_) @pick.4
   name: (identifier) @pick.2
   parameters: (formal_parameters) @pick.3
   (throws "throws" @pick.1 @hole)) @site
 (#set! form "throws"))
