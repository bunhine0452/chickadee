-- 0006_site_window_unknown.sql — user_version = 6
-- 첫 노출을 「보이는 창」으로 고른다 (D155).
--
-- `unknown_count` 는 **초점 줄**의 미지 개념 수인데, 판에 찍히는 것은 줄이 아니라 창이다
-- (D141 — 감싸는 블록 ∪ 초점 ±2, 상한 40줄). 창에는 순위 규칙이 없어서 동점이 경로
-- 알파벳순으로 끊겼고, 그래서 가장 큰 파일이 늘 이겼다.
--
-- 실측(PySpace · 파일 5장 · `App.tsx` 1,747줄): `ts/number-literal` 사용처 261곳 중
-- 미지 0 인 다섯이 동점이 되고 `src/App.tsx` < `src/components/TerminalView.tsx` 라
-- `function Spark({ data, w = 56, h = 16 }: { data: number[]; w?: number; h?: number })`
-- 의 `56` 이 「숫자」의 첫 판으로 나갔다. `const MIN_FONT = 9;` 가 후보에 있었다.

PRAGMA user_version = 6;

-- 파생 캐시다. `unknown_count` 와 같은 패스(`recountUnknown`)가 채우므로 기본값 0 으로
-- 들어와도 다음 인제스트나 세션 뒤에 제 값이 된다. 그때까지는 지금과 같은 순서다.
ALTER TABLE concept_site ADD COLUMN window_unknown INTEGER NOT NULL DEFAULT 0;

-- 정렬의 둘째 키다. 인덱스 꼬리에 붙여 같은 (repo, concept) 안에서 두 키를 함께 훑는다.
DROP INDEX IF EXISTS ix_site_repo_concept;
CREATE INDEX ix_site_repo_concept
  ON concept_site(repo_id, concept_id, is_alive, unknown_count, window_unknown);

-- 살아 있는 T0 카드를 은퇴시킨다 — 0004(D141)와 같은 이유이고 같은 방법이다.
-- 고른 사용처가 바뀌므로 같은 개념의 판이 두 자리로 섞인다. 잃는 것은 없다:
-- 겹(`mastery`)은 개념에 붙어 있고 원장(`review_log`)은 그대로이며, 다음 세션이
-- 새 순위로 다시 굽는다. `content_hash` 접두어는 은퇴한 행을 `card.by_hash` 가
-- 도로 집는 것을 막는다 (0004 의 주석에 그 사고가 적혀 있다).
UPDATE card
   SET retired_at    = CAST(strftime('%s','now') AS INTEGER) * 1000,
       snapshot_json = COALESCE(snapshot_json, json_extract(payload_json, '$.lines')),
       content_hash  = 'd155:' || content_hash
 WHERE track = 't0' AND retired_at IS NULL;

-- 그리고 홈에 「재인제스트 필요」를 세운다 (06 §6.3).
--
-- 이 한 문장이 없으면 고친 것이 사용자에게 닿지 않는다: 열은 파생 캐시라 이행 직후 전부
-- 0 이고, 그 값을 채우는 것은 `recountUnknown`(인제스트 뒤 · 세션 뒤)이다. 그런데 위에서
-- T0 카드를 은퇴시켰으므로 **다음 세션이 먼저 카드를 굽는다** — 0 뿐인 열로 정렬하면 옛
-- 순서 그대로 같은 자리를 골라 굽고, 그렇게 구운 판은 은퇴 대상이 아니라 눌러앉는다.
-- 재인제스트는 `recountUnknown` 을 굽기 **전에** 돌리므로 순서가 바로 선다.
--
-- 지문을 지우지 않고 **비켜 세운다**: `needsReingest` 는 빈 지문을 「비교할 것이 없음」으로
-- 읽어 배너를 내지 않는다(06 §6.3). 달라야 배너가 선다.
UPDATE ingest_run
   SET fingerprint = 'd155:' || fingerprint
 WHERE fingerprint IS NOT NULL AND fingerprint <> '';
