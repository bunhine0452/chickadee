; `조건 ? 이것 : 저것` — 문이 아니라 식이라 값이 나오고, 그대로 대입된다.
((ternary_expression
   condition: (_) @pick.1
   consequence: (_) @pick.2
   alternative: (_) @pick.3) @site
 (#set! form "ternary"))
