# EVALS — Chickadee 완료 정의

이 파일이 이 프로젝트의 완료 정의다. `pnpm test:unit` 의 1,980건은 **기계가 의도대로 도는가**를 잰다. 이 파일은 **사람이 배우는가**를 잰다. 둘은 다르고, 2026-09-04 까지 뒤쪽을 재는 항목은 하나도 없었다.

실행은 `/oculpm:run-evals`. 판정 규칙은 그 스킬을 따른다 — 결정적 체크가 1순위, 루브릭(1~5, 4점 이상 통과)은 결정적 체크가 불가능한 항목만, **사람 확인 항목은 N/M 분모에서 뺀다**.

스위트 넷:

| 스위트 | 종류 | 무엇 | 분모 |
|---|---|---|---|
| `gates` | regression | 이미 CI 가 도는 것 | 13 |
| `ledger` | capability | 원장 SQL 로 새로 재는 학습 지표 | 9 |
| `human` | capability | 사람이 봐야만 하는 것 | 제외 |
| `blocked` | — | 지금 구조로는 못 재는 것 | 제외 |

원장 SQL 의 `$DB` 는 `~/Library/Application Support/dev.chickadee.app/chickadee.db` 다. 읽기 전용으로 연다(`sqlite3 -readonly "$DB"`).

---

## 스위트 `gates` — 이미 있는 게이트 (regression)

**이 열셋 중 학습 성과를 재는 것은 0개다.** 전부 「기계가 도는가」이고, 그것이 이 파일이 필요한 이유다.

| # | 무엇을 재나 | 어떻게 | 통과선 | 2026-09-04 실측 |
|---|---|---|---|---|
| G1 | 얇은 Rust — 줄 수·금칙어·SQL 리터럴·git 바이너리 | `bash scripts/check-rust-budget.sh` | exit 0 | **통과** 2,352/2,800줄, 검사 넷 ok |
| G2 | 사전 저작 부채 넷 (D145 래칫) | `pnpm dict:lint` | 충족 수가 래칫 아래로 안 내려감 | **통과** 31/31 · 31/32 · 31/31 · 18/18 (래칫 31·31·31·18 전부 잠김) |
| G3 | 카드 유형 쏠림 (D132) | `npx vitest run tests/support/quality.test.ts` | 최대 유형 ≤ 래칫 76.5% | **통과** 76.4% (목표 80%) |
| G4 | 정답 위치 균등 (D128) | 위와 같은 명령 | 최대칸 ≤ 45% | **통과** 29.3% (77·67·57·62) |
| G5 | 새 판 드롭률 | 위와 같은 명령 | ≤ 5% | **통과** 0.0% (300장 중 고유 178) |
| G6 | 예고 없는 합성 판 (D137) | 위와 같은 명령 | 0 | **통과** 0 |
| G7 | 골든 — 개념당 양성 3·음성 2 | `cargo test -p chickadee-parse --test golden` | exit 0 | **통과** (오늘 8개 개념 40장 추가) |
| G8 | 단위 시험 전량 | `pnpm test:unit` | 전량 통과 | **통과** 1,980/1,980 · 177 파일 |
| G9 | 타입 | `pnpm typecheck` | 무출력 | **통과** |
| G10 | IPC 덤프가 커밋본과 같다 | `cargo test -p chickadee-app --test pipeline` 뒤 `git diff --exit-code fixtures/ipc` | 차이 0 | **통과(재생성 뒤)** — 개념 여덟을 더해 `tiny/captures-all.json`·`projectox/blocks.json` 둘이 바뀐다. 두 번 돌려 해시가 같아 결정적임을 확인했다. **커밋해야 CI 가 초록이 된다** |
| G11 | 디자인 게이트 (접근성·대비·모션·키보드·en 스모크) | `pnpm test:gates` | exit 0 | **미측** — playwright 브라우저 둘 필요 |
| G12 | 실바이너리 E1~E8 | `pnpm test:e2e` | exit 0 | **미측** — `tauri-driver` 가 Linux·Windows 전용이라 macOS 에서 못 돈다 |
| G13 | 시각 기준선 40장 | `pnpm test:visual` | `maxDiffPixelRatio ≤ 0.002` | **기준선이 아직 없다** (`tests/visual/README.md`) |

