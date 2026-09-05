; 호출 결과(`if get_items():`)는 안 잡는다 — 돌아오는 것이 목록인지 참·거짓인지가 그 줄에
; 안 적혀 있어서, 「빈 것이 거짓이다」가 참인 자리인지 카드가 못 가린다.
;
; 빈 것이 거짓이다 — 빈 리스트·빈 글자·`0`. 그 규칙이 실제로 도는 자리는 **견주기 없이 값을
; 그대로 조건에 둔 곳**이고, 사용자 리포 둘에서 728곳이다. 반대로 `x == True` 는 **0곳**이다
; (`py-learning.md` §11.5) — 오개념은 있는데 코드에는 없다.

; `if items:` — 값이 그대로 갈림길에 온다.
((if_statement
   "if" @pick.3
   condition: [(identifier) (attribute) (subscript)] @pick.1
   consequence: (block) @pick.2) @site
 (#set! form "bare-if"))

; `if not items:` — 뒤집기도 같은 규칙을 쓴다.
((if_statement
   "if" @pick.3
   condition: (not_operator
                "not" @pick.2
                argument: [(identifier) (attribute) (subscript)] @pick.1)) @site
 (#set! form "negate"))

; `while queue:` — 갈림길만의 규칙이 아니다.
((while_statement
   "while" @pick.3
   condition: [(identifier) (attribute) (subscript)] @pick.1
   body: (block) @pick.2) @site
 (#set! form "bare-while"))
