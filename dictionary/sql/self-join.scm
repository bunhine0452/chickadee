; 같은 표를 두 번 적기. 두 별칭이 같은 표를 가리킬 때만 잡힌다 —
; `#eq?` 가 그 「같음」이고, 그것이 이 개념의 전부다.
((from
   (relation (object_reference (identifier) @pick.2) (identifier) @pick.3)
   (join
     (keyword_join) @pick.1 @hole
     (relation (object_reference (identifier) @ctx.other) (identifier) @pick.4))) @site
 (#eq? @pick.2 @ctx.other)
 (#set! form "self-join"))
