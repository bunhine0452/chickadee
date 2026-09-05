; 밖에 낼 것만 내보내기. **모든 것이 기본 비공개**다 — `pub` 이 없으면 옆 모듈에서도 못 부른다
; (E0603). 파일이 곧 모듈이지만 `mod` 로 등록 안 하면 컴파일 대상에 아예 안 든다.
; 구멍은 `pub` 이다(`pub(crate)` 는 글자가 달라 짚기만 한다).
((function_item
   (visibility_modifier) @pick.1 @hole
   "fn" @pick.3
   name: (identifier) @pick.2) @site
 (#set! form "pub-fn"))

((struct_item
   (visibility_modifier) @pick.1 @hole
   "struct" @pick.3
   name: (type_identifier) @pick.2) @site
 (#set! form "pub-struct"))

((field_declaration
   (visibility_modifier) @pick.1 @hole
   name: (field_identifier) @pick.2
   type: (_) @pick.3) @site
 (#set! form "pub-field"))

((mod_item
   "mod" @pick.1
   name: (identifier) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "mod-inline"))

((mod_item
   !body
   "mod" @pick.1
   name: (identifier) @pick.2
   ";" @pick.3) @site
 (#set! form "mod-file"))
