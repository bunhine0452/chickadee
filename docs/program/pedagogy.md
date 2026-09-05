# 근거 — 프로그래밍 학습 연구가 실제로 재현한 것

사용자 요청은 「각 언어별로 완벽한 학습법」이었다. **「완벽한」은 없다.** 이 문서가 하는 일은
그 자리에 **언어와 무관하게 재현된 근거**를 두는 것이다. 쓰임은 둘이다 —
다섯 단(정본 §2)과 형식 넷(`fundamentals.md`)이 무엇 위에 서 있는지 못박고,
언어별 문서가 「이 언어에서는 X 로 배워야 한다」고 쓸 때 통과해야 할 시험(§4)을 준다.

전제: 정본 §1·§2·§4 · `exercises.md`(유형 16) · `fundamentals.md`(형식 넷) · `mastery.md` ·
`course.md` · `docs/curriculum/README.md` §8.

**착수 결정은 없다.** 이 문서는 근거 대조이고 등록부 행은 §6 의 물음 뒤에 온다.

---

## 1. 근거의 목록

여기 든 것은 **개입의 효과가 실제로 관찰된 것**과, 효과가 아니라 **학습 목표·목록**이라
효과 크기가 있을 수 없는 것 둘이다. 뒤쪽(notional machine · 오개념 인벤토리)은
「재현」 열에 그 사실을 적었다 — 그것을 효과 근거처럼 인용하는 것이 이 문서가 막으려는 일이다.

「재현」 열의 등급 — **메타**(메타분석) · **다중**(독립 연구 둘 이상이 같은 방향) ·
**단일**(연구 하나) · **불일치**(방향이 갈린다) · **반증** · **개입이 아니다**.
각 출처를 어디까지 읽었는지는 §7 의 「확인」 열에 있다.

### 1.1 인출과 간격 — 앱이 이미 하는 것

| 이름 | 핵심 주장 | 대표 연구 | 재현 | 앱에 있나 |
|---|---|---|---|---|
| 인출 연습 | 다시 읽는 것보다 **꺼내 보는 것**이 파지를 올린다 | Adesope, Trevisan & Sundararajan 2017 (메타분석, RER 87(3)) | **메타** g = 0.61 [0.58, 0.65] | **있다** — 잉크 겹 0~4(`packages/scheduler/src/reducer.ts`) · 정본 §2 |
| 간격 | 같은 횟수를 벌려서 하면 더 오래 남는다 | Cepeda, Pashler, Vul, Wixted & Rohrer 2006 (메타분석, Psych. Bulletin) | **메타** (언어 회상 과제 표본) | **있다** — FSRS-5(`packages/scheduler/src/fsrs.ts`) + 챕터 재검 3일 → 9일 → 3주(D165 · `mastery.md` §3) |
| 강제 산출 | 고르기는 인식이고 적기는 산출이다 | 위 인출 연습 메타의 산출형 조건 | **메타**(같은 출처) | **있다** — 정본 §1 · 형식 `value`(`packages/cards/src/fundamentals.ts` · `packages/grading/src/fundamentals.ts`)가 4지선다를 값 적기로 바꾼 자리 |

세 행이 정본 §1 「읽기는 인식이지 지식이 아니다」의 실제 출처다. 이 셋은 프로그래밍 연구가
아니라 **인지심리 일반**이고, 프로그래밍 특유의 재현은 별도로 없다 —
그래서 앱이 이것으로 재는 것은 **어휘**뿐이고 기능 이해는 챕터 재검이 잰다(`mastery.md` §2).

### 1.2 읽기·추적·쓰기의 순서 — 다섯 단의 뼈대

| 이름 | 핵심 주장 | 대표 연구 | 재현 | 앱에 있나 |
|---|---|---|---|---|
| 추적이 약하면 쓰기도 약하다 | 초보 다수가 **코드 실행 결과 예측**을 못 하고, 그것이 문제 해결의 선행이다 | Lister 외 2004 (ITiCSE WG, 7개국) | **다중** — 국제 표본 | **있다** — 2단 `exec`(D151 · `t0-exec.ts`) · 3단 `cut`·`reorder`(D164 · `packages/cards/src/stage*.ts`) |
| 읽기·추적·쓰기의 **계층** | 문법 지식 → EiPE·Parsons·추적 → 쓰기의 경로도 | Lopez 외 2008 (ICER) | **불일치** — Lister/Fidge/Teague 2009 재현 성공, Fowler 외 2022(600명 이상, SEM)는 **원래 계층이 최적 모형에 안 들었다** | 부분 — 앱은 순서를 쓰되 「이 순서가 최적」이라고 주장하면 안 된다 |
| Explain in Plain English | **관계적**(목적을 말한다) 서술이 다중구조적(줄을 훑는다) 서술보다 쓰기와 붙는다 | Whalley 외 2006 · Murphy 외 2012 · Corney 외 2011 | **다중**(상관), **없음**(개입 효과) | 부분 — 「왜 게이트」가 그 자리인데 **채점하지 않는다**(§2.2) |
| 4기능 점증 교수 | 추적 → 문법 쓰기 → 템플릿 이해 → 템플릿으로 쓰기를 **따로 가르치면** 완료율↑ 오류율↓ | Xie 외 2019 (Computer Science Education 29(2-3)) | **단일** | 부분 — 다섯 단이 같은 모양인데 「템플릿」 축이 없다 |

