# 문법 사전

개념 하나가 파일 두 장이다 — `<concept>.yaml`(설명 3층 · 선행 · 오답 진단)과 `<concept>.scm`(tree-sitter 쿼리).
언어마다 `_lang.yaml`(version · grammars · extensions)과 시스템 쿼리 `_imports.scm` · `_blocks.scm` 이 붙는다.

```
dictionary/<lang>/_lang.yaml
dictionary/<lang>/<concept>.yaml + <concept>.scm
dictionary/<lang>/_imports.scm · _blocks.scm
dictionary/schema/concept.schema.json
```

`lang` 은 사전 네임스페이스(`ts·py·go·rs·swift·dart·sql·common·react·arch`)이고
`grammar` 는 tree-sitter 키(`typescript·tsx·javascript·python·go·rust·swift·dart·sql`)다 — 둘은 다르다(D19).

**Rust 는 이 폴더의 YAML 을 읽지 않는다**(D40). `dict_read{lang}` 이 원문을 그대로 넘기고 파싱·검증은 TS 가 한다.
앱 번들 리소스로 들어가며 `app_data_dir/dict-user/<lang>/` 이 번들보다 우선한다.

내용은 M1 에서 채운다 — `m1-03-dict-ts-v1`(바닥 개념 10 + 개념 11), `m1-03-dict-lint`(JSON Schema·`pnpm dict:lint`).
지금은 번들 리소스 경로가 성립하도록 폴더만 있다.
