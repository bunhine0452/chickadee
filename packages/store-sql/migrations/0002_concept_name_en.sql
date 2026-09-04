-- 0002_concept_name_en.sql — user_version = 2
-- 정본: docs/00-overview.md §4 D118 (사전도 이중 언어) · docs/02 §2.2 (원장은 추가만).
-- 러너(crates/store)가 파일 하나를 한 트랜잭션으로 적용하고 user_version 을 직접 세운다.

PRAGMA user_version = 2;

-- 개념 이름의 영어. `name_ko` 는 **개명하지 않는다** — 02 §2.2 가 원장에 열 추가만 허용하고,
-- 학습 기록이 `concept.id` 로 이 표를 참조한다. 열을 하나 더하는 쪽이 유일한 길이다.
--
-- NULL 을 허용하는 이유: 이행 시점의 기존 행에는 채울 값이 없다. 다음 인제스트가
-- `derive.concept_upsert` 로 사전의 `name.en` 을 실어 채운다 (03 §4.4).
ALTER TABLE concept ADD COLUMN name_en TEXT;