**중요한 어긋남 하나.** 연구의 tracing 은 **값과 상태를 손으로 굴리는 것**(desk checking)이다.
앱의 2단은 「무엇이 언제 도는가」 — 즉 **경로 추적**이다. `exec`·`hop`·`origin`·`caller` 넷 중
값을 굴리는 것은 **하나도 없다.** 이 자리가 §3 의 새 형식 하나를 부른다.

### 1.3 비계 — Parsons 와 워크드 예제

| 이름 | 핵심 주장 | 대표 연구 | 재현 | 앱에 있나 |
|---|---|---|---|---|
| Parsons 문제 | 섞인 블록을 순서로 놓는 것이 **쓰기보다 빠르고 학습 이득은 같다** | Ericson 외 2022 「Parsons Problems and Beyond」 (ITiCSE-WGR, 141편 SLR) | **다중** — 학습 이득 22편(리뷰가 「근거 품질 높음」으로 평가) · 속도 11편 · 인지 부하 9편(「매우 높음」). 단 **22편 중 9편이 Parsons 의 기여를 다른 연습에서 분리하지 않았고**, 대부분 단일 기관이다(ITiCSE 2023 WG 가 그 한계를 명시) | **없다** — §2.1 |
| Parsons 의 반례 | Parsons 의 정답이 **학생이 흔히 쓰는 꼴과 다르면** 속도 이점이 사라진다 | Haynes & Ericson (Ericson 외 2022 가 인용) | **단일** | 해당 없음(형식이 없다) |
| 함정 블록(distractor) | 안 쓰는 오답 블록이 **흔한 오류를 알아보게** 한다 | Parsons & Haden 2006 (가설) · ITiCSE 2023 WG (근거) | **다중**(형성 평가), **반대**(총괄 평가 — 완료 시간만 늘고 변별력은 안 는다) | 부분 — `blank` 의 `confusions` 가 그 자리인데 ts `essential` 22개 중 **2개**뿐(`exercises.md` §1). D145 의 `dict:lint` 래칫이 그 부채를 재는 장치다 |
| 워크드 예제 + 페이딩 | 예제를 보여 주고 **점점 지워** 가면 백지보다 빠르다 | Renkl·Sweller 계열; CS 이식은 Skudder & Luxton-Reilly 2014 (ACE 리뷰) | **메타**(일반 도메인), **약함**(CS 안에서) | **있다** — T1 페이딩 3단(정본 §5) |
| 하위 목표 라벨(subgoal) | 예제의 덩어리마다 **목적 이름**을 붙이면 전이가 는다 | Margulieux 외 2012(계산 밖) · Morrison, Margulieux & Guzdial 2015 (ICER) · Margulieux, Morrison & Decker 2019 | **불일치** — Morrison 2015 가 **CS 에서 재현 실패**("did not replicate as expected"), 2019 학기 단위 연구는 저성취자 존속률·분산에서 이득 | **없다** — §3.3 이 안 만드는 이유를 적는다 |

### 1.4 오개념과 기계 모형

| 이름 | 핵심 주장 | 대표 연구 | 재현 | 앱에 있나 |
|---|---|---|---|---|
| notional machine | 초보가 막히는 자리는 문법이 아니라 **프로그램이 도는 기계의 상**이다 | du Boulay 1986 (JECR 2(1):57–73) · Sorva 2013 (TOCE 13(2), 리뷰) | **개입이 아니다** — 학습 목표의 이름이라 효과 크기가 없다 | **있다** — `cs/` 43장(D157·D167) · `exec/`(D151) · 그림 셋(비트 배열·평가 트리·값 상자) |
| 오개념 인벤토리 | 초보의 틀린 답은 무작위가 아니라 **되풀이되는 목록**이다 | Qian & Lehman 2017 (TOCE 18(1), 리뷰) · Chiodini 외 2021 (ITiCSE, progmiscon.org) | **다중**(목록의 재발견), **없음**(목록을 쓰면 학습이 는다는 개입 효과) | **부분** — `confusions` · `fundamentals.ts` 의 `siblings` · 오답 분류 아홉 · 가드 카탈로그 |
| 오답을 **참으로 만드는 조건** | 「틀렸다」보다 「그 답이 맞는 세계」를 보이는 편이 진단이다 | 직접 출처 **없음** — 정본 §3-2 의 설계 판단 | **없음** | **있다** — 이 앱의 고유 규칙. 근거가 아니라 결정이라고 적어 둔다 |
| 오류 메시지 개선 | 컴파일러 메시지를 고쳐 쓰면 오류가 준다 | Becker 외 2019 (ITiCSE WG) | **불일치** — Denny 2014 효과 없음 / Becker 2016 효과 있음. WG 결론은 「신호가 약하다」 | **없다** — §5 |

