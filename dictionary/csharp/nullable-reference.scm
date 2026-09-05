; 없을 수 있다고 적어 두기. `string` 과 `string?` 는 **런타임에 같은 타입**이고, 물음표는
; 컴파일러에게 하는 말이라 경고만 낸다.
;
; 물음표만 따로 못 잡는다 — `nullable_type` 의 `?` 는 쿼리에 노출되는 토큰이 아니다.
; 그래서 타입 전체를 짚고, 빈칸은 안 낸다(yaml 의 `no_hole_reason`).
((parameter
   type: (nullable_type) @pick.1
   name: (identifier) @pick.2) @site
 (#set! form "param"))

((local_declaration_statement
   (variable_declaration
     type: (nullable_type) @pick.1
     (variable_declarator
       name: (identifier) @pick.2
       (_) @pick.3))) @site
 (#set! form "local"))

((property_declaration
   type: (nullable_type) @pick.1
   name: (identifier) @pick.2
   accessors: (accessor_list) @pick.3) @site
 (#set! form "property"))

((field_declaration
   (variable_declaration
     type: (nullable_type) @pick.1
     (variable_declarator name: (identifier) @pick.2))) @site
 (#set! form "field"))
