; 모양에 이름 붙이기 — 같은 일을 하는 낱말이 둘이라 둘 다 잡는다.
; 본문의 첫 줄만 짚는다(`.` 앵커) — 안 그러면 필드 수만큼 사용처가 부풀어 오른다.
((interface_declaration
   name: (_) @pick.1
   body: (interface_body . (property_signature
     name: (_) @pick.2
     type: (type_annotation (_) @pick.3)))) @site
 (#set! form "interface"))

((type_alias_declaration
   name: (_) @pick.1
   value: (object_type . (property_signature
     name: (_) @pick.2
     type: (type_annotation (_) @pick.3)))) @site
 (#set! form "alias"))