### 1.5 순서와 피드백 — 조건부인 것

| 이름 | 핵심 주장 | 대표 연구 | 재현 | 앱에 있나 |
|---|---|---|---|---|
| 생산적 실패 | **풀어 보고 나서 배우면** 개념 이해와 전이가 낫다 | Kapur 2008 · Sinha & Kapur 2021 (메타분석, RER, 53연구·166비교) | **메타** d = 0.36 [0.20, 0.51], 설계 충실도 높으면 0.58. 단 표본이 **수학·물리·화학·생물·의학**이고 프로그래밍이 아니다 | 부분 — 정본 §3-1 이 감점을 없애 「먼저 틀려도 손해가 없다」가 이미 성립 |
| PRIMM | 예측 → 실행 → 조사 → 수정 → 만들기 순서로 가르치면 성취가 는다 | Sentance, Waite & Kallia 2019 (CSE 29(2-3), 13개교 493명 + 대조군) | **단일** — 독립 재현 없음 | 부분 — 다섯 단이 닮았으나 앱에는 **Run**(실행)이 1~3단에 없다 |
| Use-Modify-Create | 남의 것을 쓰다 → 고치다 → 만들다 | Lee 외 2011 (ACM Inroads) | **없음** — ITEST 프로젝트 **관찰에서 나온 서술 틀**이지 실험이 아니다 | — **뺀다**(§5) |
| 즉시 대 지연 피드백 | 어느 쪽이 나은지는 조건이 정한다 | Shute 2008 (RER 78(1), 리뷰) | **조건부** — 실험실은 지연, 교실은 즉시가 유리 | **있다** — 즉시 채점 + 「오늘 다시」(정본 §3-2)가 교실 쪽 조건이다 |
| 자동 피드백의 실태 | 도구 대부분이 **실수를 지적할 뿐 다음 걸음을 못 준다** | Keuning, Jeuring & Heeren 2018 (TOCE, 도구 101개) | **설계 지침** — 효과 근거가 아니라 현황 조사 | **있다** — 사다리 4단(정본 §3-1)이 정확히 그 「다음 걸음」이다 |
| 라이브 코딩 | 강사가 화면에서 직접 짜는 것이 정적 예제만 하거나 낫다 | Rubin 2013 (SIGCSE) · Raj 외 2018 (Koli Calling, 근거이론) | **약함** — 「정적 예제만큼은 좋다」와 학생 인식 | — **뺀다**(§5) |
| 학습 스타일 | 학습자의 선호 양식에 맞춰 가르치면 낫다 | Pashler, McDaniel, Rohrer & Bjork 2008 (PSPI 9(3)) | **반증** — meshing 가설을 제대로 시험한 연구가 반대 결과 | — **안 쓴다**. 「시각 자료를 많이」는 학습 스타일이 아니라 **내용을 나르는 그림**(`diagrams.md` §1)이라 근거가 다르다 |

### 1.6 집계

| | 수 |
|---|---|
| 검토한 후보 | **20** |
| 재현 등급이 **메타** 또는 **다중** | **10** (인출 · 간격 · 강제 산출 · Lister 2004 · EiPE 상관 · Parsons · 함정 블록 · 워크드 예제 · 오개념 목록 · 생산적 실패) |
| 그중 앱에 **이미 있는** 것 | **6** (인출 · 간격 · 강제 산출 · Lister 2004 의 추적 · 워크드 예제 페이딩 · 오개념 목록 — 부분) |
| 앱에 **없는** 것 | **2** (Parsons · 함정 블록의 실효 규모) |
| 도메인 밖이라 옮기지 않는 것 | **2** (생산적 실패 — 표본이 STEM 이고 프로그래밍이 아니다 · EiPE 개입 효과 — 상관만 있다) |
| 뺀 것 | **4** (학습 스타일 · UMC · 라이브 코딩 · subgoal 형식) |

---

## 2. 다섯 단과의 대조

### 2.1 각 단이 서 있는 근거

| 단 | 서 있는 근거 | 근거 강도 | 빈 곳 |
|---|---|---|---|
| 1 읽기 | notional machine(어휘 층) · 오개념 목록 · 인출 연습 | **메타 + 리뷰** | 「읽었다」의 판정이 짚기·빈칸이라 인식에 머문다. `fundamentals.md` 가 그 자리를 값 적기로 바꾼다 |
| 2 추적 | Lister 2004 · Lopez 2008 · Xie 2019 | **다중** | **연구의 tracing 과 다르다** — 앱은 경로를 묻고 연구는 값을 묻는다(§1.2) |
| 3 예측 | PRIMM 의 **P** · 생산적 실패 | **단일 + 도메인 밖** | PRIMM 의 **R**(실행)이 없다. 예측하고 실제를 못 본다 — `fundamentals.md` §2.2 가 같은 이유로 `predict` 를 내렸다 |
| 4 수정 | PRIMM 의 **M** · UMC 의 Modify | **단일 + 없음** | 근거가 가장 얇은 단이다. 다만 **정답지가 실제 커밋**이라 앱 쪽 근거는 가장 두껍다 |
| 5 재구현 | 워크드 예제 페이딩 · 코드 쓰기(목표) | **메타(페이딩) + 목표이지 근거 아님** | Parsons 가 여기 앞에 들어간다(§2.2) |

