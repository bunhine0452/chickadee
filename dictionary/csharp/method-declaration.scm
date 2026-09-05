; 타입 안에 메서드 만들기. 짚는 자리가 **돌려줄 타입**이고 그것이 이름 앞에 온다는 것이
; 요점이다. 빈칸은 안 낸다 — 타입이 사용처마다 다르다(`void`·`int`·`Task<ActionResult>`).
; yaml 의 `no_hole_reason` 을 보라.
;
; 지역 함수(`local_function_statement`)도 같은 개념이다 — C# 에서 「타입 밖의 함수」에 가장
; 가까운 것이고, 그래도 여전히 메서드 안에 산다.
((method_declaration
   returns: (_) @pick.1
   name: (identifier) @pick.2
   parameters: (parameter_list) @pick.3
   body: (_) @pick.4) @site
 (#set! form "method"))

((local_function_statement
   type: (_) @pick.1
   name: (identifier) @pick.2
   parameters: (parameter_list) @pick.3
   body: (_) @pick.4) @site
 (#set! form "local"))
