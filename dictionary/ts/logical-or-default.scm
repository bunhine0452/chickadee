; `a || 기본값` — 오른쪽이 리터럴일 때만 「기본값 주기」로 본다.
; `if (a || b)` 같은 참·거짓 판정까지 잡으면 한 개념이 두 가지 일을 하게 된다.
((binary_expression
   left: (_) @pick.1
   operator: "||" @pick.2
   right: [
     (string)
     (template_string)
     (number)
     (array)
     (object)
   ] @pick.3) @site
 (#set! form "default"))
