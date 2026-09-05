; **식 하나만 담는다** — `return` 도 여러 줄도 못 넣는다. `sorted(key=…)` 자리에서만 거의 산다.
; 이름이 없으니 그 자리에서 값으로 쓰이고, 그 사실이 「함수도 값이다」의 가장 짧은 증거다.
;
; `def` 와 다른 것이 셋이다 — 이름이 없다 · 몸통이 식 하나다 · 그 자리에서 값이 된다.
; 세 번째가 이 개념의 자리이고, `py/function-definition` 의 `bridge` 가 이미 그 대비를 적고 있다.

; `lambda x: x.name` — 콜론 뒤가 곧 돌려주는 것이다. `return` 이 없는데도 값이 나온다.
((lambda
   "lambda" @pick.1 @hole
   parameters: (lambda_parameters)? @pick.2
   body: (_) @pick.3) @site
 (#set! form "lambda"))
