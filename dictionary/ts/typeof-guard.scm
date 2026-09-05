; `typeof x === '…'` — TS 파일이라면 타입이 좁혀질 자리인데 이 파일에는 타입이 없다.
; 그래서 갈리는 것은 타입이 아니라 값의 갈래다. `ts/narrowing` 의 alternatives 짝이다.
((binary_expression
   left: (unary_expression operator: "typeof" argument: (_) @pick.2) @pick.1
   operator: ["===" "!==" "==" "!="]
   right: (string) @pick.3) @site
 (#set! form "typeof-eq"))
