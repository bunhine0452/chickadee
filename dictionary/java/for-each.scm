; 하나씩 훑기. 괄호 안이 `;` 세 칸이 아니라 `타입 이름 : 담긴 것` 이라 노드가 아예 다르다
; (`enhanced_for_statement`) — 세 칸짜리는 `java/for-loop` 의 자리다.
;
; 짚을 자리 넷: 이름 · 담긴 것 · 몸통 · 그리고 그 셋을 가르는 `for`.
((enhanced_for_statement
   "for" @pick.1
   type: (_) @pick.2
   name: (identifier) @pick.3
   value: (_) @pick.4
   body: (_) @pick.5) @site
 (#set! form "for-each"))
