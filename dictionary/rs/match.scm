; 모양으로 갈라 꺼내기. 갈래를 빠뜨리면 **컴파일이 멈춘다**(E0004) — 다른 언어의 `switch` 는
; 빠뜨려도 조용히 지나간다. 구멍은 `match`.
((match_expression
   "match" @pick.1 @hole
   value: (_) @pick.2
   body: (match_block) @pick.3) @site
 (#set! form "match"))

; 갈래 하나 — 모양 `=>` 값. 모양에 든 이름이 값을 꺼낸다.
((match_arm
   pattern: (match_pattern) @pick.2
   "=>" @pick.1
   value: (_) @pick.3) @site
 (#set! form "arm"))
