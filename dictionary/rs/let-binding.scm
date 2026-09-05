; 이름에 값 묶기. 구멍은 `let` 이고, 오답은 전부 같은 자리에 설 수 있는 낱말이다.
;
; `let mut` 는 `rs/mut-binding` 이 가져간다 — 앵커 `.` 가 「`let` 다음의 첫 명명 노드가
; 패턴」이게 해서 `mutable_specifier` 가 낀 줄을 뺀다. 튜플·구조체 패턴(`let (a, b) = …`)은
; 안 잡는다 — 이 개념은 이름 하나에 값 하나다.
((let_declaration
   "let" @pick.1 @hole
   . pattern: (identifier) @pick.2
   value: (_) @pick.3) @site
 (#set! form "let"))
