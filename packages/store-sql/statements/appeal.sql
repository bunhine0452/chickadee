-- 이의(04 §5)와 왜 게이트 답(04 §6). 둘 다 「판 완료」 tx 의 **끝**에 붙고 `review_log.id` 를
-- 부속질의로 집는다 (D84) — `last_insert_rowid()` 는 직전 INSERT 하나만 집으므로 0~n 행을
-- 쓰는 이의에는 쓸 수 없다. `session_item` 하나에 `review_log` 는 하나뿐이라 값이 유일하다.
-- 열 별칭을 붙이지 않는다 (D57).

-- 「같은 뜻인데요」 한 건. **점수는 바뀌지 않는다** — 이 행은 규칙 개선 큐다 (04 §5).
-- @name appeal.insert_for_item
-- @params { sessionItemId: number, cardId: number, track: string, lineNo: number | null, originalText: string | null, userText: string | null, normOriginal: string | null, normUser: string | null, autoVerdict: string, autoReason: string | null, reasonsJson: string | null, patternKey: string | null, engineVersion: string | null, dictVersion: string | null, createdAt: number }
-- @row void
INSERT INTO appeal (review_log_id, card_id, track, line_no, original_text, user_text,
                    norm_original, norm_user, auto_verdict, auto_reason, reasons_json,
                    pattern_key, engine_version, dict_version, status, created_at)
VALUES ((SELECT id FROM review_log WHERE session_item_id = :sessionItemId ORDER BY id DESC LIMIT 1),
        :cardId, :track, :lineNo, :originalText, :userText,
        :normOriginal, :normUser, :autoVerdict, :autoReason, :reasonsJson,
        :patternKey, :engineVersion, :dictVersion, 'open', :createdAt);

-- 「규칙 제안」은 상태가 아니라 **파생**이다 (04 §5) — 같은 `pattern_key` 의 `open` 이 3건
-- 이상이면 설정 화면에 뜬다. 문턱은 TS 가 걸고 여기서는 세어 준다.
-- @name appeal.pattern_counts
-- @params { minCount: number }
-- @row { pattern_key: string, n: number, last_at: number, auto_reason: string | null, reasons_json: string | null }
SELECT pattern_key, COUNT(*) AS n, MAX(created_at) AS last_at,
       MIN(auto_reason) AS auto_reason, MIN(reasons_json) AS reasons_json
FROM appeal
WHERE status = 'open' AND pattern_key IS NOT NULL
GROUP BY pattern_key
HAVING COUNT(*) >= :minCount
ORDER BY n DESC, last_at DESC;

-- 제안에 붙일 예시. **로컬 코드**이므로 화면 밖으로 나가지 않는다 (04 §5 · 06).
-- @name appeal.by_pattern
-- @params { patternKey: string, limit: number }
-- @row { id: number, review_log_id: number, card_id: number, track: string, line_no: number | null, original_text: string | null, user_text: string | null, norm_original: string | null, norm_user: string | null, auto_verdict: string, auto_reason: string | null, reasons_json: string | null, pattern_key: string | null, engine_version: string | null, dict_version: string | null, status: string, created_at: number, resolved_at: number | null, note: string | null }
SELECT id, review_log_id, card_id, track, line_no, original_text, user_text,
       norm_original, norm_user, auto_verdict, auto_reason, reasons_json,
       pattern_key, engine_version, dict_version, status, created_at, resolved_at, note
FROM appeal WHERE pattern_key = :patternKey ORDER BY created_at DESC LIMIT :limit;

-- 이 판에서 접수한 이의. 결과 화면을 다시 그릴 때 「이의 접수됨」을 되살린다.
-- @name appeal.for_item
-- @params { sessionItemId: number }
-- @row { id: number, line_no: number | null, auto_verdict: string, pattern_key: string | null, status: string }
SELECT a.id, a.line_no, a.auto_verdict, a.pattern_key, a.status
FROM appeal a JOIN review_log r ON r.id = a.review_log_id
WHERE r.session_item_id = :sessionItemId ORDER BY a.line_no;

-- 왜 게이트 답 한 줄 (04 §6). **채점·겹 효과 없음.**
-- @name why.insert_for_item
-- @params { sessionItemId: number, cardId: number, blockId: number | null, lineNo: number | null, questionId: string, text: string, pick: number | null, pickOk: number | null, createdAt: number }
-- @row void
INSERT INTO why_answer (review_log_id, card_id, block_id, line_no, question_id,
                        text, pick, pick_ok, created_at)
VALUES ((SELECT id FROM review_log WHERE session_item_id = :sessionItemId ORDER BY id DESC LIMIT 1),
        :cardId, :blockId, :lineNo, :questionId, :text, :pick, :pickOk, :createdAt);

-- 3단계 스펙 카드의 `mustHold(source:'user')` — 사용자가 자기 말로 쓴 문장 (04 §3.3 ①).
-- @name why.for_card
-- @params { cardId: number, limit: number }
-- @row { id: number, line_no: number | null, question_id: string, text: string, pick: number | null, pick_ok: number | null, created_at: number }
SELECT id, line_no, question_id, text, pick, pick_ok, created_at
FROM why_answer WHERE card_id = :cardId ORDER BY created_at DESC LIMIT :limit;