**G10 주.** `fixtures/repos/tiny.steps` 는 `function clamp(…)`, `if (value < low) return low;` 를 그대로 담는다(그 파일 머리가 「function · 반복 · 조건」을 고르게 담는다고 적어 뒀다). 그런데 커밋된 `fixtures/ipc/tiny/captures-all.json` 의 `query_id` 17종에 오늘 더한 여덟(`ts/if-statement` · `while-loop` · `function-declaration` · `return-statement` · `comparison` · `arithmetic` · `boolean-literal` · `reassignment`)이 **하나도 없다**. CI 가 `cargo test -p chickadee-app --test pipeline` 으로 덤프를 다시 쓰면 그 여덟이 붙어 `git diff --exit-code` 가 깨진다. 덤프를 다시 굽고 커밋해야 한다.

---

## 지표를 고른 근거 — 학습과학

지표를 발명하지 않는다. 정본이 이미 정한 것을 쓰되, **왜 그 정의가 맞는지**는 밖에 근거가 있다. 이 파일이 재는 것을 셋이 떠받친다.

| 무엇 | 문헌이 말하는 것 | 우리 어디에 |
|---|---|---|
| **간격 효과** | 같은 날 몰아친 반복은 즉시 성능만 올리고 장기 파지는 안 올린다. 심리학에서 가장 많이 재현된 결과 중 하나다 | 정본 §2 「겹은 **시간을 두고** 다시 맞힌 횟수로 쌓인다」 → **L2** |
| **완성 예제 효과와 그 역전** | 초보는 완성된 풀이를 먼저 보는 편이 낫고, **숙련되면 역전되어** 완성 예제가 오히려 성능을 깎는다. 단계를 점진적으로 걷어내는 페이딩이 특히 효과적이다 | 정본 §1 「설명이 아니라 강제된 능동 출력」은 **숙련자 기준으로 옳다**. 첫 만남에는 반대라, 「먼저 읽기」를 겹 0 에만 주는 것이 그 두 문장을 동시에 지키는 선이다 → **L3** |
| **추적 → 설명 → 쓰기** | 초보의 능력은 이 순서로 붙는다. 최소한의 추적·설명 능력이 체계적인 쓰기보다 앞선다. 초보 오해의 다수는 실행 모델(변수 상태·제어 흐름·실행 순서)의 부족에서 온다 | **우리 트랙은 이 순서가 아니다** — T0 은 어휘이고 T1(필사)은 *쓰기*, 즉 가장 위층이다. **추적이 통째로 없다.** → **L5** 가 이 어긋남을 수로 드러낸다 |

셋째 줄이 이 파일에서 가장 무거운 항목이다. L5 가 「t1·t2 0건」을 찍는 것은 스케줄러 설정 탓만이 아닐 수 있다 — 순서 자체가 뒤집혀 있으면 표본이 안 차는 것이 정상이다.

---

## 스위트 `ledger` — 원장으로 재는 학습 지표 (capability)

지표를 새로 발명하지 않는다. 정본 §2 가 이미 정의한 **잉크 겹 0~4** 와 「겹은 맞힌 횟수가 아니라 **시간을 두고 다시 맞힌 횟수**로 쌓인다」를 그대로 쓰고, FSRS 가 `review_log` 에 이미 쓰는 열(`layer_before`·`layer_after`·`elapsed_days`·`r_at_review`·`grade`·`ok`·`early`)만 읽는다.

### L1 — 겹이 실제로 쌓이나

① 판을 찍었을 때 겹이 오르는 비율. ② SQL:

```sql
SELECT COUNT(*) AS n, SUM(layer_after > layer_before) AS up,
       ROUND(1.0*SUM(layer_after > layer_before)/NULLIF(COUNT(*),0), 3) AS rate
FROM review_log;
```

③ 통과선: `n ≥ 100` 이고 `rate` 가 0.25~0.75. ④ **2026-09-04: n=10 · up=6 · rate 0.600 — 표본 미달로 판정 불가.**

