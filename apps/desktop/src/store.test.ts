/**
 * 리포 슬라이스 (05 §2.4 · D119). 서가가 리포를 지우고 스위처가 리포를 바꾸는 자리라
 * 여기서 틀리면 화면이 남의 리포를 그리거나, 리포가 남았는데 첫 실행으로 떨어진다.
 */
import type { RepoInfo } from '@chickadee/store-sql';
import { TOAST_MS } from '@chickadee/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUi } from './store.js';

const repo = (id: number): RepoInfo => ({
  id,
  rootPath: `/w/r${id}`,
  name: `r${id}`,
  defaultBranch: null,
  headSha: null,
  primaryLang: null,
  fingerprint: 'f',
  status: 'ok',
  addedAt: id,
  lastIngestAt: null,
});

const HOME = { sheets: [] } as never;

beforeEach(() => {
  useUi.setState({
    repos: [repo(1), repo(2)],
    activeId: 1,
    home: HOME,
    session: null,
    screen: 'home',
  });
});

describe('setActive', () => {
  it('activeId 만 바꾸고 홈을 비운다', () => {
    expect(useUi.getState().setActive(2)).toBe(true);
    expect(useUi.getState().activeId).toBe(2);
    expect(useUi.getState().home).toBeNull();
    expect(useUi.getState().screen).toBe('home');
  });

  it('서가에서 고르면 홈으로 돌아온다', () => {
    useUi.setState({ screen: 'repos' });
    useUi.getState().setActive(2);
    expect(useUi.getState().screen).toBe('home');
  });

  it('같은 리포를 다시 고르면 아무것도 하지 않는다 — 홈을 버리지 않는다', () => {
    expect(useUi.getState().setActive(1)).toBe(false);
    expect(useUi.getState().home).toBe(HOME);
  });

  it('세션 중에는 바꾸지 않는다 (05 §2.4)', () => {
    useUi.setState({ session: { id: 7 } as never });
    expect(useUi.getState().setActive(2)).toBe(false);
    expect(useUi.getState().activeId).toBe(1);
    expect(useUi.getState().home).toBe(HOME);
  });
});

describe('setRepos', () => {
  it('보던 리포가 사라지면 첫 줄로 내려오고 홈을 비운다', () => {
    useUi.getState().setRepos([repo(2)]);
    expect(useUi.getState().activeId).toBe(2);
    expect(useUi.getState().home).toBeNull();
    // 리포가 남아 있으므로 첫 실행 화면이 아니다.
    expect(useUi.getState().screen).toBe('home');
  });

  it('보던 리포가 그대로면 홈을 버리지 않는다', () => {
    useUi.getState().setRepos([repo(1), repo(2), repo(3)]);
    expect(useUi.getState().activeId).toBe(1);
    expect(useUi.getState().home).toBe(HOME);
  });

  it('마지막 리포를 지우면 첫 실행 화면이다', () => {
    useUi.setState({ screen: 'repos' });
    useUi.getState().setRepos([]);
    expect(useUi.getState().activeId).toBeNull();
    expect(useUi.getState().screen).toBe('first-run');
  });
});

describe('토스트 (D170 ③)', () => {
  it('say() 로 띄운 문구는 TOAST_MS 뒤에 스스로 사라진다', () => {
    vi.useFakeTimers();
    try {
      useUi.getState().say('채점했습니다');
      expect(useUi.getState().toast).toBe('채점했습니다');
      vi.advanceTimersByTime(TOAST_MS - 1);
      expect(useUi.getState().toast).toBe('채점했습니다');
      vi.advanceTimersByTime(1);
      expect(useUi.getState().toast).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('연달아 부르면 마지막 문구의 시계만 남는다', () => {
    vi.useFakeTimers();
    try {
      useUi.getState().say('첫째');
      vi.advanceTimersByTime(TOAST_MS - 100);
      useUi.getState().say('둘째');
      vi.advanceTimersByTime(200);
      expect(useUi.getState().toast).toBe('둘째');
      vi.advanceTimersByTime(TOAST_MS);
      expect(useUi.getState().toast).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
