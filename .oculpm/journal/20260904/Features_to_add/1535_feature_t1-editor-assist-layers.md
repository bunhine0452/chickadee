---
schema_version: 1
type: feature
slug: "t1-editor-assist-layers"
status: done
difficulty: high
created_at: "2026-09-04T15:35:48+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/t1/monacoOptions.ts"
    op: update
  - path: "apps/desktop/src/components/t1/assist.ts"
    op: create
  - path: "apps/desktop/src/components/t1/assist.test.ts"
    op: create
  - path: "apps/desktop/src/components/t1/ClonePad.tsx"
    op: update
  - path: "apps/desktop/src/components/t1/ClonePad.test.tsx"
    op: update
  - path: "apps/desktop/src/components/t1/PlainPad.tsx"
    op: update
  - path: "apps/desktop/src/components/t1/EdStatus.tsx"
    op: update
  - path: "apps/desktop/src/components/t1/EdStatus.test.tsx"
    op: update
  - path: "apps/desktop/src/components/session/SessionOverlay.tsx"
    op: update
  - path: "apps/desktop/src/components/session/SessionOverlay.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T1Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CoursePlateView.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CloneScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "packages/grading/src/t1-types.ts"
    op: update
  - path: "packages/grading/src/t1-result.ts"
    op: update
  - path: "packages/grading/src/t1.test.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "t1"
  - "monaco"
  - "ime"
  - "d143"
  - "autocomplete"
  - "mcp-tool"
---
[x] 필사 판에 편집 보조 두 층 — 자동 닫기와 단어 제안을 단계와 함께 페이딩한다 (D143)

조사 보고서 `B-autocomplete.md`(스크래치패드 456줄)의 방안 B 를 구현했다. 설정 노출은 권고안과
다른 사용자 결정이라 「연다」로 갔고, 기본값은 권고 매트릭스 그대로 두었다.

## 추가 기능

**규칙 한 줄** — 학습자가 고르지 않은 텍스트를 만드는 보조는 단계와 함께 페이딩하고, 이미 고른
텍스트의 타건 수만 줄이는 보조는 페이딩하지 않는다. 새 원칙이 아니라 `autoIndent` 가 1·2단계
`'brackets'` / 3단계 `'none'` 이던 것을 일반화했다.

| 층 | T1-1 | T1-2 | T1-3 백지 | 코스-2 | 코스-3 |
|---|---|---|---|---|---|
| L0a 자동 들여쓰기 | 켬 | 켬 | 끔 | 켬 | 끔 |
| L0b 자동 닫기·surround | 켬(신규) | 켬(신규) | 끔 | 켬(신규) | 끔 |
| L1 단어 기반 제안 | 불가(textarea) | 켬(신규) | 켬(신규) | 켬(신규) | 켬(신규) |

L3 언어 서비스는 싣지 않았다 — `ts.worker` 가 1,286,340 B gzip 으로 05 §1.3 의 Monaco 청크 예산
1.2 MB 를 워커 하나로 넘고, 12~40줄 떼어낸 블록에서는 「Cannot find name」 융단밖에 못 낸다.
L0b·L1 은 번들 증가 **0 바이트**(전부 `editor.api` 안에 이미 있다).

## 동작 흐름

1. `monacoOptions.assistFor(stage, assist)` 가 켤 층을 정하고 `optionsFor()` 가 Monaco 옵션으로 옮긴다.
2. 키 규칙 셋 — `Tab` 은 `addCommand(…, '!suggestWidgetVisible')`(문맥이 없으면 제안을 영영 못 받는다),
   `Enter` 는 `acceptSuggestionOnEnter:'off'` + `acceptSuggestionOnCommitCharacter:false`,
   `Esc` 는 `SessionOverlay` 사다리 앞에 ⓪ 단(제안 위젯이 보이면 지나가고 Monaco 가 닫게 둔다).
3. `assist.ts` 가 변경의 모양으로 `AssistCount{keyed, assisted, pasted, accepted}` 를 센다.
   `peeks` 와 같은 자리·같은 규칙(감점 없음)이고 `EdStatus` 에 「손으로 앉힌 글자 N %」로 나온다.
   **`pct` 는 이 값을 한 번도 읽지 않는다.** 계수는 자동 저장과 같은 400 ms 박자로만 부모에 올린다.
