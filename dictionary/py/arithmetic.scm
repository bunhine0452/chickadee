((binary_operator
   left: (_) @pick.2
   operator: ["+" "-" "*" "/" "%" "//"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "arith"))
