; 두 표를 짝지어 붙이기. 붙이는 낱말이 **첫 자식**일 때만 잡는다(`.` 앵커) —
; 앞에 `LEFT` 가 붙은 판은 `sql/join-left` 의 것이고 규칙이 다르다.
((from
   (relation (object_reference (identifier) @pick.2))
   (join
     . (keyword_join) @pick.1 @hole
     (relation (object_reference (identifier) @pick.3))
     (keyword_on) @pick.4)) @site
 (#set! form "join"))
