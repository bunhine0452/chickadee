; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; **데코레이터가 붙으면 `decorated_definition` 을 잡는다.** `function_definition` 만 잡으면
; 블록이 `def` 줄에서 시작해 `@app.get("/x")` 가 창 밖으로 잘린다 — FastAPI·Flask 코드에서는
; 그 줄이 함수가 무엇인지 말하는 유일한 줄이다 (D156 조사).
;
; 데코레이터가 붙은 정의는 아래 넷 중 **둘**에 걸린다(안쪽 하나 + 바깥 하나). tree-sitter 쿼리에
; 「부모가 X 가 아닌 것」이 없어서 여기서 못 거른다 — `derive.ts` 가 「끝과 이름이 같으면
; 바깥을 남긴다」로 접는다.
((function_definition name: (identifier) @block.name) @block.function
 (#set! form "def"))

((class_definition name: (identifier) @block.name) @block.function
 (#set! form "class"))

((decorated_definition
   definition: (function_definition name: (identifier) @block.name)) @block.function
 (#set! form "def"))

((decorated_definition
   definition: (class_definition name: (identifier) @block.name)) @block.function
 (#set! form "class"))