**단마다 근거의 두께가 다르다는 것이 이 표의 요점이다.** 1·2단은 재현된 연구 위에 있고
4단은 거의 없다. 그런데 앱에서 4단이 가장 튼튼한 정답지(`fix:` 커밋 diff)를 갖는다 —
**교육 근거의 두께와 채점 가능성이 반대로 붙어 있다.**

### 2.2 두 물음에 답한다

**Parsons 는 「수정」과 「재구현」 사이의 빈 자리인가 — 아니다.**

Ericson 외 2022 의 배치가 다르다. faded Parsons 는 「Parsons 와 코드 쓰기 **사이**」에 놓이고,
Parsons 자체는 쓰기의 **비계**(scaffolding)이지 쓰기 앞의 별도 단계가 아니다.
앱에 옮기면 자리가 셋 나오고 셋 다 이미 있다.

| 후보 자리 | 판정 |
|---|---|
| 4단과 5단 사이의 새 단 | **아니다.** 단을 여섯으로 늘리면 `stage_reached BETWEEN 0 AND 5`(`0007`)와 통과 판정이 전부 바뀐다. 비용이 얻는 것보다 크다 |
| 5단의 **1겹** | **여기다.** T1 페이딩이 이미 3겹이고, Parsons 는 그 앞의 0겹에 해당한다 — 「지우기」가 아니라 「섞기」다 |
| 4단 `patch-place` | **이미 Parsons 다.** 한 줄짜리 Parsons 이고 「스코프 검사가 기계적으로 잡는다」(`exercises.md` §6)가 Parsons 채점 그대로다 |

**Explain in Plain English 는 「추적」의 검증인가 — 아니다. 별도 축이다.**

Lopez 외 2008 의 경로도에서 EiPE 와 추적은 **같은 중간 층의 서로 다른 마디**다.
EiPE 가 재는 것은 값의 흐름이 아니라 **관계적 서술**(목적을 한 문장으로) 능력이고,
그것은 SOLO 수준으로 채점된다.

앱에는 그 자리가 있다 — **「왜 게이트」**(트림 후 10자 이상, 원본과 Dice < 0.6). 그런데
**채점하지 않는다.** 정본 §3-1 이 그렇게 정했고 `exercises.md` §1 이 「채점 없이 자기 말만
받는다. 그것이 목적이다」라고 적었다. 자동 채점하려면 자연어 판정이 필요하고,
**D144 가 런타임 LLM 을 닫았다**(LLM 은 저작 시점에만, `plan chickadee-v04` G 단계).
그러므로 EiPE 는 **의도적으로 재지 않는 축**이고, 그 사실을 여기 적어 둔다 —
「채점 안 함」이 누락이 아니라 결정이라는 것이 나중에 다시 열릴 때의 기록이다.

---

## 3. 형식 넷과의 대조

### 3.1 넷이 각각 무엇의 구현인가

| 형식 | 어느 근거 | 재현 등급 | 어긋나는 자리 |
|---|---|---|---|
| `value` | 인출 연습(강제 산출) + 오개념 진단. Lister 2004 의 「실행 결과 예측」 문항이 이 모양 | **메타 + 다중** | 없음 — 넷 중 근거가 가장 두껍다 |
| `step` | 워크드 예제의 **덩어리 나누기**. 이월 채점은 Shute 2008 의 「비평가적·구체적」 쪽 | **메타(예제) + 리뷰(피드백)** | 걸음이 **기계의 걸음**(`7 / 2` → `int / int` → `3`)이지 **목적의 이름**이 아니다. subgoal 이 아니고, 그것이 §3.3 의 판단 근거다 |
| `table` | 대조 사례 — 같은 식에 입력을 바꿔 **무엇이 변수인지** 드러낸다. 생산적 실패 설계 원칙 안에 있다 | **메타(도메인 밖)** | 「식 × 입력」이라 **시간 축이 없다**(`fundamentals.md` §9 가 이미 적었다) |
| `build` | Parsons 의 사촌 — 토큰 팔레트로 식을 만든다 | **다중**(Parsons) | 팔레트가 있으나 **순서 문제가 아니다.** 채점이 인정 집합이라 러너 없는 아홉 언어에서 게이트 밖(§2.3) |

### 3.2 근거가 요구하는데 형식이 없는 것 — 새 형식 제안

