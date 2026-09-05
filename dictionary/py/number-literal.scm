; `1` 과 `1.0` 은 **다른 종류**다. 그 사실이 코드에 드러나는 자리는 리터럴이 이름에 담기는
; 줄이다 — 담기고 나면 이름만 보이고 종류는 안 보인다.
;
; 벌거벗은 리터럴(`(integer)` 전부)을 안 잡는 이유: adelie 139파일에 정수 리터럴만 2,157곳이고
; 그 대부분이 `range(3)`·`[0]`·`timeout=30` 같은 **다른 개념의 조연**이다. 담기는 자리로
; 좁히면 「이 이름에 든 것이 정수냐 소수냐」를 물을 수 있다.

; 정수 — 소수점이 없다.
((assignment
   left: (identifier) @pick.2
   "=" @pick.3
   right: (integer) @pick.1) @site
 (#set! form "int"))

; 소수 — 점 하나가 종류를 바꾼다.
((assignment
   left: (identifier) @pick.2
   "=" @pick.3
   right: (float) @pick.1) @site
 (#set! form "float"))

; 이름 인자의 기본값도 같은 자리다 — `timeout=30` 의 `30` 이 무슨 종류인지가 함수의 계약이다.
((keyword_argument
   name: (identifier) @pick.2
   "=" @pick.3
   value: [(integer) (float)] @pick.1) @site
 (#set! form "kwarg"))