4. 설정 「편집 보조」 `stage`(기본) / `off`. `settings` 테이블의 `editor_assist` 키.

곁다리 둘: `.tsx`/`.jsx` 의 Monaco 언어 id 를 `'tsx'`(0.52 에 없는 id) → `'typescript'` 로 고쳤다 —
등록 안 된 id 로 `setModelLanguage` 를 부르면 모델이 plaintext 가 되어 **React 파일 필사의 2·3단계
구문 색이 통째로 죽어 있었다.** 05 §8 의 `basic-languages` 목록도 코드(go 포함, swift·dart 없음)에
맞췄다. 그리고 붙여넣기가 이제 처음 세어진다 — 그전에는 3단계 백지에 원본을 ⌘V 로 통째로 넣어도
어디에도 안 남았다.

## 실측 (Playwright WebKit = WKWebView 대리, 릴리스 빌드 아님)

- **IME × 자동 닫기 — 안 깨진다.** 닫는 따옴표가 캐럿 뒤에 앉은 채 한글을 조합해도 모델은
  `s = "한"`, 캐럿은 닫는 따옴표 앞, `compositionend` 1회. **화면 캐럿 이동 px 가 대조군(자동 닫기
  off)과 완전히 같다**(71 → 103). 구조 근거도 있다 — Monaco 0.52 가 `typeWithInterceptors` 의
  인터셉터 전부를 `!isDoingComposition` 으로 막고(조합은 `compositionType` 경로), `accessibilitySupport:'auto'`
  라 숨은 textarea 에는 `PagedScreenReaderStrategy` 때문에 **원래부터 캐럿 뒤 텍스트가 있다.**
  다만 진짜 macOS IME 를 붙인 실제 WKWebView 에서는 못 쟀다(Playwright 에 WebKit IME 주입 API 가 없다).
- 타이핑 중 `frame_p95` 18.0 ms — 대조군도 18.0 ms. 둘 다 vsync 바닥 16.6 ms 에 붙어 있어 이
  하네스로는 그 아래를 못 가른다. 말할 수 있는 것은 「L1 이 재는 값을 늘리지 않았다」까지다.
- 타건 → 첫 제안 목록 중앙 116 ms · p95 126 ms. 그중 100 ms 는 Monaco 자신의 표시 지연
  (`suggestWidget.js:406` 의 `cancelAndSet(…, 100)`)이라 실제 작업은 약 16 ms. 새 mark 는 안 만들었다.
- `t1:monaco` 재측정은 **못 했다** — 릴리스 WKWebView 빌드가 필요하다. 기여 집합이 안 늘어 292~303 ms
  가 그대로일 것으로 보지만 예상이지 실측이 아니고, 05 §10 에도 그렇게 적었다.
- 표본 실측(리포 자체): 닫힘만 있는 줄이 TS 비공백 줄의 12.5 % · Rust 15.9 % · Python 4.0 %.
  이것이 L0b 를 3단계에서만 끄는 근거다.

## 부모에게 넘긴 것

`store-sql/src/schemas.ts` 의 zod(`itemStateSchema`·`reviewDetailSchema`)에 `assist` 를 안 더하면
저장돼도 읽을 때 사라진다. `data/session.ts` 의 저장·복원 배선과 이의 `patternKey` 에 설정 상태를
싣는 변경(= `T1_ENGINE_VERSION` 을 올려야 하는 변경), 정본 §3-4 의 Esc 사다리 개정도 부모 몫이다.
diff 초안과 D143 행 초안은 `scratchpad/impl-F-autocomplete.md` 에 있다.

## 검증

- `pnpm -r typecheck` 오류 0 · `npx vitest run` 174파일 1,886건 전량 통과 · 손댄 자리 eslint 0.
- **`golden-t1` 31건 무수정 통과** — 골든 픽스처를 한 글자도 안 고쳤다. `pct` 불변을 `t1.test.ts` 의
  새 회귀 둘이 `toStrictEqual` 로 다시 못 박는다.
- 새 시험 31건 — 층 매트릭스·`off` 전부 끔·Enter 수락 금지·Tab 문맥·Esc ⓪ 단·언어 id 셋·
  `PlainPad` 자동 닫기 넷·`AssistCount` 분류 전수·설정 왕복.
- Playwright 게이트는 안 돌렸다(빌드가 필요하고 다른 세션과 겹친다).