| 이름 | 입력 | 채점 규칙 | 왜 넷으로 안 되나 | 어느 단 | 비용 |
|---|---|---|---|---|---|
| **`order`** | 섞인 코드 블록 N + 함정 블록 M. 끌어 놓기 | `pct = 맞은 인접 쌍/(N−1)` — **2단 `hop` 의 규칙 그대로**. 함정 채택은 별도 기록(`confusions` 진단으로 연결) | 넷은 전부 **값**을 적는다. 이것은 **구조**를 낸다 — 답이 순열이라 `FundValue` 에 안 들어간다 | **5단의 1겹**(T1 페이딩 앞) · 1부에서는 `build` 를 대신할 수 있다 | **결정론.** 정답 순서 = 원본, 함정 = `confusions` + 가드 카탈로그. **LLM 불필요** |
| **`trace-table`** | 반복문·함수와 초기값. 회차 × 변수 격자 | 칸마다 값 일치, 부분 점수. **`table` 의 채점기를 그대로 탄다** | `table` 은 「식 × 입력」이고 이것은 「**시간 × 변수**」다. 앞 회차가 뒤 회차를 정하므로 `step` 의 이월 채점도 함께 필요하다 | **2단** — 연구의 tracing 이 이것이고 지금 2단에 없다(§1.2) | **갈린다.** 카탈로그 식(반복 3회)은 손으로 접히므로 결정론. 리포 코드는 **러너가 있어야** 한다(D175, 지금 자바 하나) |

두 형식 다 `card.kind = 'value'` 에 `payload.type` 으로 앉힐 수 있다 —
`fundamentals.md` §6 의 결정(넷이 같은 채점 길을 탄다)이 여기서도 성립한다.
`order` 는 답이 순열이라 `expected: FundValue` 가 아니라 `expected: number[]` 가 필요하고,
그것이 payload 변형 하나를 더 든다. **DDL 은 0줄이다**(payload 는 JSON).

### 3.3 만들지 않기를 권하는 것 둘

| 이름 | 왜 안 만드나 |
|---|---|
| **`subgoal`** — 예제 덩어리에 목적 이름 붙이기 | ① **CS 에서 재현에 실패했다** — Morrison 외 2015 가 수학·과학에서 나온 이득이 입문 프로그래밍 과제에서 기대만큼 안 나왔다고 적었다 ② 라벨을 **사람이 저작해야** 한다. `exercises.md` §1 의 「저작 부채」 열이 0 이 아닌 유형은 전부 밀렸다 ③ 자유 텍스트 라벨은 채점이 안 되고, 라벨 집합에서 고르면 4지선다로 돌아간다(정본 §1 충돌) |
| **`eipe-pick`** — 「이 함수가 하는 일」 4지 | 관계적 서술을 **고르게** 하면 EiPE 가 재는 것을 안 잰다. 소거법이 그대로 통하고, 정본 §1 이 그것을 이유로 4지선다를 내렸다. **「왜 게이트」를 그대로 둔다**(§2.2) |

---

## 4. 「언어 특유」의 판정 기준

언어별 세션이 「이 언어에서는 X 로 배워야 한다」고 주장할 때 **셋 다** 통과해야 한다.

| 시험 | 묻는 것 | 탈락 신호 |
|---|---|---|
| **T1 이식** | 그 연습을 나머지 아홉 언어에 그대로 옮기면 **답이 사라지거나 물음이 성립하지 않는가** | 답이 **그저 달라진다** — 그것은 `value` 의 `siblings` 가 이미 하는 일이고 일반론이다 |
| **T2 조항** | 그 연습의 대표 오답이 **그 언어의 명세 조항 하나**로 설명되는가 (명세 절 번호 · 컴파일러 오류 코드 · `progmiscon.org` 항목) | 「초보가 헷갈린다」로만 설명된다 |
| **T3 사전** | 그 개념의 `universal` 이 `null` 인가 | `common/` 에 붙는다 — D4 전이가 이미 「같은 것」이라고 판정한 개념이다 |

**판정 한 문장** — 그 연습을 나머지 아홉 언어에 옮겼을 때 **답이 사라져야** 언어 특유다.
답이 달라지는 것은 일반론이고, 그 차이는 이미 `siblings` 가 나른다.

### 넷을 시험해 본다

| 주장 | T1 이식 | T2 조항 | T3 사전 | 판정 |
|---|---|---|---|---|
| **러스트의 컴파일러 오류 읽기** | 갈린다 | 갈린다 | 갈린다 | **조건부 통과** |
| **C 의 메모리 그리기** | 부분 | ○ | ○ | **부분 통과 — 「C 특유」가 아니다** |
| **SQL 의 결과 표 먼저 적기** | ○ | ○ | ○ | **통과 — 넷 중 가장 깨끗하다** |
| **JS 의 이벤트 루프 추적** | ✕ | 부분 | ✕ | **탈락 — 일반론이다** |

**러스트.** 「오류 메시지를 읽게 한다」는 열 언어에 다 걸리고 Becker 외 2019 가 그 일반론의
출처다 — 그대로 쓰면 탈락한다. 갈리는 자리는 **어떤 오류인가**다.
`E0502`(같은 값을 가변·불변으로 동시에 빌림)는 T1 을 통과한다 — 다른 아홉 언어에 그 물음이
없다. 「타입이 안 맞습니다」는 탈락한다. **오류 코드를 적으면 통과, 「오류 읽기」로 적으면 탈락.**

