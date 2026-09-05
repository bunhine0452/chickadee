; 코드에 붙인 표시. 실행되는 코드가 아니라 **읽히기를 기다리는 표시**라는 것이 요점이고,
; 그 「읽는 쪽」은 자바가 아니라 프레임워크다.
;
; 괄호가 있는 것과 없는 것이 **다른 노드**다(`annotation` · `marker_annotation`).
; `modifiers` 가 평평해서 표시와 `public`·`static` 이 형제로 들어가므로, 여기서는 표시 자체만
; 잡고 붙은 자리는 안 본다 — 형제 앵커(`.`)를 걸면 안 된다(03 §8 ①).
;
; 여는 기호는 따로 안 잡는다. 캡처 이름 규약(03 §3.2)이 그 글자를 캡처 이름의 시작으로 읽어
; `dictionary.rs` 의 `every_capture_name_is_one_the_pipeline_knows` 가 떨어진다.
; 대신 표시 전체를 `@pick.1` 로 잡아 「기호+이름」과 「이름」을 갈라 물을 수 있게 했다.
((marker_annotation
   name: (identifier) @pick.2) @site @pick.1
 (#set! form "marker"))

((annotation
   name: (identifier) @pick.2
   arguments: (annotation_argument_list) @pick.3) @site @pick.1
 (#set! form "with-args"))
