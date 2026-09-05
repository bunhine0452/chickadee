; 값이 없는 자리 가려내기. 구멍은 `IS` 이고 오른쪽의 `NULL` 은 `literal` 로 잡힌다.
; `= NULL` 은 이 쿼리에 안 걸린다 — 연산자가 `keyword_is` 가 아니라서다. 그것이 요점이다.
((binary_expression
   left: (_) @pick.2
   operator: (keyword_is) @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "isnull"))
