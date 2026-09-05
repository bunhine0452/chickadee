/**
 * 열 언어의 부 배치가 사전과 어긋나지 않는다 (D190). **진짜 번들 사전에 대고 돈다** —
 * 이 기능의 주장이 「부 배치가 `_lang.yaml` 과 어긋나지 않는다」이므로 모형으로 재면 그 주장을
 * 검사하지 않는 것이 된다.
 */
import { loadDict } from '@chickadee/dictionary';
import { describe, expect, test } from 'vitest';

import { COURSE_LANGS, PARTS_BY_LANG, hasParts, isCourseLang, partsOf } from './index.js';

const dict = loadDict({
  manifests: { 'build.gradle': "implementation 'org.springframework.boot:spring-boot-starter-web'" },
});

describe('등록부 (D190)', () => {
  test('열 언어이고 겹치지 않는다', () => {
    expect(COURSE_LANGS).toHaveLength(10);
    expect(new Set(COURSE_LANGS).size).toBe(10);
  });

  test('곁문법에는 코스가 없다', () => {
    expect(isCourseLang('css')).toBe(false);
    expect(partsOf('xml')).toBeNull();
  });

  test('부는 언어마다 0·1·2·3 그대로다 — 연습 층은 부가 아니다 (D187 ⑧)', () => {
    for (const lang of COURSE_LANGS) {
      expect(PARTS_BY_LANG[lang].map((p) => p.part), lang).toEqual([0, 1, 2, 3]);
    }
  });
});

describe('부 배치는 사전과 어긋나지 않는다', () => {
  for (const lang of COURSE_LANGS) {
    const meta = dict.langs.get(lang);

    test(`${lang} — 사전이 있으면 부도 있다 (저작 전인 언어는 둘 다 없다)`, () => {
      expect(hasParts(lang), lang).toBe(meta !== undefined);
    });

    if (meta === undefined) continue;
    const parts = PARTS_BY_LANG[lang];

    test(`${lang} — 0·1·2부를 합치면 essential 전량이고 순서도 같다`, () => {
      const assigned = [
        ...parts[0]?.concepts ?? [],
        ...parts[1]?.concepts ?? [],
        ...parts[2]?.concepts ?? [],
      ];
      expect(assigned).toEqual([...meta.essential]);
    });

    test(`${lang} — 부 배치의 개념은 전부 사전에 있다`, () => {
      for (const part of parts) {
        for (const id of part.concepts) expect(dict.concepts.has(id), id).toBe(true);
      }
    });

    test(`${lang} — 3부는 그 언어 프레임워크 사전 전량이거나 비어 있다`, () => {
      const third = parts[3]?.concepts ?? [];
      const spaces = new Set(third.map((id) => id.split('/')[0]));
      for (const ns of spaces) {
        const all = [...dict.concepts.keys()].filter((id) => id.startsWith(`${ns}/`)).sort();
        expect(third.filter((id) => id.startsWith(`${ns}/`)).sort(), ns).toEqual(all);
      }
    });
  }
});
