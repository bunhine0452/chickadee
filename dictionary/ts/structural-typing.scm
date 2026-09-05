; 이름 말고 모양이 맞으면 들어간다. 「이름이 다른데 들어갔다」는 두 선언을 비교해야 보이므로
; 쿼리로는 못 본다 — 대신 **모양으로 맞춰 넣는 자리** 둘을 잡는다.
((variable_declarator
   name: (_) @pick.1
   type: (type_annotation (type_identifier) @pick.2)
   value: (object) @pick.3) @site
 (#set! form "shape-fits"))

; 이름 없는 모양을 그 자리에 바로 적은 꼴 — 이름이 아예 없으니 맞는 기준은 모양뿐이다.
((required_parameter
   pattern: (_) @pick.1
   type: (type_annotation (object_type) @pick.2)) @site
 (#set! form "inline-shape"))
