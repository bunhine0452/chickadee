; 섞으면 넓은 쪽으로 올라간다 — `bool` ⊂ `int` ⊂ `float`. 그런데 **문자열과 숫자는 자동으로
; 안 섞인다**: `"1" + 1` 은 그 자리에서 `TypeError` 로 멈춘다. 파이썬이 JS 와 갈리는 자리다.
;
; 두 피연산자의 타입을 알아야 하는 일이라 tree-sitter 도 정규식도 모른다(`py.md` §1.5.3
; 「못 쟀다」). 그래서 **한쪽이 리터럴로 적혀 있는 자리**만 잡는다 — 거기서는 타입이 코드에
; 그대로 보인다. 사용자 리포 둘에서 이 쿼리의 캡처가 몇 곳인지는 `_lang.yaml` 이 적는다.

; 정수와 소수가 한 식에 — 결과는 소수다.
((binary_operator
   left: (integer) @pick.2
   operator: ["+" "-" "*"] @pick.1
   right: (float) @pick.3) @site
 (#set! form "widen"))

((binary_operator
   left: (float) @pick.3
   operator: ["+" "-" "*"] @pick.1
   right: (integer) @pick.2) @site
 (#set! form "widen"))

; 참·거짓이 수로 쓰이는 자리 — `True + True` 가 2 다. `bool` 이 `int` 의 부분집합이라서.
((binary_operator
   left: [(true) (false)] @pick.2
   operator: ["+" "-" "*"] @pick.1
   right: (_) @pick.3) @site
 (#set! form "boolnum"))

((binary_operator
   left: [(identifier) (integer) (float) (call) (attribute) (subscript)] @pick.3
   operator: ["+" "-" "*"] @pick.1
   right: [(true) (false)] @pick.2) @site
 (#set! form "boolnum"))
