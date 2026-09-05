; 새 리스트를 만들지 않고 **같은 것**을 고친다. 그 리스트를 가리키던 다른 이름에서도 바뀌고,
; 돌려주는 것은 `None` 이라 `xs = xs.append(v)` 는 리스트를 지운다.
;
; 이 개념이 `py/reference-binding` 의 짝이다 — 별칭은 **가변 객체가 있어야 관찰되고**,
; 파이썬에서 학습자가 만나는 첫 가변 객체가 리스트다 (`py-learning.md` §11.2 ③).
;
; 이름으로 거른다(`#match?`). `pop`·`sort` 는 사전·집합에도 있어 「목록을 고친다」가 그 줄에서
; 참인지 카드가 못 가리므로 뺐다 — `py/text-length` 가 `len(` 을 뺀 것과 같은 자리다.

; `xs.append(v)` — 한 칸 늘어난다.
((call
   function: (attribute
               object: (_) @pick.2
               attribute: (identifier) @pick.1 @hole)
   arguments: (argument_list "(" @pick.3 . (_))) @site
 (#eq? @pick.1 "append")
 (#set! form "append"))

; `xs.extend(ys)` · `xs.insert(0, v)` — 같은 상자를 고치는 나머지 둘.
((call
   function: (attribute
               object: (_) @pick.2
               attribute: (identifier) @pick.1 @hole)
   arguments: (argument_list "(" @pick.3 . (_))) @site
 (#match? @pick.1 "^(extend|insert)$")
 (#set! form "grow"))
