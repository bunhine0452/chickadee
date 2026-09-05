; 세 칸짜리 되풀이. 괄호 안이 `;` 로 **세 칸**(시작 · 계속할 조건 · 매 바퀴 끝에 할 일)이라
; 짚을 자리가 그대로 셋이다.
;
; `for (String s : list)` 는 **다른 노드**(`enhanced_for_statement`)라 여기 안 걸린다 —
; 그 자리는 `java/for-each` 의 것이다.
((for_statement
   "for" @pick.1 @hole
   init: (_) @pick.2
   condition: (_) @pick.3
   update: (_) @pick.4
   body: (_) @pick.5) @site
 (#set! form "for"))
