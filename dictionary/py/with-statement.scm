; 블록을 나가는 **모든 길**에서 닫힌다 — `return` 으로 나가도, 예외로 튕겨도. `open()` 을
; `with` 없이 쓴 코드와 쓴 코드의 차이가 여기서만 보인다.
;
; `py/try-except` 의 `finally` 와 하는 일이 같다. 다른 것은 **누가 적느냐**다 — `finally` 는
; 쓰는 사람이 정리를 적고, `with` 는 열어 준 쪽이 이미 적어 둔 것을 부른다.

; `with open(path) as f:` — 여는 식과 받는 이름.
((with_statement
   "with" @pick.1 @hole
   (with_clause
     (with_item value: (_) @pick.2))
   body: (block) @pick.3) @site
 (#set! form "with"))
