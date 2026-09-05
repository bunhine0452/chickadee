; 파이썬의 「없음」은 **하나**다. `null` 과 `undefined` 로 갈리지 않고, 그 하나가 값이라
; 이름이 그것을 가리킬 수 있다. 함수가 아무것도 안 돌려주면 그 값이 간다.
;
; `x is None` 은 여기서 안 잡는다 — 그 자리는 `py/is-identity` 의 것이고, 두 개념이 같은 줄을
; 잡으면 첫 노출이 같은 세 글자가 된다 (README §7 ②의 자리).
; 여기서 잡는 것은 **없음이 값으로 놓이는** 세 자리다.

; `x = None` — 자리는 만들되 아직 아무것도 안 가리킨다.
((assignment
   left: (identifier) @pick.2
   "=" @pick.3
   right: (none) @pick.1 @hole) @site
 (#set! form "bound"))

; `def f(x=None)` — 파이썬에서 가장 흔한 기본값이다. 가변 기본값(`=[]`)을 피하는 관용구가
; 이 자리를 통째로 가져갔다 (`py-learning.md` §11.5 ① — 표본 202파일에 `=[]` 가 0곳이다).
((default_parameter
   name: (identifier) @pick.2
   "=" @pick.3
   value: (none) @pick.1 @hole) @site
 (#set! form "default"))

; `return None` — 안 적어도 가는 값을 적은 자리. 적힌 것과 안 적힌 것이 같은 값이다.
((return_statement
   "return" @pick.2
   (none) @pick.1 @hole) @site
 (#set! form "returned"))
