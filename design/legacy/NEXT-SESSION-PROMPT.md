# 다음 세션에게 — 디자인 재작업 지시

> 이 파일 하나로 맥락 없이 시작할 수 있게 썼다. 제품 결정 전체는 `.oculpm/discussion/vibe-code-study-app/discussion.md`, 시안 아카이브 설명은 `design/README.md` 에 있다.

## 0. 결정 — 이것부터

**「잉크」(리소그래프) + 박새(Chickadee)** 로 간다.

- 시각 언어: `design/dir-b-riso.html` — 이게 기준이다. **먼저 브라우저에서 열어봐라.**
- 마스코트: `design/fg-dee.html` 의 Dee(박새). 캐릭터 설계와 모션은 유효하나 **「도감」 톤으로 그려져 있으니 잉크로 다시 입혀야 한다.**
- 폐기: 「도감」 방향(`fg-shell.html`, `fg-t0.html`) 의 **시각**. 단 **가독성 엔지니어링과 상호작용 설계는 가져와라** (아래 §3, §4).

## 1. 지난번이 반려된 이유 — 판명됨

사용자가 방향 4안 중 B 「잉크」를 좋아했는데, 내가 C 「목차」를 추천해 채택시켰고 이후 「도감」으로 재정의해 밀어붙였다. **취향을 논리로 덮은 것이 실패의 핵심이다.**

부차적으로: 가독성 피드백을 받은 뒤 절제 규칙(색은 의미에만·정적 장식 0·활자 대비 2배 이내)을 강하게 걸어 **원래 요구였던 「코딩계의 듀오링고」에서 더 멀어졌다.** 활기를 모션에만 몰아넣고 정지 화면을 지나치게 비웠다.

**교훈: 가독성은 본문 텍스트의 문제지 화면 전체를 얌전하게 만들 이유가 아니다.** §3 을 정확히 읽어라.

## 2. 두 컨셉이 만나는 지점 — 여기가 이번 작업의 자산

합치면 공짜로 나오는 것들이다. 어느 쪽 단독으로도 안 나온다.

1. **리소는 잉크를 한 겹씩 겹쳐 찍고, 박새는 검은 머리깃·흰 뺨·회색 등이라는 명확한 색면으로 이루어진 새다.** 2~3도 인쇄로 새를 찍는 건 리소의 전형적 소재이고 실제로 아름답다. 매체와 소재가 원래 궁합이다.
2. **B의 「숙련도 = 잉크 겹(1~4겹)」 + 박새 = 배울수록 새가 선명해진다.** 마스코트 자체가 진행 표시가 된다. **이걸 중심 장치로 삼아라.** 처음 만난 개념의 새는 애벌 1도 하프톤이고, 익을수록 겹이 올라가 또렷해진다.
3. **B의 「모르겠어요 = 다시 찍기」와 Dee의 「거꾸로 매달리기」가 충돌 없이 합쳐진다.** 시스템의 말은 "다시 찍기"(흐린 인쇄를 다시 거는 건 실패가 아니라 공정), Dee의 동작은 거꾸로 매달리기(가지 아랫면을 살피는 실제 습성 = 안 보이던 면을 본다). 둘 다 부끄러움을 은유 차원에서 제거한다 — **이 앱에서 가장 중요한 UX 문제의 해답이니 절대 훼손하지 마라.**
4. 박새의 실제 습성이 기능과 대응한다 — 씨앗을 묻고 몇 달 뒤 되찾음(간격 반복) · 가을에 해마가 커짐(숙련도) · 경계음 `chick-a-dee-dee-dee` 의 `dee` 개수가 위협 수준에 비례(난이도=반복 횟수) · 혼합 무리를 이끔(길잡이).

## 3. 가독성 — 이식하되 과잉 교정 금지 (가장 중요한 절)

「도감」에서 얻은 것 중 **본문 가독성 엔지니어링만** 가져온다. 이건 진짜 개선이었다.

| 항목 | 규칙 |
|---|---|
| **본문 행 길이** | 한글 35~45자. `ch` 는 라틴 `0` 폭 기준이라 **한글엔 2배로 틀린다** — `em` 으로 걸고 렌더 후 실제 글자 수를 세서 맞춰라 (Pretendard ≈1.00em, Apple SD Gothic Neo ≈0.857em → `36em` 이 두 서체를 다 담았다) |
| 강제 방식 | 선언이 아니라 선택자로. `p, li, dd, blockquote, .prose { max-width: var(--measure) }` + 해제는 명시적 클래스로만 |
| 폰트 하한 | UI 라벨 13px. 13px 미만 토큰을 **아예 정의하지 마라** |
| 행간 | 본문 1.7+ / 코드 1.85 |
| 한글 줄바꿈 | `word-break: keep-all` + `line-break: strict` 전역, 코드블록만 해제 |
| 대비 | **본문·라벨 텍스트** 7:1 목표. 계산해서 검증하고 결과를 보고해라 |
| 조사 | 하드코딩 금지. 받침 판별 헬퍼로 은/는·이/가 처리 |

