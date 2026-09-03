import { afterEach, describe, expect, it } from 'vitest';

import { ko } from './ko.js';
import { detectLocale } from './locale.js';
import { getLocale, setLocale, t, template } from './t.js';

afterEach(() => setLocale('ko'));

describe('t()', () => {
  it('기본 로케일은 ko 다', () => {
    expect(getLocale()).toBe('ko');
    expect(t('firstRun.pick')).toBe('리포 등록');
  });

  it('en 은 en 카탈로그를 쓴다', () => {
    setLocale('en');
    expect(t('firstRun.pick')).toBe('Add a repo');
  });

  it('en 에 없는 키는 ko 로 폴백한다', () => {
    setLocale('en');
    // 언어 이름은 일부러 en 카탈로그에서 비워 둔 자리다 — 그 언어로 적는다.
    expect(t('locale.ko')).toBe('한국어');
    expect(t('locale.en')).toBe('English');
    expect(template('locale.ko')).toBe(ko['locale.ko']);
  });

  it('변수 없는 문구는 원문 그대로다 — 템플릿이 값을 건드리지 않는다', () => {
    expect(t('settings.look.localeNote')).toBe(ko['settings.look.localeNote']);
  });
});

describe('detectLocale()', () => {
  it('navigator 가 없으면 ko', () => {
    // 이 테스트는 `environment: node` 에서 돈다 (vitest.config.ts).
    if (typeof navigator === 'undefined') expect(detectLocale()).toBe('ko');
    else expect(['ko', 'en']).toContain(detectLocale());
  });
});
