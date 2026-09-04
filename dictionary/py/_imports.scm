((import_from_statement
   module_name: (_) @import.source)
 (#set! form "from"))

((import_statement
   name: (dotted_name) @import.source)
 (#set! form "static"))

((import_statement
   name: (aliased_import (dotted_name) @import.source))
 (#set! form "static"))
