/**
 * 언어별 부 배치의 등록부 (D190) — 사용자가 **언어를 고르면** 그 언어의 0·1·2·3부가 선다.
 *
 * `JAVA_PARTS`(D177) 하나뿐이던 것을 열로 늘렸다. 목록의 순서는 `docs/curriculum/README.md` §1
 * 의 채택 순서(TIOBE 2026-08)이고, 화면의 선택지가 이 순서를 쓴다. 언어를 더하는 일은
 * `./<lang>.ts` 한 장과 이 표의 한 줄이다 — 다른 코드는 안 바뀐다.
 *
 * **부 목록은 `_lang.yaml` 의 `essential` 과 한 글자도 어긋나면 안 된다.** 0·1·2부를 이으면
 * `essential` 전량이고 순서도 같다 — `./index.test.ts` 가 열 언어 전부에 그것을 대조한다.
 * 3부는 프레임워크 사전(`spring/` 등)의 전량이고, 없는 언어는 빈 목록이다.
 */
import type { PartAssignment } from '../curriculum.js';
import { C_PARTS } from './c.js';
import { CPP_PARTS } from './cpp.js';
import { CSHARP_PARTS } from './csharp.js';
import { GO_PARTS } from './go.js';
import { JAVA_PARTS } from './java.js';
import { PY_PARTS } from './py.js';
import { RS_PARTS } from './rs.js';
import { SQL_PARTS } from './sql.js';
import { SWIFT_PARTS } from './swift.js';
import { TS_PARTS } from './ts.js';

/** 코스를 열 수 있는 언어 열 — 사전 네임스페이스와 같은 글자다 (D156 · README §1). */
export const COURSE_LANGS = [
  'py', 'c', 'cpp', 'java', 'csharp', 'ts', 'sql', 'rs', 'go', 'swift',
] as const;

export type CourseLang = (typeof COURSE_LANGS)[number];

export const PARTS_BY_LANG: Readonly<Record<CourseLang, readonly PartAssignment[]>> = {
  py: PY_PARTS,
  c: C_PARTS,
  cpp: CPP_PARTS,
  java: JAVA_PARTS,
  csharp: CSHARP_PARTS,
  ts: TS_PARTS,
  sql: SQL_PARTS,
  rs: RS_PARTS,
  go: GO_PARTS,
  swift: SWIFT_PARTS,
};

export const isCourseLang = (lang: string): lang is CourseLang =>
  (COURSE_LANGS as readonly string[]).includes(lang);

/** 그 언어의 부 배치. 코스가 없는 언어(`css`·`xml` 같은 곁문법)는 `null`. */
export const partsOf = (lang: string): readonly PartAssignment[] | null =>
  isCourseLang(lang) ? PARTS_BY_LANG[lang] : null;

/** 부 배치에 개념이 하나라도 실렸나 — 「저작 전」과 「저작됨」을 가르는 선. */
export const hasParts = (lang: string): boolean =>
  (partsOf(lang) ?? []).some((p) => p.concepts.length > 0);
