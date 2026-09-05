; 여럿 중 하나 — `'idle' | 'loading'`. 왼쪽으로 접히므로 셋 이상이면 `union_type` 이 겹친다.
; 여기서 잡는 것은 가장 바깥 한 겹이고, 그 첫 갈래와 둘째 갈래를 짚는다.
((type_annotation
   (union_type . (_) @pick.1 (_) @pick.2)) @site
 (#set! form "annotation"))

((type_alias_declaration
   name: (_) @pick.3
   value: (union_type . (_) @pick.1 (_) @pick.2)) @site
 (#set! form "alias"))
