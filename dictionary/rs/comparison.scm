; 두 값 견주기. 구멍은 견주는 기호이고, 양쪽 **타입이 같아야** 견준다는 것(`1i32 == 1u8` 은
; E0308)이 다른 언어와 다른 자리다. `<` 는 `Vec<T>` 의 `<` 와 같은 글자인데 tree-sitter-rust 가
; `binary_expression` 과 `generic_type` 을 따로 내서 안 섞인다 (rs.md §8 ④ · 실측 76 대 4,771).
((binary_expression
   left: (_) @pick.2
   operator: ["==" "!=" "<" ">" "<=" ">="] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "compare"))
