; 파이썬 정수에는 자릿수 한계가 없다. **없는 것**은 노드로 안 잡히므로, 한계가 있었다면
; 거기서 감겼을 자리를 잡는다 — 자리를 늘리는 거듭제곱과, 64비트로 못 담는 리터럴.
;
; 사용자 리포 둘에 `**` 는 3곳, 19자리 넘는 정수 리터럴은 0곳이다. 이 개념은 사용처가 아니라
; **합성**이 정본이고, 「네 코드엔 없다」의 사유는 `scale` 이다 (D177 규칙 ①).

; 거듭제곱 — 결과가 커져도 자리가 따라 늘어난다.
((binary_operator
   left: (_) @pick.2
   operator: "**" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "power"))

; 19자리 이상 — 다른 언어의 64비트 정수라면 여기서 감긴다.
((integer) @site @pick.1
 (#match? @pick.1 "^[0-9]{19,}$")
 (#set! form "huge"))

; `.bit_length()` — 이 값이 몇 자리를 쓰고 있는지를 코드가 직접 묻는 자리.
((call
   function: (attribute
               object: (_) @pick.2
               attribute: (identifier) @pick.1)
   arguments: (argument_list) @pick.3) @site
 (#eq? @pick.1 "bit_length")
 (#set! form "width"))
