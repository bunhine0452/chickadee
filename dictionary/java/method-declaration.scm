; 메서드 정의. 짚는 자리가 **돌려줄 타입**이고 그것이 이름 앞에 온다는 것이 요점이다.
; 빈칸은 안 낸다 — 타입이 사용처마다 다르다(`void`·`int`·`ResponseEntity<…>`). yaml 의
; `no_hole_reason` 을 보라.
((method_declaration
   type: (_) @pick.1
   name: (identifier) @pick.2
   parameters: (formal_parameters) @pick.3
   body: (block) @pick.4) @site
 (#set! form "method"))
