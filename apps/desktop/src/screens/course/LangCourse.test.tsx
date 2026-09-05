// @vitest-environment jsdom
import { t } from '@chickadee/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { LangCourse, langName, partId, partOfId } from './LangCourse.js';
import { LangPartPanel, plateStatus } from './LangPartPanel.js';
import type { LangCourseData, LangPlateView } from './lang-data.js';

afterEach(cleanup);

const plate = (over: Partial<LangPlateView> & { conceptId: string }): LangPlateView => ({
  name: over.conceptId, part: 0, siteId: null, previewSiteId: null, absent: null, layer: 0, ...over,
});

const data = (over: Partial<LangCourseData> = {}): LangCourseData => ({
  lang: 'java',
  auto: true,
  hasFiles: true,
  options: [
    { lang: 'py', concepts: 24, authored: true, files: 0 },
    { lang: 'java', concepts: 43, authored: true, files: 99 },
    { lang: 'rs', concepts: 0, authored: false, files: 280 },
  ],
  parts: [
    { part: 0, folded: false, plates: [plate({ conceptId: 'java/value-bits', name: '값의 비트', absent: 'scale' })] },
    { part: 1, folded: true, plates: [plate({ conceptId: 'java/if-statement', name: '조건문', siteId: 3, layer: 2 })] },
    { part: 2, folded: false, plates: [] },
    { part: 3, folded: false, plates: [] },
  ],
  ...over,
});

describe('부의 선택값 (D190)', () => {
  test('음수 한 칸을 쓰고 챕터·졸업과 겹치지 않는다', () => {
    expect(partOfId(partId(0))).toBe(0);
    expect(partOfId(partId(3))).toBe(3);
    expect(partOfId(-1)).toBeNull();
    expect(partOfId(7)).toBeNull();
    expect(partOfId(null)).toBeNull();
  });

  test('언어 이름은 카탈로그에서, 모르는 글자는 그대로', () => {
    expect(langName('rs')).toBe(t('chapter.langName.rs'));
    expect(langName('zig')).toBe('zig');
  });
});

describe('언어 코스 목차', () => {
  test('열 언어가 전부 보이고, 저작 전 언어는 「저작 전」이라고 적는다', () => {
    render(<LangCourse data={data()} selected={null} busy={false} onPickLang={vi.fn()} onSelect={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: t('chapter.langPick') });
    const labels = [...select.querySelectorAll('option')].map((o) => o.textContent);
    expect(labels[0]).toBe(t('chapter.langAuto', { lang: t('chapter.langName.java') }));
    expect(labels).toContain(t('chapter.langOptUnauthored', { name: t('chapter.langName.rs') }));
    expect(labels).toContain(t('chapter.langOpt', { name: t('chapter.langName.java'), n: '43', files: '99' }));
  });

  test('고르면 그 언어로, 첫 줄로 되돌리면 null 로 부른다', () => {
    const onPickLang = vi.fn();
    render(<LangCourse data={data()} selected={null} busy={false} onPickLang={onPickLang} onSelect={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: t('chapter.langPick') });
    fireEvent.change(select, { target: { value: 'py' } });
    expect(onPickLang).toHaveBeenCalledWith('py');
    fireEvent.change(select, { target: { value: '' } });
    expect(onPickLang).toHaveBeenCalledWith(null);
  });

  test('부 줄은 판 수·접힘을 적고, 누르면 부의 선택값으로 부른다', () => {
    const onSelect = vi.fn();
    render(<LangCourse data={data()} selected={partId(0)} busy={false} onPickLang={vi.fn()} onSelect={onSelect} />);
    expect(screen.getByText(t('chapter.partCount', { n: '1' }))).toBeTruthy();
    expect(screen.getByText(t('chapter.partFolded'))).toBeTruthy();
    fireEvent.click(screen.getByText(t('chapter.part1')));
    expect(onSelect).toHaveBeenCalledWith(partId(1));
    expect(screen.getByRole('button', { name: new RegExp(t('chapter.part0')) }).getAttribute('aria-current')).toBe('true');
  });

  test('파일이 없는 언어는 그 사실을 말한다 — 코스는 그대로 선다 (D186 ④)', () => {
    render(<LangCourse data={data({ hasFiles: false })} selected={null} busy={false} onPickLang={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByText(t('chapter.langNoFiles', { name: t('chapter.langName.java') }))).toBeTruthy();
    expect(screen.getByText(t('chapter.part0'))).toBeTruthy();
  });

  test('저작 전 언어를 골랐으면 「사전이 없다」고 말하고 부 줄은 없다', () => {
    render(
      <LangCourse
        data={data({ lang: 'rs', auto: false, parts: [] })}
        selected={null}
        busy={false}
        onPickLang={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(t('chapter.langUnauthored', { name: t('chapter.langName.rs') }))).toBeTruthy();
    expect(screen.queryByText(t('chapter.part0'))).toBeNull();
  });
});

describe('부 패널', () => {
  test('판마다 출처를 적는다 — 내 코드 · 곧 내 코드에서 · 네 코드엔 없다와 사유', () => {
    expect(plateStatus(plate({ conceptId: 'a', siteId: 1 }))).toBe(t('chapter.plateMine'));
    expect(plateStatus(plate({ conceptId: 'a', previewSiteId: 1 }))).toBe(t('chapter.platePreview'));
    expect(plateStatus(plate({ conceptId: 'a', absent: 'no-files' })))
      .toBe(`${t('chapter.plateAbsent')} · ${t('chapter.absentNoFiles')}`);
  });

  test('셈과 단추 — 「이 판 풀기」가 그 판으로 부른다', () => {
    const onOpen = vi.fn();
    const part = data().parts[1];
    if (part === undefined) throw new Error('fixture');
    render(<LangPartPanel part={part} busy={false} onOpen={onOpen} />);
    expect(screen.getByText(t('chapter.partTally', { total: '1', mine: '1', synthetic: '0', absent: '0' }))).toBeTruthy();
    expect(screen.getByText(t('chapter.partFoldedNote'))).toBeTruthy();
    expect(screen.getByText(new RegExp(t('chapter.plateLayer', { n: '2' })))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('chapter.plateOpen') }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ conceptId: 'java/if-statement' }));
  });

  test('판이 없는 부는 그 이유를 적는다', () => {
    const part = data().parts[2];
    if (part === undefined) throw new Error('fixture');
    render(<LangPartPanel part={part} busy={false} onOpen={vi.fn()} />);
    expect(screen.getByText(t('chapter.partNoPlates'))).toBeTruthy();
  });
});
