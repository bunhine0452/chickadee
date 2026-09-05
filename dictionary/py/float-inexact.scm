; `0.1 + 0.2` 가 `0.30000000000000004` 다. 2진수로 `0.1` 을 정확히 못 적기 때문이고,
; 그 사실이 코드에 드러나는 자리는 셋이다 — 소수가 든 셈, 자릿수를 잘라 감추는 `round`,
; 그리고 `==` 대신 「가까운가」를 묻는 `isclose`.
;
; 두 패턴이 겹치지 않게 왼쪽·오른쪽을 갈랐다: 둘째 패턴의 `left` 는 소수가 아닌 것만
; 열거한다. 안 그러면 `0.1 + 0.2` 가 사용처 **둘**이 되어 한 줄에 카드가 두 장 난다.

; 왼쪽이 소수인 셈.
((binary_operator
   left: (float) @pick.2
   operator: ["+" "-" "*" "/"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "floatop"))

; 오른쪽만 소수인 셈.
((binary_operator
   left: [(identifier) (integer) (call) (attribute) (subscript)
          (parenthesized_expression) (unary_operator) (binary_operator)] @pick.3
   operator: ["+" "-" "*" "/"] @pick.1
   right: (float) @pick.2) @site
 (#set! form "floatop"))

; `round(x, 2)` — 어긋남을 지우는 것이 아니라 **보이지 않게 자른다.**
((call
   function: (identifier) @pick.1
   arguments: (argument_list "(" @pick.3 . (_) @pick.2)) @site
 (#eq? @pick.1 "round")
 (#set! form "round"))

; `math.isclose(a, b)` — 소수를 `==` 로 못 견주니 「가까운가」를 묻는다.
((call
   function: (attribute
               object: (_) @pick.3
               attribute: (identifier) @pick.1)
   arguments: (argument_list) @pick.2) @site
 (#eq? @pick.1 "isclose")
 (#set! form "isclose"))
