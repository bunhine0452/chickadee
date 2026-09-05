; 밖으로 흘려보내기. 비트를 옮기는 기호가 출력이 된다 — 연산자에 다른 뜻을 붙일 수 있다는
; 사실의 첫 노출이다 (`cpp.md` §3 #21).
((binary_expression
   left: (qualified_identifier name: (identifier) @ctx.stream) @pick.2
   operator: "<<" @pick.1 @hole
   right: (_) @pick.3) @site
 (#any-of? @ctx.stream "cout" "cerr" "clog")
 (#set! form "cout"))

; 이어 붙인 자리 — 왼쪽이 이미 흘려보내기 식이면 그 결과에 다시 붙는다.
((binary_expression
   left: (binary_expression operator: "<<") @pick.2
   operator: "<<" @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "chain"))
