; 두 값 견주기.
;
; **자리표가 있는 사용처를 뺀다.** 자리표는 문법이 조용히 다른 것으로 읽는다 —
; `:name` 은 `field`(열 이름!)로, `#{name}` 은 닫는 중괄호가 잘린 `unary_expression` 으로
; 잡히고 둘 다 `quality: ok` 이며 `in_error` 도 0 이다. 그대로 두면 값 자리를 「열 이름」이라고
; 가르치게 된다.
;
; 노드 종류로는 못 거른다 — 진짜 조인(`u.id = d.uid`)도 오른쪽이 `field` 다. 대신 **사용처의
; 글자**를 본다: 자리표 표시(`:`·`#`)가 남아 있으면 뺀다. 실측으로 리터럴·조인·숫자는 남고
; 자리표 둘만 빠진다. Postgres 의 `::` 형 변환도 같이 빠지는데, 이 앱은 SQLite 를 쓰고
; **틀린 것을 가르치느니 몇을 놓치는 편**이 낫다.
((binary_expression
   left: (_) @pick.2
   operator: ["=" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#not-match? @site "[:#]")
 (#set! form "compare"))
