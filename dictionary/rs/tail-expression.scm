; 마지막 식이 답이다. 블록의 마지막 명명 자식이 **문(statement)이 아니면** 그것이 블록의 값이다 —
; 세미콜론을 붙이면 `expression_statement` 가 되어 값이 `()` 로 바뀐다(E0308).
;
; 식의 종류를 열거한 이유: tree-sitter 쿼리에 「문이 아닌 것」이 없다. `if`·`match`·`loop` 는
; 뺐다 — 세미콜론 없이 문 자리에도 서서(`_expression_ending_with_block`) 값인지 문인지가
; 트리만으로 안 갈린다. 실측 2,221곳의 대다수는 이름·호출·셈이다 (rust-axis §2.1 #8).
; 빈칸은 안 낸다 — 구멍이 「없는 세미콜론」이라 뚫을 글자가 없다. yaml 의 `no_hole_reason`.
; `@site` 는 블록이 아니라 **꼬리식 자체**다 — 블록을 자리로 잡으면 함수 몸통 전체가 창이 된다.
; 여닫는 중괄호는 짚을 자리로만 낸다.
((block
   "{" @pick.3
   [(identifier) (call_expression) (binary_expression) (struct_expression) (field_expression)
    (macro_invocation) (tuple_expression) (string_literal) (integer_literal) (boolean_literal)
    (scoped_identifier) (reference_expression) (try_expression) (await_expression)
    (array_expression) (index_expression) (parenthesized_expression) (unary_expression)
    (float_literal) (unit_expression) (self) (generic_function)] @site @pick.1
   . "}" @pick.2)
 (#set! form "tail"))
