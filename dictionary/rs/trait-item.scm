; 할 수 있는 일로 묶기. 타입이 아니라 **행동**으로 경계를 긋기 시작하는 자리. 이 리포는
; `trait` 선언이 네 리포 합쳐 9개라 합성이 정본이다 (rust-axis §2.1). 구멍은 `trait`.
((trait_item
   "trait" @pick.1 @hole
   name: (type_identifier) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "trait"))

; 몸통 없는 서명 — 구현하는 쪽이 채워야 하는 약속.
((function_signature_item
   "fn" @pick.1
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3) @site
 (#set! form "required-method"))

; `dyn Trait` — 어느 타입인지 실행 시에 정해지는 자리(`cs/dynamic-dispatch`).
((dynamic_type
   "dyn" @pick.1
   trait: (_) @pick.2) @site
 (#set! form "dyn"))
