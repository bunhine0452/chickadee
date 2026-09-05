; 같은 대괄호가 **자리로도 키로도** 꺼낸다. 무엇을 꺼내는지는 왼쪽이 정하고, 없으면
; `IndexError`/`KeyError` 로 멈춘다. 음수는 뒤에서 센다 — `xs[-1]` 이 마지막이다.
;
; **타입 힌트를 피해야 한다.** `list[int]`·`Dict[str, int]` 는 `xs[0]` 과 **같은 `subscript`
; 노드**다 (`py.md` §8 ②). tree-sitter 는 타입 자리를 따로 안 알려 주므로 대괄호 안의 종류로
; 가른다 — 숫자·글자·음수만 받고 **이름은 안 받는다.** `d[key]` 를 잃는 대신 `list[int]` 가
; 전부 빠진다. `py/arithmetic` 이 `pathlib` 의 `/` 에서 쓴 것과 같은 방법(부정이 아니라 열거)이다.

; `xs[0]` — 자리로 꺼낸다. 첫 자리가 0 이다.
((subscript
   value: (_) @pick.2
   "[" @pick.1 @hole
   subscript: (integer) @pick.3) @site
 (#set! form "index"))

; `xs[-1]` — 음수는 뒤에서 센다. 길이를 안 구해도 마지막이 잡힌다.
((subscript
   value: (_) @pick.2
   "[" @pick.1 @hole
   subscript: (unary_operator "-" (integer)) @pick.3) @site
 (#set! form "back"))

; `d["name"]` — 같은 대괄호가 키로 꺼낸다. 왼쪽이 사전이면 자리가 아니라 키다.
((subscript
   value: (_) @pick.2
   "[" @pick.1 @hole
   subscript: (string) @pick.3) @site
 (#set! form "key"))
