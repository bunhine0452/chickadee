((if_statement
   "if" @pick.1 @hole
   condition: (_) @pick.2
   consequence: (block) @pick.3
   alternative: (_)? @pick.4) @site
 (#set! form "if"))
