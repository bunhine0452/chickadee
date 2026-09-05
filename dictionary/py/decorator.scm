; `@deco` 한 줄이 `f = deco(f)` 와 같고 **정의 시점에 실행된다.** `py/function-definition` 의
; 규칙(「정의한 자리에서는 돌지 않는다」)이 깨지는 유일한 자리가 여기다 (`py.md` §2 ⓓ).
;
; 웹 라우트가 붙는 자리라 바이브 코딩으로 나온 파이썬에서 **가장 먼저 보이는 심화 문법**이다.
; `_blocks.scm` 이 `decorated_definition` 을 잡는 이유도 그것이다 — 이 한 줄이 잘리면
; 함수가 무엇인지 말하는 줄이 화면에서 사라진다.

; `@app.get("/items")` — 부른 결과가 감싸는 것이 된다. 괄호 안이 그 자리에서 계산된다.
((decorator
   "@" @pick.1 @hole
   (call
     function: (_) @pick.2
     arguments: (argument_list) @pick.3)) @site
 (#set! form "call"))

; `@staticmethod` · `@property` — 괄호가 없으면 이름이 가리키는 함수가 그대로 감싸는 것이 된다.
((decorator
   "@" @pick.1 @hole
   [(identifier) (attribute)] @pick.2) @site
 (#set! form "plain"))
