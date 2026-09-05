; 실패면 여기서 나가기. 한 글자가 「실패면 나가고 아니면 값을 꺼낸다」를 다 한다 —
; ai-pm 2,903곳, 스무 줄에 하나꼴. 빈칸은 안 낸다 — 한 글자라 생성기가 뺀다(`MIN_HOLE`).
((let_declaration
   pattern: (identifier) @pick.3
   value: (try_expression (_) @pick.2 "?" @pick.1)) @site
 (#set! form "try-let"))

((try_expression
   (_) @pick.2
   "?" @pick.1) @site
 (#set! form "try"))