**C.** T1 에서 부분이다 — 주소는 C++·Rust·Go 에도 있고 파이썬·TS·자바·C#·Swift 에는 없다.
그러므로 **「C 특유」가 아니라 「주소가 보이는 언어군의 것」**이다.
`diagrams.md` 가 「메모리 줄」의 언어를 **C·C++·Rust·Go** 로 적어 둔 것이 이 판정과 이미 맞다 —
그림 명세가 옳게 되어 있으니 언어 문서 쪽 문장만 고치면 된다.

**SQL.** T1 에서 답이 아예 사라진다 — 나머지 아홉은 값 하나를 내고 SQL 은 행 집합을 낸다.
`docs/curriculum/README.md` §8 이 이미 「여덟 축 중 셋만 서고 하나는 없고 넷은 다른 것이 된다」고
쟀고, 그것이 T3 의 답이다. **이 통과가 나머지 세 판정의 눈금이다.**

**JS.** 이벤트 루프 추적은 파이썬 `asyncio` · C# `async` · Rust `.await` 에 다 있다 —
답이 다를 뿐 물음은 선다. 탈락이다. 좁히면 통과하는 판이 하나 있다 —
**마이크로태스크와 매크로태스크의 순서**(`Promise.then` 이 `setTimeout(…, 0)` 보다 먼저).
HTML 명세의 태스크 큐 조항이 T2 를 채우고 다른 언어에 대응이 없다.
`exec/await-order`(D151 의 후보 일곱 중 하나)가 그 자리다.

**넷의 결과가 규칙 하나를 준다** — 언어 문서가 낸 주장 중 **좁힌 것은 통과하고 넓힌 것은
탈락했다.** 「오류 읽기」→탈락 / `E0502`→통과. 「이벤트 루프」→탈락 / 마이크로태스크 순서→통과.
언어별 세션에 돌려줄 지침은 **「이 언어에서는 X 로 배워야 한다」를 쓰지 말고 「이 언어의 Y 조항이
다른 아홉에 없다」를 쓰라**는 것이다.

---

## 5. 안 하는 것

| 안 하는 것 | 왜 |
|---|---|
| **학습 스타일에 맞춘 화면·문항** | Pashler 외 2008 이 meshing 가설을 반증했다. 「시각 자료를 많이」라는 사용자 요청은 학습 스타일이 아니라 **내용을 나르는 그림**으로 답한다(`diagrams.md` §1 — 「지우면 문항이 성립하지 않는다」) |
| **Use-Modify-Create 를 사다리 근거로 쓰기** | Lee 외 2011 은 ITEST 프로젝트 **관찰에서 나온 서술 틀**이지 통제 연구가 아니다. 다섯 단이 UMC 를 닮은 것은 사실이나 근거로 인용하면 없는 근거를 대는 것이 된다 |
| **라이브 코딩** | Rubin 2013 의 결론이 「정적 예제만큼은 좋다」이고 Raj 외 2018 은 학생 인식의 근거이론이다. 그리고 앱은 **강의가 아니다** — 정본 §1 이 「설명은 이미 Claude Code 가 한다」로 닫았다 |
| **`subgoal` 형식** | §3.3 |
| **EiPE 자동 채점** | §2.2 — D144 가 런타임 LLM 을 닫았고 D106 이 전송을 닫았다. 재려면 두 결정이 함께 열려야 한다 |
| **오류 메시지 개선을 학습 장치로** | Becker 외 2019 가 「신호가 약하다」로 닫았고, 러너가 없는 아홉 언어에는 **읽을 오류 자체가 없다**. 러너가 붙는 언어에서 4·5단의 부산물로 남기고 별도 장치를 만들지 않는다 |
| **생산적 실패를 순서 규칙으로** | 메타분석은 있으나 표본이 수학·물리·화학·생물·의학이고 프로그래밍이 없다. 그리고 앱은 이미 그 방향이다 — 감점 없음 + 「오늘 다시」(정본 §3-1)가 「먼저 틀려도 손해가 없다」를 만든다. **새로 할 일이 없다** |
| **정본 §1 과 충돌하는 것 일반** | 「내 코드가 교재」 — 합성 예제만으로 서는 장치는 D177 규칙 ①(개념마다 내 코드의 자리를 짚는다)을 통과해야 한다 |

### 0장 상한 폐지의 결과 — 학습 과학 쪽 판단

