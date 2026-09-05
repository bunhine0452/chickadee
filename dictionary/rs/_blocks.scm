; 시스템 쿼리 — T1 필사 단위의 후보. 분절은 TS 가 한다 (04 §3.1).
;
; 자바의 `_blocks.scm` 은 `class`·`method` 둘인데 여기는 `impl`·`mod` 가 더 있다 —
; `docs/plan/rust-axis.md` §3.4: 시험의 88% 가 같은 파일의 `mod tests` 안에 살아서 그 경계를
; 블록으로 알아야 4·5단이 답안과 시험을 가른다. `#[derive]` 는 구현을 만들지만 `impl_item` 이
; 아니라 여기 안 잡힌다 (rs.md §8 ②).
((function_item name: (identifier) @block.name) @block.function
 (#set! form "fn"))

((impl_item type: (type_identifier) @block.name) @block.function
 (#set! form "impl"))

((impl_item type: (generic_type type: (type_identifier) @block.name)) @block.function
 (#set! form "impl"))

((struct_item name: (type_identifier) @block.name) @block.function
 (#set! form "struct"))

((enum_item name: (type_identifier) @block.name) @block.function
 (#set! form "enum"))

((trait_item name: (type_identifier) @block.name) @block.function
 (#set! form "trait"))

((mod_item name: (identifier) @block.name body: (declaration_list)) @block.function
 (#set! form "mod"))
