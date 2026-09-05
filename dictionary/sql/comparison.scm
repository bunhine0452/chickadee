; 두 값 견주기.
;
; 자리표(`:name` · `#{name}`)는 이제 **파서에게만** 같은 너비의 글자 값으로 가려져 들어간다
; (`crates/parse/src/params.rs`). 그래서 오른쪽이 `field`(열 이름!)나 잘린 `unary_expression`
; 이 아니라 `literal` 로 잡히고, 사용처의 글은 원문 그대로라 학습자는 `#{userId}` 를 본다.
; 예전에는 이 자리에 `(#not-match? @site "[:#]")` 가 있었다 — 틀린 것을 가르치지 않으려고
; 자리표가 있는 사용처를 통째로 뺐고, 그 대가로 표본 리포 매퍼 9파일에서 캡처가 0 이었다.
((binary_expression
   left: (_) @pick.2
   operator: ["=" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))
