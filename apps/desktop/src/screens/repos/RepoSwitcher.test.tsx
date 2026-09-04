// @vitest-environment jsdom
/**
 * 마스트헤드의 리포 스위처 (05 §2.4 · D119). 05 §2.4 가 모양까지 정해 뒀으므로
 * `button[aria-haspopup=listbox]` + `ul[role=listbox]` 를 그대로 확인한다.
 *
 * 마우스는 마지막 한 자리에서만 쓴다 — 이 목록은 **키보드만으로** 끝나야 한다 (06 §2).
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { RepoInfo } from '@chickadee/store-sql';

import { RepoSwitcher } from './RepoSwitcher.js';
import { useUi } from '../../store.js';

const repo = (id: number, name: string): RepoInfo => ({
  id,
  rootPath: `/w/${name}`,
  name,
  defaultBranch: null,
  headSha: null,
  primaryLang: null,
  fingerprint: 'f',
  status: 'ok',
  addedAt: id,
  lastIngestAt: null,
});

beforeEach(() => {
  useUi.setState({
    repos: [repo(1, 'alpha'), repo(2, 'beta'), repo(3, 'gamma')],
    activeId: 1,
    home: null,
    session: null,
    screen: 'home',
    toast: undefined,
  });
});

afterEach(cleanup);

/** 칸의 이름은 「리포」(칸 이름) + 지금 리포다 — 목록을 열기 전에도 무엇을 보고 있는지 읽힌다. */
const trigger = (): HTMLElement => screen.getByRole('button', { name: /alpha/ });

describe('RepoSwitcher', () => {
  it('05 §2.4 그대로 button[aria-haspopup=listbox] 다', () => {
    render(<RepoSwitcher repoName="alpha" />);
    const button = trigger();
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('열면 리포 전부와 마지막 줄의 「전부 보기」가 선다', async () => {
    const user = userEvent.setup();
    render(<RepoSwitcher repoName="alpha" />);
    await user.click(trigger());

    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['alpha', 'beta', 'gamma', '전부 보기']);
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('방향키로 내려가 Enter 로 고르면 리포가 바뀌고 홈이 비워진다', async () => {
    const user = userEvent.setup();
    render(<RepoSwitcher repoName="alpha" />);
    useUi.setState({ home: { sheets: [] } as never });

    trigger().focus();
    await user.keyboard('{Enter}');
    const list = screen.getByRole('listbox');
    // 열자마자 지금 리포를 짚는다 — 「어디서 시작하는지」가 보이지 않으면 방향키를 셀 수 없다.
    expect(list.getAttribute('aria-activedescendant')).toBe('repo-opt-1');

    await user.keyboard('{ArrowDown}{Enter}');
    expect(useUi.getState().activeId).toBe(2);
    expect(useUi.getState().home).toBeNull();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('마지막 줄에서 한 번 더 내려가면 처음으로 돈다', async () => {
    const user = userEvent.setup();
    render(<RepoSwitcher repoName="alpha" />);
    trigger().focus();
    await user.keyboard('{Enter}{End}{ArrowDown}');
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toBe('repo-opt-1');
  });

  it('「전부 보기」는 서가를 연다', async () => {
    const user = userEvent.setup();
    render(<RepoSwitcher repoName="alpha" />);
    trigger().focus();
    await user.keyboard('{Enter}{End}{Enter}');
    expect(useUi.getState().screen).toBe('repos');
    expect(useUi.getState().activeId).toBe(1);
  });

  it('Esc 는 목록만 닫고 포커스를 칸으로 돌려준다', async () => {
    const user = userEvent.setup();
    render(<RepoSwitcher repoName="alpha" />);
    trigger().focus();
    await user.keyboard('{Enter}{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(useUi.getState().activeId).toBe(1);
    expect(document.activeElement).toBe(trigger());
  });

  it('세션 중에는 비활성이다 — 작업 띠에는 리포명만 (05 §2.4)', () => {
    useUi.setState({ session: { id: 1 } as never });
    render(<RepoSwitcher repoName="alpha" />);
    expect(trigger().hasAttribute('disabled')).toBe(true);
  });

  it('마우스로도 고를 수 있다', async () => {
    const user = userEvent.setup();
    render(<RepoSwitcher repoName="alpha" />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'gamma' }));
    expect(useUi.getState().activeId).toBe(3);
  });
});
