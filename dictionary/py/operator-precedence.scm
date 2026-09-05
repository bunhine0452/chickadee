; 식은 왼쪽부터 읽히지 **않는다.** 연산자마다 세기가 있어서 센 쪽이 먼저 접히고,
; `**` 만 오른쪽부터 접힌다 — `2 ** 3 ** 2` 가 64 가 아니라 512 인 이유다.
;
; 접힘이 코드에 보이는 자리는 **세기가 다른 둘이 괄호 없이 섞인 곳**이다. 괄호가 있으면
; 순서가 이미 적혀 있어 물을 것이 없다.

; `a + b * c` — 곱셈이 오른쪽에 있다.
((binary_operator
   left: (_) @pick.2
   operator: ["+" "-"] @pick.1
   right: (binary_operator operator: ["*" "/" "//" "%"]) @pick.3) @site
 (#set! form "mul-right"))

; `a * b + c` — 곱셈이 왼쪽에 있다.
((binary_operator
   left: (binary_operator operator: ["*" "/" "//" "%"]) @pick.3
   operator: ["+" "-"] @pick.1
   right: [(identifier) (integer) (float) (call) (attribute) (subscript)
           (parenthesized_expression) (unary_operator)] @pick.2) @site
 (#set! form "mul-left"))

; `a or b and c` — `and` 가 `or` 보다 세다. 괄호가 없으면 `a or (b and c)` 로 접힌다.
((boolean_operator
   left: (_) @pick.2
   operator: "or" @pick.1
   right: (boolean_operator operator: "and" @hole) @pick.3) @site
 (#set! form "and-first"))

; `a ** b ** c` — 이것만 **오른쪽부터** 접힌다.
((binary_operator
   left: (_) @pick.2
   operator: "**" @pick.1
   right: (binary_operator operator: "**") @pick.3) @site
 (#set! form "right-assoc"))
