; 이름은 값을 **담지 않고 가리킨다.** `b = a` 로 리스트를 복사했다고 믿으면 `b.append(1)` 뒤
; `a` 도 늘어난다 — 파이썬 명세가 대입을 "(re)bind names to values" 로 적은 자리다.
;
; **0부가 아니라 1부다** (`py-learning.md` §11.6 ① · D187 ⑰). 별칭은 **가변 객체가 있어야
; 관찰된다** — `a = 1; b = a; b = 2` 로는 아무 일도 안 일어난다. 그래서 이 개념의 선행은
; `py/list-literal` 이고, 그 앞에 두면 관찰할 수 없는 사실을 말로만 전하게 된다.

; `b = a` — 오른쪽이 이름 하나인 대입. 여기서 화살표가 하나 더 생긴다.
((assignment
   left: (identifier) @pick.2
   "=" @pick.1
   right: (identifier) @pick.3) @site
 (#set! form "alias"))

; `b = self.agents` — 안에 있던 것을 꺼내 담아도 상자는 그대로 하나다.
;
; `(subscript)` 를 안 넣는다: `line[2:]` 같은 자름은 **새 객체**를 만들어서 같은 노드 종류인데
; 별칭이 아니다. 그 자리에서 카드가 나오면 「같은 것을 둘이 가리킨다」가 거짓이 된다.
((assignment
   left: (identifier) @pick.2
   "=" @pick.1
   right: (attribute) @pick.3) @site
 (#set! form "alias-part"))
