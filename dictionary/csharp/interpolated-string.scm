; 문장에 값 끼워 넣기. 앞의 `$` 하나가 이 문자열을 「값이 들어가는 틀」로 바꾼다 —
; 빠뜨리면 중괄호가 글자 그대로 남고 오류는 **안 난다**.
;
; 축자 보간(달러 뒤에 앳을 붙인 축자 문자열)과 raw 보간(`$"""…"""`)은 외부 스캐너가 따로 처리하고 이슈가 열려 있어
; 여기서 안 잡는다(`csharp.md` §8 ⑤).
((interpolated_string_expression
   (interpolation_start) @pick.1 @hole
   (string_content)? @pick.2
   (interpolation) @pick.3) @site
 (#set! form "interp"))