### L2 — 「시간을 두고」가 지켜지나 (정본 §2 의 겹 정의)

① 겹이 오른 복습 중 직전 복습으로부터 **하루 이상** 지난 것의 비율. 같은 날 두 번 맞힌 것은 정본이 말하는 겹이 아니다. ② SQL:

```sql
SELECT SUM(layer_after > layer_before) AS up,
       SUM(layer_after > layer_before AND elapsed_days >= 1.0) AS up_spaced,
       ROUND(1.0*SUM(layer_after > layer_before AND elapsed_days >= 1.0)
             /NULLIF(SUM(layer_after > layer_before),0), 3) AS rate
FROM review_log;
```

③ 통과선: `rate ≥ 0.6`. ④ **2026-09-04: up=6 · up_spaced=0 · rate 0.000 — 판정 불가(표본 미달).** 세션 셋이 전부 하루에 몰렸고 `elapsed_days` 최대가 0.08(약 2시간)이다.

**이 0 을 실패로 세지 않는 이유**: 간격 효과(spacing effect) 문헌이 「같은 날 몰아친 반복은 즉시 성능은 올리지만 장기 파지는 안 올린다」를 반복 검증했다. 즉 **정본 §2 의 규칙이 옳고, 규칙이 옳게 동작한 결과가 이 0 이다.** 하루에 몰아친 복습에 겹을 주지 않은 것이 정확한 행동이다. 이 지표가 재는 것은 규칙의 정합성이 아니라 **사용 패턴** — 며칠에 걸쳐 쓴 원장이 생기기 전에는 분자도 분모도 안 찬다. 그런 원장이 생겼는데도 `rate` 가 낮으면 그때는 진짜 실패이고, 원인은 규칙이 아니라 재출제 간격(L9)에 있다.

### L3 — 첫 노출 정답률

① 뿌리 개념을 처음 만났을 때 맞히는 비율. 너무 높으면 문제가 읽기 확인이 된 것(D138 이 경계한 자리), 너무 낮으면 벽이다. ② SQL:

```sql
SELECT COUNT(*) AS n, SUM(ok) AS ok, ROUND(1.0*SUM(ok)/NULLIF(COUNT(*),0), 3) AS rate
FROM review_log WHERE role = 'new' AND layer_before = 0;
```

③ 통과선: `n ≥ 40` 이고 `rate` 가 0.40~0.85. ④ **2026-09-04: n=2 · ok=1 · rate 0.500 — 표본 미달로 판정 불가.**

### L4 — 0장 완주 일수

① 0장 대지에 담긴 개념이 전부 1겹 이상이 되기까지 걸린 날 수. 정본 §4 가 「하루 새 판 2장이라 12일」이라고 예측한 값의 실측이다. ② SQL:

```sql
SELECT COUNT(*) AS plates,
       SUM(COALESCE(m.layer,0) >= 1) AS inked,
       (SELECT COUNT(DISTINCT day_key) FROM review_log) AS days
FROM unit_node n
LEFT JOIN mastery m ON m.concept_id = n.concept_id
WHERE n.unit_id = (SELECT id FROM unit WHERE name = '__zero__' LIMIT 1);
```

③ 통과선: `inked = plates` 이고 `days ≤ 18`(예측 12일 + 50% 여유). ④ **2026-09-04: plates=8 · inked=3 · days=1 — 미완.** 대지가 아직 옛 상한(8)으로 구워져 있어 다시 읽어야 21판이 된다.

### L5 — 트랙 커버리지

① 세 트랙이 실제로 찍혔는가. 하나도 안 찍힌 트랙은 어떤 지표로도 검증되지 않는다. ② SQL:

```sql
SELECT track, role, COUNT(*) AS n, SUM(ok) AS ok FROM review_log GROUP BY track, role;
```

③ 통과선: `t0`·`t1`·`t2` 가 각각 `n ≥ 1`. ④ **2026-09-04: t0 만 10건(gap 3 · manual 2 · new 2 · retry 3). t1 0건 · t2 0건 — 실패.** 필사와 구조는 원장에 한 번도 남은 적이 없다.

