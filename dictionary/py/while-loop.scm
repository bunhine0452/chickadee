((while_statement
   "while" @pick.1 @hole
   condition: (_) @pick.2
   body: (block) @pick.3) @site
 (#set! form "while"))