**여기서 멈춰라. 아래는 지난번에 과잉 적용해서 실패한 것들이다:**

- ❌ **「색은 의미에만」을 리소에 적용하지 마라.** 리소는 **잉크 색 자체가 매체**다. 올바른 재정식화는 이것이다 → **「읽어야 하는 텍스트 위에는 잉크를 얹지 않는다」.** 색면·오버프린트·형광진홍은 마음껏 써라. 단 본문 단(column)과 코드 판 안에는 안 들어간다.
- ❌ **「정적 장식 0」을 적용하지 마라.** 등록표시·절취선·컬러바·스탬프는 이 방향의 매력이다. 규칙은 **「장식은 본문 단 밖에만」** 이다.
- ❌ **활자 크기 대비를 2배로 묶지 마라.** 마스트헤드와 큰 숫자는 리소 포스터의 언어다. 제한은 **본문 스케일에만** 걸어라.
- ❌ **코드 구문 강조를 없애지 마라.** 「도감」에서 색 규칙 일관성을 위해 무지개를 통째로 지웠는데, 구문 강조는 장식이 아니라 판독 보조다. 리소 팔레트 안에서 절제된 강조를 하되 지우지는 마라.

한 줄 요약: **본문은 조용하게, 나머지는 잉크답게.**

## 4. B가 자인한 약점 — 반드시 풀어라

`dir-b-riso.html` 을 만든 세션이 스스로 짚은 것들이다.

1. **3주째 피로 (최대 리스크)** — 경로 홈에 등록표시·절취선·잉크 라벨 띠·스탬프·컬러바가 동시에 있어 밀도가 높다. *"스크린샷으로 보면 매력이지만 매일 10분씩 여는 앱에선 3주째에 피로해질 수 있다."* 제안됐으나 미구현인 완화책: **「인쇄 부속 숨기기」 설정.** 기본값을 어디로 둘지도 정해라.
2. **다크 모드가 라이트만 못하다** — 종이 은유는 밝은 쪽이 고향이다. B의 「야간반」(어두운 판지 + `screen` 블렌드로 형광 잉크가 발광)은 좋은 답이었지만 주간반의 쾌감을 100% 재현하진 못했다. **개발자는 밤에 쓴다** — 여기를 더 밀어라.
3. **은유 학습 비용** — 대지·판·겹·교정쇄·미조판. 각 용어 옆에 평문 병기를 유지하고 늘려라 (예: `판이 없는 문법` → "내 코드엔 이미 쓰였는데 아직 안 찍은 문법").
4. **렌더 성능 미검증** — `mix-blend-mode` + `filter: drop-shadow` 조합을 노드 40개 이상에서 재봐라. Tauri WebView(WKWebView/WebView2/WebKitGTK)는 크로미움이 아니다.
5. **본문 가독성을 B는 안 풀었다** — §3 을 이식해라.

## 5. 살아 있는 상호작용 설계 — 다시 발명하지 마라

시각은 낡았지만 동작 설계는 근거가 있다. **특히 T1·T2는 이 파일들에만 있다.**

| 파일 | 가져올 것 |
|---|---|
| `design-t1-clone.html` | 3단계 페이딩(고정 골격·가변 잉크) · **줄 커밋 단위 피드백**(키 입력 단위 아님) · diff 동등 판정 규칙(변수명 치환 3조건 — 스왑 버그 방지) · 「같은 뜻인데요」 이의제기 |
| `design-t2-structure.html` | 계층 밴드 그래프(결정론적 배치) · 문제 4종 · **채점 3티어**(필수/함께 바뀜/흔한 오답) · 커밋 부족 시 폴백 |
| `fg-t0.html` | 「모르겠어요」 4단 사다리 · **선행 개념 점프 후 복귀를 이득으로 만드는 장치**(돌아오면 "방금 배운 것과 이어보기" 문단이 새로 열림) · 오답을 엣지케이스로 전환하는 진단문 |
| `fg-dee.html` | Dee 상태 7종과 그 습성 근거 · 16px 소형 마크(눈·다리 제거 + 뺨 16% 확대) · 감축 모드는 전환만 없애고 **최종 포즈는 유지** · LIFER 모먼트 |
| `design-shell.html` | 세션을 전체화면 오버레이로(이탈 경로 차단) · Esc 즉시 이탈, 확인 모달 없음 · 숙련도는 %가 아니라 버킷 |

