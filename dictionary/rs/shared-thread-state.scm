; 스레드끼리 나눠 갖기. AI 가 스레드를 쓰면 거의 반드시 나오는 두 겹 `Arc<Mutex<T>>` —
; `Arc` 가 주인을 여럿으로, `Mutex` 가 고치는 쪽을 한 번에 하나로. 구멍은 `Arc`.
((generic_type
   type: (type_identifier) @pick.1 @hole
   type_arguments: (type_arguments "<" @pick.3 . (_) @pick.2)) @site
 (#any-of? @pick.1 "Arc" "Mutex" "RwLock")
 (#set! form "shared-type"))

((call_expression
   function: (scoped_identifier
     path: (identifier) @pick.1 @hole
     name: (identifier) @pick.2)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "Arc" "Mutex" "RwLock")
 (#eq? @pick.2 "new")
 (#set! form "shared-new"))

; `.lock()` — 잠그는 자리. 돌려받는 것은 값이 아니라 **보호자(guard)** 이고 그것이 사라질 때 풀린다.
((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "lock")
 (#set! form "lock"))

((call_expression
   function: (scoped_identifier
     path: (identifier) @pick.2
     name: (identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#eq? @pick.1 "spawn")
 (#set! form "spawn"))
