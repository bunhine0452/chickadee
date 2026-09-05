; `.length` 는 글자 수가 아니라 **UTF-16 코드 단위** 수다. 배열의 `.length` 와 노드가 같아
; (`ts/array-basics` 가 그 자리를 맡는다) 여기서는 **문자열임이 코드에 적힌 자리**만 잡는다.
((call_expression
   function: (member_expression
               object: (_) @pick.1
               property: (property_identifier) @pick.2)
   arguments: (arguments) @pick.3) @site
 (#match? @pick.2 "^(charCodeAt|codePointAt|charAt|normalize|localeCompare)$")
 (#set! form "unit"))

; 문자열 리터럴의 길이 — 무엇을 세고 있는지가 그 줄에서 그대로 보인다.
((member_expression
   object: [(string) (template_string)] @pick.1
   "." @pick.3
   property: (property_identifier) @pick.2) @site
 (#eq? @pick.2 "length")
 (#set! form "literal-length"))
