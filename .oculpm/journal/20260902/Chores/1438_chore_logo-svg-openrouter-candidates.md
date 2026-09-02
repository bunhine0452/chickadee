---
schema_version: 1
type: chore
slug: "logo-svg-openrouter-candidates"
status: done
difficulty: medium
created_at: "2026-09-02T14:38:33+09:00"
session_id: "20260902-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/logo/README.md"
    op: create
  - path: "design/logo/contact-sheet.png"
    op: create
  - path: "design/logo/verify.json"
    op: create
  - path: "design/logo/claude-opus-5-a.svg"
    op: create
  - path: "design/logo/claude-opus-5-b.svg"
    op: create
  - path: "design/logo/claude-opus-5-c.svg"
    op: create
  - path: "design/logo/gemini-31-pro-a.svg"
    op: create
  - path: "design/logo/gemini-31-pro-b.svg"
    op: create
  - path: "design/logo/gemini-31-pro-c.svg"
    op: create
  - path: "design/logo/gpt-55-a.svg"
    op: create
  - path: "design/logo/gpt-55-b.svg"
    op: create
  - path: "design/logo/gpt-55-c.svg"
    op: create
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Features_to_add/1421_feature_ink-home-riso-chickadee.md"
    kind: "followup"
tags:
  - "design"
  - "logo"
  - "openrouter"
  - "svg"
  - "chickadee"
  - "mcp-tool"
---
[x] 리소 박새 로고 후보 — OpenRouter 텍스트 모델 SVG 생성 + 16px 검증

## 작업
- 사용자 메모(「svg 를 주는 모델로」)에 따라 이미지 모델 대신 **SVG 코드를 쓰는 텍스트 모델**을 썼다: `anthropic/claude-opus-5`, `openai/gpt-5.5`, `google/gemini-3.1-pro-preview`. 모델 id 는 호출 전 `/api/v1/models` 로 재확인.
- 브리프: NEXT-SESSION-PROMPT §6 의 리소 박새 프롬프트를 SVG 제약으로 변환 — 3도 인쇄(먹·청 하프톤 `<pattern>`·형광진홍 2~3유닛 어긋남), 종이 녹아웃(뺨·배), 그라디언트·필터·텍스트 금지, 지정 5색만, 16px 에서 캡–뺨–턱받이 3단 유지.
- 1차(모델당 1호출·3변형·`max_tokens` 6000)는 추론 토큰이 출력 예산을 삼켜 Opus 는 빈 응답, Gemini 는 587바이트에서 절단, GPT 만 2/3. 2차는 변형당 1호출(9호출 병렬)·`reasoning.effort=low`·14000 토큰으로 9/9 성공, `finish=stop`.
- 검증: Playwright Chromium 에서 각 SVG 를 16/24/32px 캔버스로 래스터화, 열 단위로 먹→종이→먹 3단이 나오는 열 수·흰 띠 높이를 센다(경로 홈의 `__audit.dee` 와 동일 판정). 대조 시트 `design/logo/contact-sheet.png`.

## 결과
- 16px 통과 4/9: `claude-opus-5-b`(머리, 뺨 4px) · `gemini-31-pro-a`(전신 중 유일, 뺨 2px) · `gemini-31-pro-b`(머리, 뺨 6px, 가장 강한 그래픽) · `gpt-55-b`(머리, 뺨 2px). 24px 통과 8/9(`gpt-55-c` 탈락).
- 팔레트 준수 9/9, 금지 요소 0 (gemini-a 다리 stroke 1개만).
- `gemini-31-pro-c` 는 가지에 거꾸로 매달린 박새 — Dee 의 「모르겠어요 = 거꾸로 매달리기」 은유와 맞물려 큰 크기용으로 유효.
- 비용 합계 약 $0.8 (실패한 1차 $0.41 포함).

## 검증
- `design/logo/verify.json` 에 파일별 16/24px 열 수·뺨 높이·16px ASCII 래스터 기록. 대조 시트를 사용자에게 전송.
- 키는 `.env` 에서 환경변수로만 읽었고 출력·문서·일지 어디에도 기록하지 않음.

## 메모
- 다음: 사용자가 후보를 고르면 경로 홈의 `#dee`/`#deeHead` 심볼을 그 형태로 교체해 하나로 통일.