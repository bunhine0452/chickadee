; 중괄호 안이 **식**이라 그 자리에서 계산된다. 앞의 `f` 한 글자가 빠지면 오류가 아니라
; 중괄호가 글자로 남는다 — 조용히 틀린 문자열이 로그에 찍힌다.
;
; `@site` 를 문자열 전체가 아니라 **한 칸(`interpolation`)** 에 둔다. 문자열에 두면
; `f"{a} 와 {b}"` 가 매치 둘을 내는데 `@site` 범위가 같아 한 줄에 카드가 두 장 난다.
; 접두 `f` 는 그 칸 밖(`string_start`)에 있으므로 `@pick.3` 으로 함께 짚는다.

((string
   (string_start) @pick.3
   (interpolation
     "{" @pick.2
     (_) @pick.1) @site)
 (#match? @pick.3 "^[fF]")
 (#set! form "slot"))
