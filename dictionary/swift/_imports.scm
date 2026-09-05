; 시스템 쿼리 — 이 파일이 내놓는 「지정자」. 해석은 TS 가 한다 (D18).
;
; Swift 의 `import` 는 **파일이 아니라 모듈**이다 — `import SwiftUI` 는 어느 파일도 안 가리킨다.
; 그래서 `resolve-imports.ts` 의 `resolveOne` 이 swift 에서 `null` 을 돌려주고 **파일 간선이
; 하나도 안 선다**(04 §7.1 · `resolve-imports.ts:163`). 그래도 이 쿼리가 필요한 이유 둘 —
; ① `load.ts` 의 `systemIds` 가 문법마다 `_imports`·`_blocks` 둘을 요구한다(없으면 린트의
;    `system-query` 가 오류다)
; ② `import_edge` 행이 서면 프레임워크 감지의 재료가 된다. `swift.md` §1 이 `detect` 를
;    `{ module: 'SwiftUI' }` 로 넓히자고 제안한 자리이고, 그 신호를 만드는 것이 이 한 줄이다.
;
; `import SwiftUI` 는 `(import_declaration (identifier (simple_identifier)))` 이고
; `import struct Foo.Bar` 처럼 종류를 적는 꼴도 같은 `identifier` 를 가진다.
((import_declaration (identifier) @import.source)
 (#set! form "static"))
