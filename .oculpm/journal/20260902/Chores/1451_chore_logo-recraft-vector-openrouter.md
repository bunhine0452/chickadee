---
schema_version: 1
type: chore
slug: "logo-recraft-vector-openrouter"
status: done
difficulty: low
created_at: "2026-09-02T14:51:24+09:00"
session_id: "20260902-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/logo/README.md"
    op: update
  - path: "design/logo/contact-sheet.png"
    op: update
  - path: "design/logo/verify.json"
    op: update
  - path: "design/logo/recraft-v4-vector-1.svg"
    op: create
  - path: "design/logo/recraft-v4-vector-2.svg"
    op: create
  - path: "design/logo/recraft-v4-vector-3.svg"
    op: create
  - path: "design/logo/recraft-v41-vector-1.svg"
    op: create
  - path: "design/logo/recraft-v41-vector-2.svg"
    op: create
  - path: "design/logo/recraft-v41-vector-3.svg"
    op: create
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Chores/1438_chore_logo-svg-openrouter-candidates.md"
    kind: "followup"
tags:
  - "design"
  - "logo"
  - "openrouter"
  - "recraft"
  - "svg"
  - "mcp-tool"
---
[x] Recraft 벡터로 로고 후보 6장 추가

## 작업
- 처음엔 `GET /api/v1/models`(420개)에 Recraft 가 없어 「OpenRouter 에 없다」고 잘못 판단했고 사용자가 프로바이더 페이지로 정정. 실제로는 **별도 이미지 API** 에 있다: 목록 `GET /api/v1/images/models`(48개), 생성 `POST /api/v1/images`. 문서(`openrouter.ai/docs/api/api-reference/images/generate-an-image.md`)로 요청·응답 형식 확인.
- `recraft/recraft-v4-vector`, `recraft/recraft-v4.1-vector` 에 §6 프롬프트로 각 3장(`aspect_ratio:1:1`, `output_format:svg`, `provider.options.recraft` 에 `style:vector_illustration` + `controls.colors/background_color` 통과 — 둘 다 수락). 응답 `data[].b64_json` 을 디코드해 `design/logo/recraft-*.svg` 저장. 6장 $0.48.
- 기존 검증 스크립트(Playwright, 16/24px 열 단위 3단 판정)로 재검사, 대조 시트 15종으로 갱신.

## 결과
- 16px 통과: `recraft-v41-vector-3` 만(뺨 2px). `v4-1`·`v4-2`·`v41-2` 는 24px 통과. 나머지 2장 탈락.
- 산출물은 2048² viewBox 에 경로 200~2150개 트레이스 벡터. 팔레트 제어는 근사치 — 파일당 11~24색, `v41-1`·`v41-3` 에 그라디언트 포함. `v41-2` 는 몸통이 진홍(브리프 이탈).
- 종합 15종 중 16px 통과 5: gemini-b, opus-b, gpt-b, gemini-a, recraft-v41-3.

## 검증
- `design/logo/verify.json` 갱신, 대조 시트를 사용자에게 전송.

## 메모
- 교훈: OpenRouter 에서 프로바이더 존재 여부는 이미지 API 목록까지 봐야 한다.