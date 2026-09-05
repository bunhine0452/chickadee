; 대괄호가 리스트다. **콤마 하나 붙은 괄호가 튜플**이고 `(1)` 은 튜플이 아니라 숫자 1 이라,
; 「무엇으로 묶었나」가 값의 종류를 정한다.
;
; `xs[0]` 은 `subscript` 라 여기 안 잡히고(`py/index-access` 의 자리), 타입 힌트 `list[str]` 도
; 같은 `subscript` 라 함께 빠진다 — `py.md` §8 ② 가 지적한 함정을 이 개념은 안 밟는다.

; 항목이 든 리스트 — 첫 항목이 무엇인지가 그 줄에서 보인다.
((list
   . "[" @pick.1
   . (_) @pick.2
   "]" @pick.3) @site
 (#set! form "items"))

; 빈 리스트 — 나중에 채울 자리다. 진릿값 판정에서 **거짓**이 되는 것이 여기서 시작한다.
((list
   . "[" @pick.1
   . "]" @pick.3) @site
 (#set! form "empty"))

; 튜플 — 같은 항목을 콤마로 묶었는데 **고칠 수 없다.** 대괄호와의 대비가 이 개념의 절반이다.
((tuple
   . (_) @pick.2
   . "," @pick.1) @site
 (#set! form "tuple"))

; 괄호 없는 튜플 — `a, b = b, a` · `return x, y`. 문법이 이것을 `expression_list` 로 담아서
; 노드 이름이 다르지만 나오는 값은 위와 같은 묶음이다. 「묶음을 만드는 것은 괄호가 아니라
; 콤마」가 여기서 눈에 보인다.
((expression_list
   . (_) @pick.2
   . "," @pick.1) @site
 (#set! form "bare-tuple"))
