; **왼쪽의 콤마 하나**로 풀린다. 괄호가 필요 없고, 개수가 안 맞으면 그 자리에서 멈춘다.
; `a, b = b, a` 가 임시 변수 없이 자리를 바꾸는 것이 이 문법의 가장 짧은 증거다.
;
; 오른쪽의 콤마는 묶는 일이고(`py/list-literal` 의 `bare-tuple`) 왼쪽의 콤마는 푸는 일이다.
; 노드도 다르다 — `expression_list` 대 `pattern_list`. 같은 글자가 자리에 따라 반대로 군다.

; `a, b = pair` — 왼쪽이 `pattern_list` 다.
((assignment
   left: (pattern_list
           . (_) @pick.2
           . "," @pick.1 @hole)
   right: (_) @pick.3) @site
 (#set! form "assign"))

; `for k, v in d.items():` — 훑는 자리에서도 같은 규칙이 돈다. 파이썬 코드에서 가장 흔한 자리다.
((for_statement
   left: (pattern_list
           . (_) @pick.2
           . "," @pick.1 @hole)
   right: (_) @pick.3) @site
 (#set! form "loop"))

; `head, *rest = xs`(별 하나가 남은 것 전부를 받는다)는 **패턴을 따로 안 둔다.** 위의 `assign`
; 이 이미 그 줄을 잡는데, 별도 패턴을 더하면 같은 줄이 사용처 둘이 되어 카드가 두 장 난다.
; 별의 뜻은 `meaning` 문항이 묻는다 — 답이 값이 아니라 **어느 이름이 몇 개를 받나**라
; 사용처가 따로 필요 없다.
