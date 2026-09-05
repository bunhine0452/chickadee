; 물려받아 다시 쓰기. 두 자리가 한 개념이다 — 물려받겠다고 적는 곳(`extends`)과
; 다시 쓴 메서드에 붙이는 표시(`Override` 표시).
;
; `Override` 표시 는 **강제가 아니라 검사**다. 안 붙여도 재정의되고, 붙이면 이름 오타를 컴파일러가 잡는다.
((superclass
   "extends" @pick.1 @hole
   (_) @pick.2) @site
 (#set! form "extends"))

((method_declaration
   (modifiers (marker_annotation name: (identifier) @pick.3))
   name: (identifier) @pick.4) @site
 (#eq? @pick.3 "Override")
 (#set! form "override"))
