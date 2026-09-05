; 정수의 폭과 부호. 요점은 값이 아니라 **칸 수**인데, C 는 그 수를 규격이 최소만 약속한다 —
; `int` 는 16비트 이상일 뿐이다. 폭이 이름에 적힌 `<stdint.h>` 타입도 같은 판이다.
; 실수(`float`·`double`)와 `void` 는 여기 안 든다.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#any-of? @pick.1
   "int" "char" "long" "short" "size_t" "ssize_t" "intptr_t" "uintptr_t"
   "int8_t" "int16_t" "int32_t" "int64_t" "uint8_t" "uint16_t" "uint32_t" "uint64_t")
 (#set! form "named"))

; `unsigned` · `long long` · `unsigned char` 처럼 낱말 여럿이 폭·부호를 적는 자리.
((declaration
   type: (sized_type_specifier) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "sized"))

((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#any-of? @pick.1
   "int" "char" "long" "short" "size_t" "ssize_t" "intptr_t" "uintptr_t"
   "int8_t" "int16_t" "int32_t" "int64_t" "uint8_t" "uint16_t" "uint32_t" "uint64_t")
 (#set! form "named-bare"))

((declaration
   type: (sized_type_specifier) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#set! form "sized-bare"))

; 매개변수의 정수 타입. `int main(int argc, …)` 의 첫 칸이다.
((parameter_declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#any-of? @pick.1
   "int" "char" "long" "short" "size_t" "ssize_t" "intptr_t" "uintptr_t"
   "int8_t" "int16_t" "int32_t" "int64_t" "uint8_t" "uint16_t" "uint32_t" "uint64_t")
 (#set! form "param"))

((parameter_declaration
   type: (sized_type_specifier) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#set! form "param-sized"))
