-- 0004_t0_block_window.sql — user_version = 4
-- T0 카드 은퇴 (D141). 판에 보이는 코드 창이 「초점 ±2」에서 「초점을 감싸는 블록」으로
-- 바뀌었다. `content_hash` 는 payload 전체의 해시라(`packages/cards/src/payload.ts`
-- `finish()`) 창이 바뀌면 같은 사용처의 카드도 다른 카드가 된다.
--
-- 왜 은퇴시키나: 같은 개념의 판이 두 창으로 섞이면 어느 쪽이 정본인지 알 수 없다.
-- 잃는 것은 없다 — **겹(`mastery`)은 개념에 붙어 있고 원장(`review_log`)은 그대로다.**
-- 다음 세션이 같은 사용처에서 새 창으로 다시 굽는다(`queue.pick_card` 가 비면
-- `makeCard` 가 돈다). 재인제스트 안내 문구가 이미 그렇게 말하고 있다.
--
-- 표를 만들지도 지우지도 않고 **행 수도 그대로다** — `card` 세 열을 UPDATE 하는 것이
-- 전부다. 02 §2.2 「원장은 추가만」을 지킨다.

PRAGMA user_version = 4;

-- 세 열을 한 번에 바꾼다.
--
-- `snapshot_json` — 그 판이 보여 주던 코드 줄을 남긴다. 스키마 주석이 그 열을
--   「은퇴 시 채움: 코드 줄 스냅샷」이라고 적어 두었고, 새 창이 옛 판을 덮고 나면 옛 판이
--   무엇을 보여 줬는지는 여기 말고 남는 데가 없다.
--
-- `content_hash` — 접두어를 붙여 해시 공간에서 비켜 세운다. 이것이 없으면 조용히
--   망가지는 자리가 있다: 창이 넓어져도 **감싸는 블록을 못 찾은** 사용처는 초점 ±2
--   폴백이라 새 카드의 해시가 옛 카드와 같다. 그런데 `card.insert` 는
--   `ON CONFLICT (repo_id, content_hash) DO NOTHING` 이라 새 행이 안 들어가고, 부르는
--   쪽은 `card.by_hash` 로 **은퇴한 행**을 도로 집는다. 그러면 그 개념은 매 세션 다시
--   구워지면서도 `retired_at` 이 박힌 채라 홈의 `has_card`(`retired_at IS NULL`)에서는
--   영영 「판 없음」으로 보인다. 은퇴한 카드는 더 이상 중복 방지의 대상이 아니다 —
--   지우지 못하는 이유는 오직 `review_log.card_id` 가 NOT NULL 이라서다 (D31).
--
-- 다시 적용해도 같은 결과다: 이 문장이 끝나면 살아 있는 T0 카드가 없다.
UPDATE card
   SET retired_at    = CAST(strftime('%s','now') AS INTEGER) * 1000,
       snapshot_json = COALESCE(snapshot_json, json_extract(payload_json, '$.lines')),
       content_hash  = 'd141:' || content_hash
 WHERE track = 't0' AND retired_at IS NULL;
