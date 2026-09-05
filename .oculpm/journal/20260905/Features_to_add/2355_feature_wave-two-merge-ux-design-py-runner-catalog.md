---
schema_version: 1
type: feature
slug: "wave-two-merge-ux-design-py-runner-catalog"
status: done
difficulty: high
created_at: "2026-09-05T23:55:49+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "acp-20260905-d4ae2987"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
related: []
tags:
  - "v10"
  - "합류"
  - "UX"
  - "디자인"
  - "사전"
  - "러너"
  - "게이트"
  - "mcp-tool"
---
[x] 둘째 물결 합류 — 완성의 정의 넷(D186)이 전부 게이트로 섰다

병렬 여섯(S1·S2·S6·S9·S11·S12, Opus). 도중에 호스트 프로세스가 재시작돼 다섯이 멈췄다가 SendMessage 로 재개했다 — 트랜스크립트가 남아 있어 잃은 것은 없었다.

## 게이트 넷이 실물로

- **① 불편이 없다**(S1): 학습자 여정을 하네스로 걸어 막힘 3 · 포커스 유실 5 · 거짓 5 를 **전부 0** 으로. 첫 실행→첫 판 클릭 3→2. `journey.spec.ts`(8×2엔진) · `honesty.spec.ts`(7×2) · `e9-journey.e2e.ts`(6, 리눅스). 고친 파일 42.
- **② 이상하지 않다**(S2): `pnpm shots` 가 **24화면 × 6 = 144장**을 찍고 `shots.spec.ts` 가 목록을 코드(`Screen`·`StageType`)에서 읽어 뒤처짐을 잡는다. 이상한 곳 19 → 고침 14. 폭 셋 넘침 0, 2560 ≤ 2단, 대비 142쌍. 코드 창 16px 은 720 높이에 10.4줄 — 40줄은 안 들고 스크롤이 답이다.
- **③ 학습질**(S12): 성질 게이트 셋 — 내 코드 비율 tiny 16/16 = 100%(문턱 50%) · 값 추적 침묵 0 · 진단 249/249. vitest 에 두고 Playwright 는 읽기만(사전 번들이 `import.meta.glob`, 자식 vitest 를 띄우면 WebKit 31판이 죽는다).
- **④ 정직성**: 「네 코드엔 없다」 사유 넷이 화면에 실제로 붙었고(전엔 아무 화면도 안 불렀다), 「러너 없음/툴체인 없음/방언 미지원」이 목차와 판에 남는다.

## 실물

- **파이썬 사전 8 → 24장**, 골든 123. 캡처 수가 이전 `ast` 실측과 한 곳도 안 어긋났다. 합성은 `implicit-conversion` 하나(사유 `idiom`).
- **stdin 러너**(셋째 러너) + **우리가 쓴 작은 문제 열넷**(케이스 56, 정답은 `reference.py` 가 냄) + **`build` 형식 유보 해제**. 파이썬 17ms·노드 57ms, 자바는 JDK 없어 미검증(툴체인 없음 처리 확인).
- **코스**: diff 42행 반영 · 단별 탈출(74→42일) · 작은 문제 층이 0부 뒤(+3일 → 77/45일) · 자바 0부 17개념으로 열넷 중 여섯이 선다.
- **카탈로그 38 → 249장**(식 4→27, 1식 개념 0), 진단 재료 셋(`variants`·`langAlt`·`compile-error/unspecified`), 재출제 다른 식, `meaning`→`value` 40장.

## 회귀 하나를 잡았다

S1 이 헤더 테마 스위치를 지우면서 `applyTheme()` 을 부르는 화면이 설정 하나만 남아 **23화면이 밝게로 굳었다** — S2 의 전수 스크린샷이 잡았다(어둡게 23장이 밝게와 바이트까지 같음). `boot.ts` 에서 창을 보이기 전에 테마를 세우고 `index.html` 의 `data-theme="light"` 못박기를 지웠다. 72쌍 전부 다름으로 확인, 게이트 둘로 잠갔다.

## 구조 결함 하나를 고쳤다

`bake.ts` 의 대여자 선택이 id 알파벳순 여섯을 자르며 **리포의 언어를 안 봤다** — 파이썬이 들어오자 드러났지만 TS 리포도 이미 자바 창을 빌리고 있었다(S6). 언어로 거른 뒤 자른다.

## 합류에서 내가 한 것

래칫 120/116/120/111 · ABSENCE `py/implicit-conversion` · D188(둘째 물결이 정한 열 가지) · S2 의 등록부 행이 D188 과 겹쳐 D189 로 · 규약 8 읽는 법(essential 신규 수) · 코스 77일을 D187 ⑭ 에 병기.

## 아직 못 한 것 — 정직하게

- **그림 일곱이 어느 화면에도 안 마운트됐다**(S2 발견). 만들어졌고 시험도 있지만 판이 부르지 않는다. 다음 판의 첫 일.
- **0부 형식(`value`·`step`·`table`)이 앱 원장에 없다** — `CardPayload` 에 모양이 없고 마이그레이션 `0010` 이 아직이다. 카탈로그 249장은 순수 함수로만 선다. 성질 게이트 ㄴ 이 재는 「값 추적」은 챕터의 `trace-table` 과 0부 사다리 쪽이다.
- **자바 러너는 이 기계에서 미검증**(JDK 없음). CI 우분투에 JDK 가 있으면 거기서 첫 실행이 된다.
- **4·5단은 시드에 러너도 커밋도 없어 사람 눈으로 못 봤다.**

## 검증

전체 게이트 결과는 커밋 메시지·최종 보고에.