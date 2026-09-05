/**
 * `diagram.*` 카탈로그와 그림의 폴백이 어긋나지 않는 것 (D187 ⑳).
 *
 * 두 곳에 한국어가 있다 — `packages/i18n` 의 카탈로그(정본)와 `DIAGRAM_LABELS_KO`(폴백).
 * 어긋나면 화면과 단위 시험이 다른 낱말을 쓰고, 그 어긋남은 아무 데서도 안 빨개진다.
 */
import { setLocale } from '@chickadee/i18n';
import { afterEach, describe, expect, it } from 'vitest';

import { diagramLabels } from './i18n';
import { DIAGRAM_LABELS_KO } from './labels';

afterEach(() => setLocale('ko'));

describe('diagram.* 키 (D187 ⑳)', () => {
  it('한국어 카탈로그가 폴백과 글자 단위로 같다', () => {
    setLocale('ko');
    expect(diagramLabels()).toEqual(DIAGRAM_LABELS_KO);
  });

  it('영어 카탈로그가 낱말 전부를 덮는다 — 한 낱말도 한국어로 새지 않는다', () => {
    setLocale('en');
    const en = diagramLabels();
    const leaked = Object.entries(en).filter(([, v]) => /[가-힣]/.test(v));
    expect(leaked).toEqual([]);
  });

  it('키 수가 그림이 쓰는 낱말 수와 같다 — 안 쓰는 키를 늘리지 않는다', () => {
    expect(Object.keys(DIAGRAM_LABELS_KO)).toHaveLength(49);
  });
});