폐지 자체는 사용자 결정이므로 여기서 다투지 않는다. 판단할 것은 **「첫 기능 챕터까지 15~17일」이
동기 연구와 충돌하는가**다. 답은 **직접 근거로는 판정 불가이고, 앱 고유의 완화 장치 둘이
실제로 거는지가 갈림길**이다. CS1 이탈 연구가 대는 상위 이유는 시간과 동기이고(Kinnunen &
Malmi 계열), 문맥을 앞세운 과정이 존속률을 올린 사례가 있다(Guzdial 의 미디어 계산). 그러나
그 표본은 **15주 학기 대학 과정**이고 「하루 15분 × 17일」의 직접 근거가 아니다 — 이 자리에
숫자를 대면 없는 근거를 대는 것이 된다. 앱에는 완화 장치가 둘 있다. ① D177 규칙 ① — 개념마다
「네 리포의 여기가 그것이다」가 붙어서 17일이 「내 코드와 무관한 17일」이 아니다.
② `foldsPart1` — 아는 사람은 1부를 통째로 접는다. **둘 다 실제로 몇 판에 걸리는지 안 쟀다.**
자바 사전이 8개뿐이라(`course.md` §3.1) 30~34판 중 몇 판이 내 코드를 짚는지 모르고, 짚는 비율이
낮으면 17일은 그냥 일반 튜토리얼 17일이 되며 그것이 D136·D147 이 상한으로 막던 실패 그대로다.
**권고: 상한을 되살리지 말고 성질 게이트로 바꾼다** — 0장 판 중 「내 코드의 자리를 짚는」 판의
비율을 재고 문턱 미만이면 CI 를 세운다. D181 이 Rust 줄 예산에 한 것과 같은 수법이다(대리
지표를 성질 게이트로 교체). 문턱 값은 실측 없이 못 정하므로 §6 의 물음으로 넘긴다.

---

## 6. 사용자 결정

| # | 물음 | 이 문서의 권고 |
|---|---|---|
| 1 | **`order`(Parsons)를 여나.** 열면 `build` 보다 앞인가 뒤인가 | **앞.** 채점이 결정론이고(`hop` 의 pct 재사용) 근거가 넷 중 가장 두껍다. `build` 는 러너를 기다린다(`fundamentals.md` §2.3) |
| 2 | **`trace-table` 을 어디까지 여나** — 카탈로그 식으로 전 언어인가, 러너 있는 언어만인가 | **카탈로그 식으로 전 언어.** 반복 3회짜리 합성 예제는 손으로 접히고, 연구의 tracing 이 지금 2단에 없는 것이 §1.2 의 구멍이다 |
| 3 | **0장 성질 게이트를 두나.** 두면 「내 코드를 짚는 판」의 비율 문턱은 얼마인가 | 실측 먼저 — 자바·파이썬·TS 셋에서 그 비율을 재고 D132 식 래칫(오늘 실측을 임계로)으로 시작한다 |
| 4 | **「왜 게이트」를 계속 안 재나** | **안 잰다.** 재려면 D144·D106 이 함께 열려야 하고, 그것은 이 문서의 범위 밖이다 |
| 5 | **다섯 단의 순서를 「연구가 정한 순서」라고 말하나** | **말하지 않는다.** Fowler 외 2022 가 Lopez 계층의 재현에 실패했다. 앱의 순서는 정본 §2 의 설계 판단이고 근거는 **각 단이 서는 것**이지 **단 사이의 순서**가 아니다 |

---

## 7. 출처

「확인」 — **전문**(PDF 를 열어 읽음) · **초록**(서지·초록·출판사 요약) · **2차**(요약을 거쳤다).
전부 1차 문헌(학술 출판사 · 저자 사본 · 학회 논문집)이고 블로그 요약을 근거로 쓴 것은 없다.

