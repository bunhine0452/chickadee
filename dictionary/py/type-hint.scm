; **적어도 실행 시에는 검사하지 않는다.** 그런데 pydantic·FastAPI 는 이 힌트를 읽어서 진짜로
; 검사한다 — 같은 문법이 어떤 파일에서는 주석이고 어떤 파일에서는 동작이다. 그 갈림이
; 이 개념의 전부이고, 바이브 코딩으로 나온 파이썬에서 가장 많이 보이는 문법이기도 하다.
;
; `.pyi` 스텁은 몸통이 전부 `...` 라 이 개념의 사용처가 그쪽으로 몰릴 수 있다 (`py.md` §8 ⑤).
; 확장자 목록을 좁히는 것은 이 사전의 몫이 아니라 `_lang.yaml` 의 결정이라 여기서는 안 건드린다.

; `def f(item_id: int)` — 매개변수의 종류.
((typed_parameter
   . (identifier) @pick.2
   ":" @pick.1 @hole
   type: (type) @pick.3) @site
 (#set! form "param"))

; `def f(limit: int = 10)` — 기본값이 붙어도 노드만 다르고 규칙은 같다.
((typed_default_parameter
   name: (identifier) @pick.2
   ":" @pick.1 @hole
   type: (type) @pick.3) @site
 (#set! form "param-default"))

; `-> Item` — 돌려줄 것의 종류. 안 적어도 돌아가는 값은 같다.
((function_definition
   name: (identifier) @pick.2
   "->" @pick.1 @hole
   return_type: (type) @pick.3) @site
 (#set! form "return"))

; `name: str` — 클래스 몸통의 이 한 줄이 pydantic 에서는 **검사와 변환**이 된다.
((assignment
   left: (identifier) @pick.2
   ":" @pick.1 @hole
   type: (type) @pick.3) @site
 (#set! form "field"))
