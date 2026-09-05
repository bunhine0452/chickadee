; `as` — 값은 그대로 두고 컴파일러의 입만 막는다. `!` 도 같은 층이라 함께 잡는다.
((as_expression (_) @pick.1 (_) @pick.2) @site
 (#set! form "as"))

((non_null_expression (_) @pick.3) @site
 (#set! form "non-null"))
