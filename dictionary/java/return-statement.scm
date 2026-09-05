; 값 돌려주기. 두 모양이 한 개념이다 — 값을 실어 보내는 것과 그냥 끝내는 것.
;
; 값 없는 `return;` 은 앵커 `.` 로 가른다. 앵커를 안 걸면 값 있는 자리도 이 패턴에 걸려
; 사용처가 두 벌이 된다 — `return_statement` 안이라 `modifiers` 함정(§9 ①)과 무관하다.
((return_statement
   "return" @pick.1 @hole
   (_) @pick.2) @site
 (#set! form "value"))

((return_statement
   "return" @pick.1 @hole
   . ";" @pick.3) @site
 (#set! form "bare"))
