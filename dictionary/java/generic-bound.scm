; 제네릭 경계 — 타입 자리에 아무거나 오지 못하게 위를 정한다.
;
; 두 자리다: 선언 쪽의 `<T extends …>`(`type_bound`)와 받는 쪽의 `<? extends …>`(`wildcard`).
; `extends` 라는 같은 낱말이 상속과 다른 일을 하는 자리라 개념을 따로 세웠다.
((type_parameter
   (type_identifier) @pick.2
   (type_bound
     "extends" @pick.1 @hole
     (_) @pick.3)) @site
 (#set! form "bound"))

((wildcard
   "?" @pick.4
   "extends" @pick.1 @hole
   (_) @pick.5) @site
 (#set! form "wildcard"))
