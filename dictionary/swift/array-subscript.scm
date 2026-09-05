; 번호나 열쇠로 꺼내기. 트리에서 첨자는 호출과 같은 노드(`call_expression`)라 여는 괄호의
; **글자**로 가른다 — `[` 면 첨자, `(` 면 호출이다 (swift.md §8).
((call_expression
   (_) @pick.2
   (call_suffix (value_arguments "[" @pick.3 (value_argument value: (_) @pick.1)))) @site
 (#set! form "subscript"))
