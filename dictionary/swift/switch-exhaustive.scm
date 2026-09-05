; 모든 경우를 적기. 빠뜨린 경우가 있으면 컴파일이 멈춘다 — 그래서 `default` 를 적어 두는
; 습관이 오히려 손해다.
((switch_statement
   "switch" @pick.1 @hole
   expr: (_) @pick.2
   (switch_entry) @pick.3) @site
 (#set! form "switch"))
