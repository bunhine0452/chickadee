; 시스템 쿼리 — MyBatis 매퍼가 가리키는 **자바 클래스 이름** (D159).
;
; 매퍼는 XML 이지만 그 안의 속성값이 곧 자바 패키지 경로다:
;   <mapper namespace="com.ssafy.app.model.dao.UserDao">      ← 이 SQL 을 쓰는 DAO
;   <resultMap type="com.ssafy.app.model.entity.User">         ← 한 줄이 되는 타입
;   <select parameterType="…" resultType="…">
; 그래서 해석은 자바와 **같은 규칙**을 쓴다(`resolveJava` 의 접미 일치) — 매퍼 전용 해석기가 없다.
;
; 값에 점이 없는 것(`string`·`long`·`UserResultMap` 같은 별칭·id)은 자바 파일로 안 풀려
; 자연히 간선이 안 선다. 그래서 이름으로 거르지 않고 **전부 내보낸다** — 거르는 자리를
; 하나로 모으는 편이 규칙이 하나 더 늘어나는 것보다 낫다.
; `namespace` 만 form 이 다르다. 나머지는 매퍼가 그 타입을 **쓴다**(자연스러운 방향)이지만,
; `namespace` 는 「이 파일이 저 인터페이스의 **실체**다」라는 말이라 의존이 반대다 — DAO 를 열면
; 그 SQL 이 여기 있다. TS 가 이 form 만 뒤집는다 (`resolve-imports.ts`).
((element (STag (Attribute (Name) @ctx.att (AttValue) @import.source)))
 (#eq? @ctx.att "namespace")
 (#set! form "mapper-of"))

((element (STag (Attribute (Name) @ctx.att (AttValue) @import.source)))
 (#any-of? @ctx.att "type" "resultType" "parameterType" "ofType" "javaType")
 (#set! form "static"))

; ── 열 ↔ 필드 (D169) ─────────────────────────────────────────────────
; `<resultMap type="…entity.User">` 안의 `<id property="userId" column="user_id"/>` 가
; 표의 열과 자바 필드를 잇는 유일한 자리다. 열 이름이 지정자, 필드와 엔티티는 맥락이다.
; 표 이름은 여기 없다 — 같은 매퍼의 SQL 이 읽는 표(`reads-table`)나 열 이름의 유일성으로
; TS(`schema.ts`)가 붙인다.
((element
   (STag (Name) @ctx.tag (Attribute (Name) @ctx.tk (AttValue) @ctx.type))
   (content (element
     (EmptyElemTag (Name) @ctx.row
       (Attribute (Name) @ctx.pk (AttValue) @ctx.property)
       (Attribute (Name) @ctx.ck (AttValue) @import.source)))))
 (#eq? @ctx.tag "resultMap") (#eq? @ctx.tk "type")
 (#any-of? @ctx.row "id" "result")
 (#eq? @ctx.pk "property") (#eq? @ctx.ck "column")
 (#set! form "column-of"))