| # | 출처 | 확인 |
|---|---|---|
| 1 | Ericson, Denny, Prather, Duran, Hellas, Leinonen, Miller, Morrison, Pearce, Rodger 2022. *Parsons Problems and Beyond: Systematic Literature Review and Empirical Study Designs.* ITiCSE-WGR '22, 191–234. https://doi.org/10.1145/3571785.3574127 (저자 사본 https://juholeinonen.com/assets/pdf/ericson2022parsons.pdf) | **전문** |
| 2 | Ericson, Denny 외 2023. *Multi-Institutional Multi-National Studies of Parsons Problems.* ITiCSE-WGR '23. https://doi.org/10.1145/3623762.3633498 (사본 https://repository.falmouth.ac.uk/5216/) | **전문** |
| 3 | Lister 외 2004. *A Multi-National Study of Reading and Tracing Skills in Novice Programmers.* ACM SIGCSE Bulletin 36(4), 119–150. https://doi.org/10.1145/1041624.1041673 | 초록 |
| 4 | Lopez, Whalley, Robbins, Lister 2008. *Relationships between reading, tracing and writing skills in introductory programming.* ICER '08. https://doi.org/10.1145/1404520.1404531 | 초록 |
| 5 | Fowler, Smith IV, Hassan, Poulsen, West, Zilles 2022. *Reevaluating the relationship between explaining, tracing, and writing skills in CS1 in a replication study.* Computer Science Education 32(3), 355–383. https://doi.org/10.1080/08993408.2022.2079866 | 초록 |
| 6 | Whalley 외 2006 · Murphy 외 2012 · Corney, Fitzgerald, Hanks, Lister 외 2011/2014. *'Explain in Plain English' questions* 계열. https://doi.org/10.1145/2538862.2538911 | 초록 |
| 7 | Xie, Loksa, Nelson 외 2019. *A theory of instruction for introductory programming skills.* Computer Science Education 29(2-3). https://doi.org/10.1080/08993408.2019.1565235 | 초록 |
| 8 | Sentance, Waite, Kallia 2019. *Teaching computer programming with PRIMM: a sociocultural perspective.* Computer Science Education 29(2-3). 저자 사본 https://suesentance.net/wp-content/uploads/2020/02/teaching_computer_programming_with_primm__a_sociocultural_perspective_author_copy.pdf | 초록 |
| 9 | du Boulay 1986. *Some Difficulties of Learning to Program.* Journal of Educational Computing Research 2(1), 57–73. https://doi.org/10.2190/3LFX-9RRF-67T8-UVK9 | 초록 |
| 10 | Sorva 2013. *Notional Machines and Introductory Programming Education.* ACM TOCE 13(2), 1–31. https://doi.org/10.1145/2483710.2483713 | 초록 |
| 11 | Qian, Lehman 2017. *Students' Misconceptions and Other Difficulties in Introductory Programming: A Literature Review.* ACM TOCE 18(1), 1–24. https://doi.org/10.1145/3077618 | 초록 |
| 12 | Chiodini, Moreno Santos, Gallidabino, Tafliovich, Santos, Hauswirth 2021. *A Curated Inventory of Programming Language Misconceptions.* ITiCSE '21. https://doi.org/10.1145/3430665.3456343 · 목록 https://progmiscon.org/ | 초록 |
| 13 | Morrison, Margulieux, Guzdial 2015. *Subgoals, Context, and Worked Examples in Learning Computing Problem Solving.* ICER '15, 21–30. https://doi.org/10.1145/2787622.2787733 | 초록 |
| 14 | Margulieux, Morrison, Decker 2019. *Design and Pilot Testing of Subgoal Labeled Worked Examples for Five Core Concepts in CS1.* ITiCSE '19. https://doi.org/10.1145/3304221.3319756 | 초록 |
| 15 | Skudder, Luxton-Reilly 2014. *Worked examples in computer science.* ACE '14, 59–64. https://dl.acm.org/doi/10.5555/2667490.2667497 | 초록 |
| 16 | Becker 외 2019. *Compiler Error Messages Considered Unhelpful: The Landscape of Text-Based Programming Error Message Research.* ITiCSE-WGR '19. https://doi.org/10.1145/3344429.3372508 | 초록 |
| 17 | Keuning, Jeuring, Heeren 2018. *A Systematic Literature Review of Automated Feedback Generation for Programming Exercises.* ACM TOCE 19(1). https://doi.org/10.1145/3231711 | 초록 |
| 18 | Shute 2008. *Focus on Formative Feedback.* Review of Educational Research 78(1), 153–189. https://doi.org/10.3102/0034654307313795 | 초록 |
| 19 | Adesope, Trevisan, Sundararajan 2017. *Rethinking the Use of Tests: A Meta-Analysis of Practice Testing.* Review of Educational Research 87(3), 659–701. https://doi.org/10.3102/0034654316689306 | 초록 |
| 20 | Cepeda, Pashler, Vul, Wixted, Rohrer 2006. *Distributed practice in verbal recall tasks: A review and quantitative synthesis.* Psychological Bulletin 132(3), 354–380. | 초록 |
| 21 | Sinha, Kapur 2021. *When Problem Solving Followed by Instruction Works: Evidence for Productive Failure.* Review of Educational Research 91(5). https://doi.org/10.3102/00346543211019105 | 초록 |
| 22 | Pashler, McDaniel, Rohrer, Bjork 2008. *Learning Styles: Concepts and Evidence.* Psychological Science in the Public Interest 9(3), 105–119. https://doi.org/10.1111/j.1539-6053.2009.01038.x | 초록 |
| 23 | Lee 외 2011. *Computational thinking for youth in practice.* ACM Inroads 2(1), 32–37. https://doi.org/10.1145/1929887.1929902 | 초록 |
| 24 | Rubin 2013. *The effectiveness of live-coding to teach introductory programming.* SIGCSE '13 · Raj 외 2018. *Role of Live-coding in Learning Introductory Programming.* Koli Calling '18. https://doi.org/10.1145/3279720.3279725 | 초록 |
| 25 | Parsons, Haden 2006. *Parson's programming puzzles: a fun and effective learning tool for first programming courses.* ACE '06 (출처 1·2 를 통해 확인) | 2차 |

**한계.** 25건 중 전문을 읽은 것은 **2건**이고 나머지는 서지·초록·출판사 요약이다.
효과 크기를 인용한 넷(19·20·21·1)은 그 수치가 출판사 초록 또는 본문에 있는 것만 적었고,
초록에 없는 값은 「메타」 등급만 적고 숫자를 비웠다.

**가장 큰 구멍은 Parsons 다.** 출처 1 의 §4.4.1 은 편수와 품질 평가만 주고 **효과 크기를 모으지
않았다** — 리뷰가 메타분석이 아니라 체계적 문헌 검토라서다. 그리고 그 22편 중 **9편은 Parsons
와 다른 연습을 섞은 시스템에서 이득을 쟀고 Parsons 의 기여를 분리하지 않았다.** §3.2 의 `order`
를 열기 전에 확인해야 할 것은 「Parsons 가 낫다」가 아니라 **「분리한 13편이 어느 방향인가」**다.
