; 잡을 **종류를 적어야** 한다. `except:` 만 쓰면 `Ctrl+C` 와 메모리 부족까지 삼킨다.
; `finally` 는 `return` 뒤에도 돈다 — 나가는 길이 무엇이든 그 블록은 지나간다.
;
; `@site` 를 `except_clause` 에 둔다. `try_statement` 에 두면 `except` 가 둘인 코드에서
; 같은 범위의 사용처가 둘 나서 카드가 두 장 난다 — `f-string.scm` 이 칸 하나로 좁힌 것과 같다.
; 대신 `try` 낱말은 이 매치에 안 들어오므로 `@pick.3` 은 잡는 종류가 진다.

; `except ValueError as e:` · `except (A, B):` — 종류를 적은 자리.
((except_clause
   "except" @pick.1 @hole
   . (_) @pick.3
   (block) @pick.2) @site
 (#set! form "typed"))

; `try: … finally: …` — 나가는 길이 무엇이든 지나가는 블록.
((finally_clause
   "finally" @pick.1 @hole
   (block) @pick.2) @site
 (#set! form "finally"))

; `raise HTTPException(404)` — 잡는 쪽의 반대편. 여기서 던진 것을 위의 `except` 가 받는다.
((raise_statement
   "raise" @pick.1 @hole
   (_) @pick.2) @site
 (#set! form "raise"))
