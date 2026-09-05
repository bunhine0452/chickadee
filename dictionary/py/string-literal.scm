; 따옴표 넷(`'` `"` `'''` `"""`)이 같은 값을 만든다. `f"…"` 는 접두가 붙는 순간 다른 개념이
; 되므로(`py/f-string`) 여기서는 **접두가 없는 것**만 잡는다 — `#eq?` 로 여는 따옴표 자체를
; 견주면 `f`·`b`·`r` 이 붙은 것이 자연히 빠진다. 텍스트 술어로 접두를 **부정**하지 않는
; 이유는 `py/arithmetic` 이 적은 것과 같다: 부정은 새는 자리가 조용하다.

; 큰따옴표.
((string
   (string_start) @pick.2
   (string_content) @pick.1
   (string_end) @pick.3) @site
 (#eq? @pick.2 "\"")
 (#set! form "double"))

; 작은따옴표 — 값은 위와 **같다.** 따옴표 종류는 값의 종류가 아니다.
((string
   (string_start) @pick.2
   (string_content) @pick.1
   (string_end) @pick.3) @site
 (#eq? @pick.2 "'")
 (#set! form "single"))

; **붙여 쓴 두 리터럴(`concatenated_string`)은 안 잡는다.** 그 노드의 자식이 `string` 이라
; 위의 두 패턴이 이미 각각 잡고, 셋을 다 잡으면 한 줄이 사용처 **셋**이 되어 카드가 세 장 난다.
; 「콤마가 빠지면 항목 둘이 조용히 한 값이 된다」는 함정은 yaml 의 뜻 고르기가 묻는다 —
; 그 물음의 답이 값이 아니라 **개수**라 사용처가 필요 없다.
