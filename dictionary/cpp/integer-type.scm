; 정수의 폭과 부호. 요점은 값이 아니라 **칸 수를 누가 정하나**다 — 규격이 보장하는 것은
; `sizeof(char) == 1` 뿐이고 나머지는 구현이 정한다 (`cpp.md` §0.1 #3).
;
; 글자(`char`)는 여기 안 든다. 그 자리는 `cpp/char-and-byte` 가 진다.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1 "int" "long" "short")
 (#set! form "intdecl"))

; 부호·폭을 낱말로 적은 것 — `unsigned int` · `long long`.
((declaration
   type: (sized_type_specifier) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "sized"))

; 폭을 이름에 못 박은 것 — `<cstdint>`. 폭이 중요하면 이렇게 적는 것이 정답이다.
; tree-sitter-cpp 0.23.4 는 `int64_t`·`size_t` 를 `type_identifier` 가 아니라 **`primitive_type`** 으로
; 읽는다(2026-09-06 실측 — 첫 판이 `type_identifier` 만 걸어 골든이 0곳이었다). 둘 다 건다.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1
   "int8_t" "int16_t" "int32_t" "int64_t"
   "uint8_t" "uint16_t" "uint32_t" "uint64_t" "size_t")
 (#set! form "fixed"))

((declaration
   type: (type_identifier) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1
   "int8_t" "int16_t" "int32_t" "int64_t"
   "uint8_t" "uint16_t" "uint32_t" "uint64_t" "size_t")
 (#set! form "fixed"))

; 매개변수 자리 — 부르는 쪽이 어떤 폭을 주는지가 여기서 정해진다.
((parameter_declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#any-of? @pick.1 "int" "long" "short")
 (#set! form "intparam"))