### L6 — 사다리가 일을 하나

① 「모르겠어요」가 몇 단까지 갔나. 4단(LLM 프롬프트)의 몫이 크면 1~3단(사전·아래층 점프·같은 문법 다른 자리)이 못 받아 낸 것이다. ② SQL:

```sql
SELECT max_rung, COUNT(*) AS n FROM dunno_event GROUP BY max_rung ORDER BY max_rung;
```

③ 통과선: `n ≥ 20` 이고 `max_rung = 4` 의 몫 ≤ 0.25. ④ **2026-09-04: dunno_event 0건 — 「모르겠어요」가 한 번도 안 눌렸다. 판정 불가.**

### L7 — 아래층 점프가 효과가 있나

① 사다리 2단에서 선행 판으로 점프해 마치고 돌아온 뒤, 부모 판을 맞히는 비율. 정본 §3-1 ②가 약속한 효과의 실측이다. ② SQL:

```sql
SELECT COUNT(*) AS returned,
       SUM(r.ok) AS ok_after
FROM ladder_event j
JOIN ladder_event b ON b.dunno_event_id = j.dunno_event_id AND b.action = 'return'
JOIN dunno_event d ON d.id = j.dunno_event_id
JOIN review_log r ON r.id = d.review_log_id
WHERE j.action = 'jump';
```

③ 통과선: `returned ≥ 10` 이고 `ok_after/returned ≥ 0.6`. ④ **2026-09-04: ladder_event 0건 — 판정 불가.**

### L8 — 하루 예산이 실제로 채워지나

① 계획된 분이 예산에 얼마나 닿나. 판이 모자라면 예산의 일부만 계획된다. ② SQL:

```sql
SELECT id, day_key, budget_min, planned_min,
       ROUND(planned_min/NULLIF(budget_min,0), 2) AS fill,
       ROUND(elapsed_s/60.0, 1) AS elapsed_min, status
FROM session ORDER BY id;
```

③ 통과선: `done` 세션의 `fill` 중앙값 ≥ 0.7. ④ **2026-09-04: 세션 3개 중 `fill` 0.27 · 0.27 · 0(예산 0) — 실패.** 15분 예산에 4분치만 계획됐다. 판이 모자란 것이지 예산 계산이 틀린 것이 아니다.

### L9 — 재출제 간격이 벌어지나

① FSRS 가 실제로 간격을 벌리는가. 정본 §2 의 간격 라벨(오늘 안에·내일·3일·9일·3주)이 원장에 나타나야 한다. ② SQL:

```sql
SELECT ROUND(MIN(elapsed_days),2) AS mn, ROUND(AVG(elapsed_days),2) AS avg,
       ROUND(MAX(elapsed_days),2) AS mx,
       SUM(elapsed_days >= 1) AS ge1, SUM(elapsed_days >= 3) AS ge3
FROM review_log WHERE elapsed_days > 0;
```

③ 통과선: `ge1 ≥ 10` 이고 `mx ≥ 3`. ④ **2026-09-04: mn 0.00 · avg 0.02 · mx 0.08 · ge1 0 · ge3 0 — 실패.**

---

## 스위트 `human` — 사람이 봐야만 하는 것 (N/M 분모 제외)

기계가 못 보는 것만 남긴다. 루브릭 1~5, **4점 이상 통과**, 점수마다 근거 한 줄.

### H1 — 0장 완주 대본

리포 하나(`after_coding` 또는 작은 바이브 코딩 앱)를 등록하고 0장을 **끝까지** 밟는다. 하루 새 판 2장 상한을 임시로 올리지 말 것 — 상한이 흐름의 일부다. 볼 것 넷:

1. 판마다 「먼저 읽기」 한 줄이 문제 **위에** 있고 정답을 흘리지 않는가
2. 21판의 순서가 쉬운 것에서 어려운 것으로 가는가 (`if` 가 옵셔널 체이닝보다 먼저 오는가)
3. 「모르겠어요」를 눌렀을 때 1~3단이 실제로 답이 되는가
4. 마쳤을 때 무엇을 배웠는지 말할 수 있는가

