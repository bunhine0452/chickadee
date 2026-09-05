; 타입은 값이 아니라 열에 붙는다. 표를 만드는 자리에서만 타입이 글자로 보인다 —
; 값을 넣는 자리에는 타입이 안 적힌다.
((create_table
   (object_reference (identifier) @pick.3)
   (column_definitions
     (column_definition (identifier) @pick.2 . (_) @pick.1))) @site
 (#set! form "column-type"))
