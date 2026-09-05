; 정수 타입이 **없다.** 전부 64비트 부동소수라 2⁵³−1 위는 조용히 어긋난다.
; 코드에서 그 사실이 드러나는 자리는 **한계를 이름으로 적은 곳**과 **다른 종류를 부른 곳**이다.
((member_expression
   object: (identifier) @pick.1
   "." @pick.2
   property: (property_identifier) @pick.3) @site
 (#eq? @pick.1 "Number")
 (#match? @pick.3 "^(MAX_SAFE_INTEGER|MIN_SAFE_INTEGER|MAX_VALUE|MIN_VALUE|isSafeInteger|isInteger)$")
 (#set! form "limit"))

; `BigInt(id)` — 안전 정수 위를 다루려고 아예 다른 종류를 만든다.
((call_expression
   function: (identifier) @pick.1
   arguments: (arguments . (_) @pick.2)) @site
 (#eq? @pick.1 "BigInt")
 (#set! form "bigint"))
