; 백틱 문자열 안의 `${...}` — 값을 그 자리에 끼워 넣는다.
; `${}` 가 없는 백틱 문자열은 여러 줄 문자열일 뿐이라 걸리지 않는다.
((template_string
   (template_substitution (_) @pick.1) @pick.2) @site
 (#set! form "interpolated"))
