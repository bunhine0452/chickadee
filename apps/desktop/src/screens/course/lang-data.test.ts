/**
 * 언어 코스의 순수 부분 (D190). **진짜 번들 사전에 대고 돈다** — 부 배치와 사유 표가 사전과
 * 어긋나지 않는다는 것이 이 기능의 주장이라 모형으로 재면 그 주장을 검사하지 않는 것이 된다.
 */
import { loadDict } from '@chickadee/dictionary';
import { describe, expect, test } from 'vitest';

import { extToLang, mainLang, partViews, repoLangCounts } from './lang-data.js';

const dict = loadDict({
  manifests: { 'build.gradle': "implementation 'org.springframework.boot:spring-boot-starter-web'" },
});

describe('리포의 언어', () => {
  test('확장자 표는 _lang.yaml 에서 온다 — .py 와 .java 가 각자의 네임스페이스로', () => {
    const ext = extToLang(dict);
    expect(ext.get('.py')).toBe('py');
    expect(ext.get('.java')).toBe('java');
    expect(ext.get('.ts')).toBe('ts');
  });

  test('파일을 언어별로 세고, 표에 없는 확장자는 안 센다', () => {
    const counts = repoLangCounts(dict, ['a.py', 'b/c.py', 'd.java', 'README.md', 'noext']);
    expect(counts.get('py')).toBe(2);
    expect(counts.get('java')).toBe(1);
    expect(counts.has('md')).toBe(false);
  });

  test('주 언어는 파일이 가장 많은 코스 언어 — 없으면 null, 동점은 채택 순서', () => {
    expect(mainLang(new Map())).toBeNull();
    expect(mainLang(new Map([['java', 3], ['py', 2]]))).toBe('java');
    expect(mainLang(new Map([['ts', 1], ['py', 1]]))).toBe('py');
    // 곁문법은 코스가 없다 — 파일이 아무리 많아도 주 언어가 못 된다.
    expect(mainLang(new Map([['css', 900]]))).toBeNull();
  });
});

describe('부 넷 (D177 · D190)', () => {
  const base = {
    dict,
    lang: 'java',
    bestSiteOf: () => null,
    layerOf: () => 0,
    declaredNewcomer: false,
  };

  test('파일이 없으면 판은 전부 「네 코드엔 없다 · no-files」 — 코스는 막히지 않는다', () => {
    const parts = partViews({ ...base, hasFiles: false });
    expect(parts.map((p) => p.part)).toEqual([0, 1, 2, 3]);
    const plates = parts.flatMap((p) => p.plates);
    expect(plates.length).toBeGreaterThan(30);
    expect(plates.every((p) => p.siteId === null && p.absent === 'no-files')).toBe(true);
    // 이름은 사전에서 온다 — id 가 그대로 화면에 나오지 않는다.
    expect(plates.every((p) => p.name !== p.conceptId)).toBe(true);
  });

  test('파일이 있으면 사유는 개념의 것 — 표에 없는 개념은 말없이 빠진다 (D137 의 규칙)', () => {
    const parts = partViews({ ...base, hasFiles: true });
    const plates = parts.flatMap((p) => p.plates);
    expect(plates.length).toBeGreaterThan(0);
    expect(plates.every((p) => p.absent !== null && p.absent !== 'no-files')).toBe(true);
    expect(plates.map((p) => p.conceptId)).toContain('java/for-loop');
  });

  test('내 코드의 자리가 있으면 그 자리, 미지가 많으면 합성 + 예고', () => {
    const parts = partViews({
      ...base,
      hasFiles: true,
      bestSiteOf: (id) => (id === 'java/if-statement' ? { siteId: 7, unknown: 0 }
        : id === 'java/array' ? { siteId: 8, unknown: 9 } : null),
    });
    const plates = new Map(parts.flatMap((p) => p.plates).map((p) => [p.conceptId, p]));
    expect(plates.get('java/if-statement')).toMatchObject({ siteId: 7, previewSiteId: null, absent: null });
    expect(plates.get('java/array')).toMatchObject({ siteId: null, previewSiteId: 8, absent: null });
  });

  test('1부는 전부 1겹 이상이면 접힌다 — 처음이라고 답한 사람은 안 접는다', () => {
    const known = partViews({ ...base, hasFiles: false, layerOf: () => 1 });
    expect(known.find((p) => p.part === 1)?.folded).toBe(true);
    expect(known.find((p) => p.part === 0)?.folded).toBe(false);
    const newcomer = partViews({ ...base, hasFiles: false, layerOf: () => 1, declaredNewcomer: true });
    expect(newcomer.find((p) => p.part === 1)?.folded).toBe(false);
  });

  test('코스 언어가 아니면 부가 비어 있다 — 거짓 코스를 세우지 않는다', () => {
    // 열 언어가 전부 저작된 뒤로 「저작 전」 표본은 없다 — 곁문법과 모르는 글자로 잰다.
    expect(partViews({ ...base, lang: 'css', hasFiles: false })).toEqual([]);
    expect(partViews({ ...base, lang: 'dart', hasFiles: false })).toEqual([]);
  });
});
