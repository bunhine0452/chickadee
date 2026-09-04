// @vitest-environment jsdom
/**
 * 서가 화면 (D119). 데이터 층은 `data.ts` 가 들고 있으므로 여기서는 **화면이 무엇을 하는지**만
 * 본다: 세 상태를 배지로 갈라 그리는가, 삭제가 두 단을 거치는가, `missing` 에서 위치를 다시
 * 잡을 문이 열리는가.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RepoCard } from './data.js';

let cards: RepoCard[] = [];
let gone: number[] = [];
let relocated: number[] = [];
let removed: { id: number; purge: boolean }[] = [];
let picked = 0;

vi.mock('./data.js', () => ({
  loadShelf: () => Promise.resolve(cards),
  probeMissing: () => Promise.resolve(gone),
  pickFolder: () => {
    picked += 1;
    return Promise.resolve();
  },
  relocate: (id: number) => {
    relocated.push(id);
    return Promise.resolve(true);
  },
  remove: (id: number, purge: boolean) => {
    removed.push({ id, purge });
    return Promise.resolve();
  },
}));

vi.mock('../../flow.js', () => ({
  refreshRepos: () => Promise.resolve(),
  report: () => undefined,
}));

const { ReposScreen } = await import('./ReposScreen.js');
const { useUi } = await import('../../store.js');

function card(id: number, name: string, over: Partial<RepoCard> = {}): RepoCard {
  return {
    id,
    name,
    rootPath: `/w/${name}`,
    status: 'ok',
    lastIngestAt: null,
    addedAt: id,
    concepts: 12,
    avgLayer: 2.4,
    dueN: 3,
    ...over,
  };
}

beforeEach(() => {
  cards = [];
  gone = [];
  relocated = [];
  removed = [];
  picked = 0;
  useUi.setState({ activeId: 1, session: null, screen: 'repos', toast: undefined });
});

afterEach(cleanup);

describe('ReposScreen', () => {
  it('리포가 0개면 빈 상태 한 문단만 낸다', async () => {
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByText(/등록된 리포가 없습니다/)).toBeTruthy());
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('세 상태를 배지로 가른다 — 폴더 확인은 그린 뒤에 온다', async () => {
    cards = [card(1, 'alpha'), card(2, 'beta'), card(3, 'gamma', { status: 'detached' })];
    gone = [2];
    render(<ReposScreen onBack={() => undefined} />);

    // 먼저 원장이 아는 것만으로 그린다 — 이때 beta 는 아직 `ok` 다.
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
    // 폴더를 열어 본 뒤에야 `missing` 이 된다.
    await waitFor(() => expect(screen.getByText('폴더 없음')).toBeTruthy());
    expect(screen.getByText('목록에서 뺌')).toBeTruthy();
    expect(screen.getAllByText('읽을 수 있음')).toHaveLength(1);
    expect(screen.getByText(/이 경로에 폴더가 없습니다/)).toBeTruthy();
  });

  it('숫자 넉 칸과 경로를 적는다', async () => {
    cards = [card(1, 'alpha', { lastIngestAt: null, concepts: 21, avgLayer: 2.35, dueN: 4 })];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByText('/w/alpha')).toBeTruthy());
    expect(screen.getByText('21')).toBeTruthy();
    expect(screen.getByText('2.4')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('아직 없음')).toBeTruthy();
  });

  it('보고 있는 리포는 열기가 잠겨 있고 「보는 중」이 붙는다', async () => {
    cards = [card(1, 'alpha'), card(2, 'beta')];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByText('보는 중')).toBeTruthy());
    expect(screen.getByRole('button', { name: '「alpha」 리포 열기' }).hasAttribute('disabled'))
      .toBe(true);
    expect(screen.getByRole('button', { name: '「beta」 리포 열기' }).hasAttribute('disabled'))
      .toBe(false);
  });

  it('다른 리포를 열면 activeId 가 바뀌고 홈이 비워진다', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    cards = [card(1, 'alpha'), card(2, 'beta')];
    useUi.setState({ home: { sheets: [] } as never });
    render(<ReposScreen onBack={onBack} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    await user.click(screen.getByRole('button', { name: '「beta」 리포 열기' }));
    expect(useUi.getState().activeId).toBe(2);
    // 홈을 비워 다시 읽게 한다 — 화면 상태는 파생 캐시다.
    expect(useUi.getState().home).toBeNull();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // ───────── 삭제 2단 ─────────

  it('「전부 지우기」는 한 번 더 묻고, 그 문구가 카드는 은퇴만 된다고 말한다', async () => {
    const user = userEvent.setup();
    cards = [card(1, 'alpha')];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: '전부 지우기' }));
    // 첫 단에서는 아무것도 지우지 않는다.
    expect(removed).toEqual([]);
    expect(screen.getByText(/카드는 지우지 않고 은퇴시킵니다/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '지웁니다' }));
    expect(removed).toEqual([{ id: 1, purge: true }]);
  });

  it('「목록에서 빼기」의 확인은 purge 없이 부른다', async () => {
    const user = userEvent.setup();
    cards = [card(1, 'alpha')];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: '목록에서 빼기' }));
    await user.click(screen.getByRole('button', { name: '뺍니다' }));
    expect(removed).toEqual([{ id: 1, purge: false }]);
    await waitFor(() => expect(useUi.getState().toast).toContain('목록에서 뺐습니다'));
  });

  it('「그만두기」는 아무것도 지우지 않고 확인만 닫는다', async () => {
    const user = userEvent.setup();
    cards = [card(1, 'alpha')];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: '전부 지우기' }));
    await user.click(screen.getByRole('button', { name: '그만두기' }));
    expect(removed).toEqual([]);
    expect(screen.queryByRole('button', { name: '지웁니다' })).toBeNull();
  });

  // ───────── missing 흐름 ─────────

  it('폴더가 없으면 위치를 다시 잡을 문이 열린다', async () => {
    const user = userEvent.setup();
    cards = [card(1, 'alpha')];
    gone = [1];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByText('폴더 없음')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: '위치 알려주기' }));
    expect(relocated).toEqual([1]);
  });

  it('폴더가 멀쩡하면 「위치 알려주기」가 없다', async () => {
    cards = [card(1, 'alpha')];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
    expect(screen.queryByRole('button', { name: '위치 알려주기' })).toBeNull();
  });

  it('「리포 추가」가 폴더 대화상자를 연다 — 둘째 리포로 들어오는 문이다', async () => {
    const user = userEvent.setup();
    cards = [card(1, 'alpha')];
    render(<ReposScreen onBack={() => undefined} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: '리포 추가' }));
    expect(picked).toBe(1);
  });
});
