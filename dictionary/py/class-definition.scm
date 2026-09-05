; **수신자를 매개변수로 직접 적는다**(`def m(self)`). 부를 때는 안 넘긴다. 속성을 미리
; 적어 두는 자리가 없어서 `self.x = …` 가 도는 순간 속성이 처음 생긴다.
;
; `superclasses` 를 선택 캡처로 둔다. 패턴을 둘로 나누면 `class Item(BaseModel):` 이 사용처
; 둘이 되어 카드가 두 장 난다.
;
; `self` 매개변수를 따로 잡는 이유: 「부를 때 안 넘기는데 왜 적혀 있나」가 이 개념에서
; 가장 자주 막히는 자리이고, 그 물음은 `class` 줄이 아니라 `def` 줄에서만 보인다.

; `class Item(BaseModel):` · `class Store:`
((class_definition
   "class" @pick.1 @hole
   name: (identifier) @pick.2
   superclasses: (argument_list)? @pick.3
   body: (block) @pick.4) @site
 (#set! form "class"))

; `def method(self, …)` — 수신자가 매개변수 목록의 **첫 자리**에 적혀 있다.
((function_definition
   name: (identifier) @pick.2
   parameters: (parameters . (identifier) @pick.1)
   body: (block) @pick.3) @site
 (#eq? @pick.1 "self")
 (#set! form "self"))