**미해결로 넘어온 것**: 세션 진행바에서 T1(10~20분)과 T0 카드(30초)가 같은 칸 크기라 남은 양이 거짓말이 되는 문제 · T1 채점을 tree-sitter AST 비교로 승격(Tauri라 이미 있음, 없는 언어는 정규식 폴백) · 색 토큰 이름 통일 · 컨텍스트별 키맵.

## 6. 로고 생성

`.env` 에 `OPENROUTER_KEY` 가 있다 (`.gitignore` 로 막아뒀다 — **절대 커밋하거나 문서에 값을 적지 마라**).

OpenRouter 이미지 출력 모델(2026-09 기준 확인됨): `google/gemini-3-pro-image` · `google/gemini-3.1-flash-image` · `google/gemini-2.5-flash-image`(가장 저렴) · `openai/gpt-5-image`. 엔드포인트는 `https://openrouter.ai/api/v1/chat/completions`, 헤더 `Authorization: Bearer $OPENROUTER_KEY`. **호출 전에 `curl -s https://openrouter.ai/api/v1/models` 로 현재 유효한 id 를 다시 확인해라.**

^메모: svg 를 주는 모델로 해야해!   
여러 변형을 뽑고 **반드시 16px 로 축소해서 검은 머리깃과 흰 뺨의 대비가 살아있는지 확인해라.** 그게 유일한 합격 기준이다.

### 이미지 프롬프트 (리소그래프 박새)

```
Risograph print of a chickadee bird in side profile, facing right. Bold flat
geometric shapes: round body, wedge tail, small triangular beak.

Printed as a genuine 3-color risograph: solid black cap over the crown
continuing into a black bib under the beak, the cheek left as unprinted paper
(knockout white), the back and wing rendered as a coarse halftone dot screen
in blue, and a hot fluorescent pink layer that is deliberately misregistered
by 1-2mm, showing as a ghost offset edge and creating a darker overprint where
pink and blue overlap.

Visible risograph texture: coarse halftone dots, slight ink mottling, imperfect
registration, warm off-white newsprint paper stock with visible fiber. Flat
spot inks only, no gradients, no digital smoothness, no glow, no drop shadow
blur. High contrast, confident shapes, generous negative space.

Palette strictly: newsprint cream, ink black, risograph blue, fluorescent pink.

Square 1:1, single centered mark, generous margin, silhouette must stay legible
at 16 pixels. No text, no letters, no wordmark.
```

**네거티브**: `3D render, glossy, plastic, smooth gradient, glassmorphism, neon glow, blurred shadow, purple, indigo, photorealistic feather detail, watercolor, sketchy pencil lines, owl, front-facing symmetrical bird, text, letters, watermark, busy background, sticker outline`

`owl` 과 `front-facing symmetrical bird` 를 막는 건 의도적이다 — 안 막으면 모델이 부엉이 구도로 끌고 가고, 그건 듀오링고 흉내가 되어 우리가 피하려던 자리로 돌아간다.

## 7. 만들 것

1. **경로 홈** — 리소 대지(스티커 시트) 적층. B의 경로 은유를 유지하되 §4-1(밀도)을 풀어라. Dee가 길잡이로 등장.
2. **T0 문법 카드** — 「모르겠어요 = 다시 찍기」 4단 사다리 포함. §3 의 본문 가독성 규칙 적용.
3. **잉크 겹 = 숙련도 = 박새의 선명도** 를 시스템으로 정의 (§2-2).
4. 셸의 데일리 세션 플로우.
5. T1·T2는 그다음. §5 의 동작 설계를 잉크로 갈아입히는 작업이다.

**만들기 전에 사용자에게 확인할 것**: 이번엔 방향이 정해졌으니 통째로 다시 묻지 말고, **경로 홈 하나를 먼저 완성해서 보여주고** 반응을 받은 뒤 나머지로 확장해라. 지난번 실패 원인 중 하나가 *"항상 조각만 봤고 「이게 그 앱이다」 할 통합 화면을 한 번도 못 봤다"* 는 것이다.
