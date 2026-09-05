; 원본을 넘기기. 요점은 **부르는 쪽에 아무 표시가 없다**는 것이다 — `f(v)` 만 보고는
; `v` 가 바뀔지 알 수 없고, 그 답은 정의부에만 적혀 있다 (`cpp.md` §3 #13).
((parameter_declaration
   type: (_) @pick.3
   declarator: (reference_declarator "&" @pick.1 @hole (identifier) @pick.2)) @site
 (#set! form "byref"))
