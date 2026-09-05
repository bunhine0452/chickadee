; 정해진 값들에 이름 붙이기. C 의 것과 달리 **정수로 안 변하고 이름이 갇혀 있다** —
; 그 둘을 만드는 것이 뒤에 붙은 낱말 하나다 (`cpp.md` §3 #23).
((enum_specifier
   "enum" @pick.2
   "class" @pick.1 @hole
   name: (type_identifier) @pick.3
   body: (enumerator_list)) @site
 (#set! form "enumclass"))

; **값을 쓰는 자리는 안 잡는다.** `Color::Red` 를 잡으려면 「대문자로 시작하는 통 이름」밖에
; 걸 것이 없는데, 표본 두 리포에서 그 패턴의 20곳을 눈으로 보니 **19곳이 클래스의 정적
; 멤버**(`UnitTest::GetInstance` · `FilePath::MakeFileName`)였다 — 844곳/35파일이 거의 전부
; 오탐이다. 정적으로는 통 이름이 열거 타입인지 클래스인지 못 가른다 (README §6 #13 과 같은 자리).
