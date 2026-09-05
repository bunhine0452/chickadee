; 세어 가며 되풀이. 괄호 안이 `;` 로 세 칸(시작 · 계속할 조건 · 매 바퀴 끝에 할 일)이라 짚을 자리가
; 그대로 셋이다. `for (;;)` 는 칸이 비어 여기 안 걸린다 — 그 모양은 `while (1)` 과 같은 관용구다.
((for_statement
   "for" @pick.1 @hole
   initializer: (_) @pick.2
   condition: (_) @pick.3
   update: (_) @pick.4
   body: (_) @pick.5) @site
 (#set! form "for"))
