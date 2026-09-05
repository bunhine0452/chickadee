; 없음이 아니라 모름. 구멍은 `NULL` 자체이고, 그 앞의 낱말이 「견주기가 아니라 묻기」다.
; `= NULL` 은 안 걸린다 — 연산자가 `keyword_is` 도 `is_not` 도 아니라서다.
((binary_expression
   left: (_) @pick.2
   operator: [(keyword_is) (is_not)] @pick.3
   right: (literal (keyword_null) @pick.1 @hole)) @site
 (#set! form "null"))
