; 이어 붙여 바꾸기. 어댑터는 **아무것도 안 한다** — 소비자(`collect`·`for`·`sum`)가 오기 전엔
; 한 항목도 안 흐른다. 구멍은 `collect`.
((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1 @hole)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "collect")
 (#set! form "collect"))

; `collect::<Vec<_>>()` — 터보피시. 함수 자리가 `generic_function` 이라 노드가 다르다 (rs.md §8 ④).
((generic_function
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1 @hole)
   type_arguments: (type_arguments) @pick.3) @site
 (#eq? @pick.1 "collect")
 (#set! form "collect-turbofish"))

((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "map" "filter" "filter_map" "flat_map" "enumerate" "zip" "take" "skip" "rev"
   "chain" "cloned" "copied" "iter" "into_iter" "iter_mut" "peekable" "take_while" "skip_while" "inspect")
 (#set! form "adapter"))

((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "sum" "count" "fold" "any" "all" "find" "position" "max" "min" "last" "for_each" "next")
 (#set! form "consume"))