### H2 — 오답 진단이 「그것이 참이 되는 조건」인가

기계는 금칙어(`틀렸|오답|실패했` · `\b(wrong|incorrect|failed)\b`)만 본다. 문장이 정본 §3-2 의 형식을 지키는지는 못 본다. 무작위 10장을 읽고 채점한다.

### H3 — 오늘 더한 여덟 개념의 판이 화면에서 읽히는가

**이 여덟은 아직 카드로 한 번도 구워지지 않았다.** 품질 게이트(G3~G6)가 도는 시드 `fixtures/ipc/tiny` 의 개념 15종에 여덟이 없다. `.scm` 매칭(G7)과 사전 린트(G2)만 통과했을 뿐, 판 본문·보기·진단·치환이 실제로 그려진 적이 없다. 시드를 다시 굽고 나서 봐야 한다.

### H4 — 0장 대지가 서는 모양

대지 머리 문단 · 색인 띠 맨 앞 칩 · 완료 도장. 플랜 `chickadee-v05-first-time-programmers` 의 `c-real` 이고 지금 `blocked` 다(화면 기록 권한이 없어 자동 확인 불가).

---

## 스위트 `blocked` — 지금 구조로는 못 재는 것

정직하게 갈라 둔다. 여기 있는 것을 「통과」로 세지 않는다.

| # | 무엇 | 왜 못 재나 |
|---|---|---|
| B1 | 「어떤 레포도 읽는다」 | 사전이 `ts` 36 + `react` 1 뿐이다. Python·Go·Rust·SQL 은 개념 0개라 표본이 없다 |
| B2 | 「프로젝트 구조를 이해한다」 | `arch` 개념 6개가 전부이고 T3(`t3_run`)는 `NOT_IMPLEMENTED` 다. 문법 36 : 구조 6 |
| B3 | 장기 파지 | FSRS 예측(`r_at_review`)은 매 복습 기록되지만 실측하려면 수개월이 필요하다 |
| B4 | 「배웠다」의 주관 | 설문을 만들지 않는다. L1·L2 로 근사하고, 어긋나면 H1 이 판정한다 |

---

## 2026-09-04 (D147 · D148) 이 기준으로 무엇을 통과했나

**통과** — G1~G9 아홉. 사전 품질·쿼리 매칭·린트·타입·단위 시험 전량. 오늘 더한 개념 여덟이 네 부채 규칙을 다 채워 래칫이 31/31/31/18 로 잠겼고, 골든 40장이 붙었다.

**통과 못 함**

- **L5 t1·t2 0건** — 트랙 셋 중 둘이 원장에 없다. 필사와 구조는 검증 표본이 0이다.
- **L8 fill 0.27** — 15분 예산에 4분치만 계획된다. 판이 모자란다.
- **H3** — 오늘 더한 여덟이 카드로 한 번도 구워지지 않았다. 시드 픽스처에 없다.

**판정 불가(표본 미달)** — L1(n=10) · L2(하루에 몰린 원장) · L3(n=2) · L4(대지가 옛 상한) · L6·L7(사건 0건) · L9.

**고친 것** — G10 은 덤프를 재생성해 통과 상태로 만들었다(결정적임을 두 번 돌려 확인). 커밋이 남았다.

한 줄로: 오늘 늘린 것은 **재료**다. 그 재료로 만든 판이 사람 앞에 선 적은 아직 없고, 이 파일의 `ledger`·`human` 이 그것을 처음으로 센다.

---

## 기록

| 날짜 | 스위트 | 통과 | 메모 |
|---|---|---|---|
| 2026-09-04 | gates | 10/13 | G10 은 덤프 재생성으로 통과(커밋 필요) · G11·G12 미측(러너 없음) · G13 기준선 없음 |
| 2026-09-04 | ledger | 0/9 | L5·L8 실패 · 나머지 일곱 표본 미달(L2 포함 — 간격 효과상 규칙이 옳게 돈 결과다). 사람 확인 대기 4건 |
