; 적지 않고 만족하기. `implements` 가 어디에도 없으므로 **선언 쪽**만 코드에 보인다 —
; 어떤 타입이 이 인터페이스를 만족하는지는 파일을 봐서 알 수 없다는 것이 판의 요점이고,
; 쿼리가 한쪽만 잡는다는 사실 자체가 그 근거다.
((type_declaration
   (type_spec
     name: (type_identifier) @pick.2
     type: (interface_type "interface" @pick.1 @hole) @pick.3)) @site
 (#set! form "decl"))
