// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

// 마스트헤드가 `settings` 를 읽어 모양을 복원한다 — 홈 테스트는 그 조회만 비워 둔다.
vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: () => Promise.resolve([]),
      exec: () => Promise.resolve({ changes: 1, lastId: 0 }),
    },
  },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
}));

import type { HomeData } from './data';
const { HomeScreen } = await import('./HomeScreen.js');

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-trim');
});

const NOW = Date.UTC(2026, 8, 3, 9, 0, 0);
const DAY = 86_400_000;

/** 홈 한 화면치 픽스처. IPC 는 부르지 않는다 — 화면은 이 모양만 안다. */
const DATA: HomeData = {
  masthead: { concepts: 21, printed: 9, avgLayer: 2.4 },
  inkScale: [4, 3, 6, 5, 3],
  sheets: [
    {
      unitId: 1,
      name: '장바구니 담기 / 빼기',
      rootPath: 'src/features/cart', zero: false,
      files: 12,
      avgLayer: 3,
      state: 'done',
      nodes: [
        {
          conceptId: 'ts/use-state',
          track: 't0',
          nameKo: 'useState 초기값',
          token: null,
          layer: 4,
          shownLayer: 4,
          state: 'done',
          dueAt: NOW + 20 * DAY,
        },
      ],
    },
    {
      unitId: 2,
      name: '로그인 흐름',
      rootPath: 'src/features/auth', zero: false,
      files: 8,
      avgLayer: 1,
      state: 'current',
      nodes: [
        {
          conceptId: 'ts/destructuring',
          track: 't0',
          nameKo: '구조분해 할당',
          token: null,
          layer: 2,
          shownLayer: 2,
          state: 'done',
          dueAt: NOW + 3 * DAY,
        },
        {
          conceptId: 'ts/optional-chaining',
          track: 't0',
          nameKo: '옵셔널 체이닝',
          token: '?.',
          layer: 1,
          shownLayer: 1,
          state: 'current',
          dueAt: NOW,
        },
      ],
    },
  ],
  gaps: [
    {
      conceptId: 'common/async-await',
      nameKo: '비동기 기다리기',
      token: 'async / await',
      siteCount: 11,
      minUnknown: 0,
      hot: true,
      fill: 1,
    },
  ],
  retake: [
    {
      conceptId: 'ts/use-state',
      nameKo: '함수형 업데이트',
      token: 'useState',
      track: 't0',
      layer: 2,
      dueAt: NOW,
      excerpt: null,
    },
  ],
  days: [0, 14, 22, 0, 9, 18, 25, 12, 16, 20, 11, 24, 19, 12],
  lastRun: {
    status: 'done',
    mode: 'full',
    files: 41,
    captures: 900,
    commits: 35,
    warnings: 0,
    finishedAt: NOW,
    fingerprint: 'f0',
    error: null,
  },
  files: 41,
  newcomerFlag: 'none',
  openableBlocks: 4,
};

const EMPTY: HomeData = {
  ...DATA,
  masthead: { concepts: 0, printed: 0, avgLayer: 0 },
  inkScale: [0, 0, 0, 0, 0],
  sheets: [],
  gaps: [],
  retake: [],
  days: Array.from({ length: 14 }, () => 0),
  lastRun: { ...DATA.lastRun!, files: 0, commits: 2 },
  files: 0,
};

function draw(
  data: HomeData,
  onMake = vi.fn(),
  extra: {
    reingest?: boolean;
    onPick?: (id: string) => void;
    onSettings?: () => void;
    onRepos?: () => void;
  } = {},
) {
  const { onSettings, onRepos, ...rest } = extra;
  render(
    <HomeScreen
      data={data}
      repoName="cart-shop-web"
      today="2026-09-03"
      streak={7}
      today_={{
        items: [
          { kind: 't0', label: '새 문법 문제', mins: 1 },
          { kind: 't1', label: '필사 한 문제', mins: 8 },
        ],
        mins: 9,
        resumeAt: null,
        streak: 7,
        days: [],
      }}
      onStart={() => undefined}
      onSettings={onSettings ?? (() => undefined)}
      onRepos={onRepos ?? (() => undefined)}
      onMake={onMake}
      now={NOW}
      {...rest}
    />,
  );
  return onMake;
}

describe('HomeScreen', () => {
  it('화면에 있는 것은 셋이다 — 오늘 할 것 · 단원 · 아직 안 배운 문법', () => {
    draw(DATA);

    // 하나의 초점 (정본 §6). 오늘 할 것이 단원보다 문서 순서가 앞이다.
    const today = screen.getByRole('region', { name: '오늘 할 것' });
    expect(today.textContent).toContain('2');
    expect(today.textContent).toContain('9');
    const units = screen.getByRole('region', { name: '단원' });
    expect(today.compareDocumentPosition(units) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(units.textContent).toContain('로그인 흐름');
    expect(units.textContent).toContain('장바구니 담기 / 빼기');
    expect(screen.getByRole('list', { name: '아직 안 배운 문법' }).textContent)
      .toContain('async / await');

    // 뺀 것들이 정말 없다 — 도장·14일 막대·숙련도 사다리·다시 풀 개념·마스코트.
    expect(screen.queryByRole('img', { name: /지난 14일/ })).toBeNull();
    expect(screen.queryByRole('img', { name: /숙련도 다섯 단계/ })).toBeNull();
    expect(screen.queryByRole('list', { name: '다시 풀 개념' })).toBeNull();
    expect(screen.queryByRole('group', { name: '오늘 요약' })).toBeNull();
  });

  it('단원은 한 번에 하나만 펴 둔다 (정본 §3-9)', async () => {
    const user = userEvent.setup();
    draw(DATA);

    // 처음 펴 있는 것은 지금 배우는 단원이다.
    const current = screen.getByRole('button', { name: /로그인 흐름/ });
    const other = screen.getByRole('button', { name: /장바구니 담기 \/ 빼기/ });
    expect(current.getAttribute('aria-expanded')).toBe('true');
    expect(other.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('옵셔널 체이닝')).toBeTruthy();

    await user.click(other);
    expect(other.getAttribute('aria-expanded')).toBe('true');
    expect(current.getAttribute('aria-expanded')).toBe('false');
  });

  it('개념 줄은 이름 · 트랙 · 숙련도 · 상태를 글자로 말한다 (색으로 가르지 않는다)', () => {
    draw(DATA);
    const row = screen.getByText('옵셔널 체이닝').closest('li');
    expect(row?.textContent).toContain('T0 문법');
    expect(row?.textContent).toContain('1단계 · 처음');
    expect(row?.textContent).toContain('지금 여기');
  });

  it('「문제 만들기」가 화면 밖으로 개념 id 를 넘긴다', async () => {
    const onMake = vi.fn();
    const user = userEvent.setup();
    draw(DATA, onMake);

    await user.click(screen.getByRole('button', { name: 'async / await 문제 만들기' }));
    expect(onMake).toHaveBeenCalledWith('common/async-await');
  });

  it('개념 줄의 「이 문제 풀기」가 개념 id 를 넘긴다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    draw(DATA, vi.fn(), { onPick });

    const row = screen.getByText('옵셔널 체이닝').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: '이 문제 풀기' }));
    expect(onPick).toHaveBeenCalledWith('ts/optional-chaining');
  });

  it('단원이 0개여도 깨지지 않고 왜 없는지를 말한다', () => {
    draw(EMPTY);
    expect(screen.getByText(/단원(이|은) 없습니다/)).toBeTruthy();
    expect(screen.getByText(/아직 안 배운 문법이 없습니다/)).toBeTruthy();
  });

  it('「아직 못 하는 것」 둘이 한 자리에 있다 — T1 필사와 책임 배치 (D96 · D170 ⑤)', () => {
    // 커밋 0 · 필사 블록 0 인 리포. 둘 다 「지금은 안 된다, 이유는 이것이다」다.
    draw({
      ...DATA,
      openableBlocks: 0,
      lastRun: { ...(DATA.lastRun as NonNullable<HomeData['lastRun']>), commits: 0 },
    });
    const gaps = screen.getByRole('region', { name: '아직 안 배운 문법' });
    expect(gaps.textContent).toContain('T1 필사');
    expect(gaps.textContent).toContain('책임 배치 문제');
    expect(gaps.textContent).toContain('커밋은 0개');
  });

  it('초보 안내는 플래그가 섰을 때만, 단원보다 위에 뜬다 (02 §6.4)', () => {
    draw(DATA);
    expect(screen.queryByRole('complementary', { name: '먼저 읽을 것' })).toBeNull();
    cleanup();

    draw({ ...DATA, newcomerFlag: 'confirmed' });
    const notice = screen.getByRole('complementary', { name: '먼저 읽을 것' });
    expect(notice.textContent).toContain('0장 — 이 언어의 바닥');
    // 아무것도 잠그지 않는 것이 눈에 보여야 한다. 닫기 버튼은 두지 않는다.
    expect(notice.textContent).toContain('잠기는 것은 없습니다');
    expect(notice.querySelector('button')).toBeNull();
    const gaps = screen.getByRole('list', { name: '아직 안 배운 문법' });
    expect(notice.compareDocumentPosition(gaps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('재인제스트 배너는 지문이 달라졌을 때만 뜬다 (06 §6.3)', () => {
    draw(DATA);
    expect(screen.queryByText(/재인제스트 필요/)).toBeNull();
    cleanup();

    draw(DATA, vi.fn(), { reingest: true });
    const banner = screen.getByRole('complementary', { name: /재인제스트 필요/ });
    // 경고가 아니라 안내다 — 다시 읽어도 숙련도는 남는다는 것이 배너의 본문이다.
    expect(banner.textContent).toContain('익힌 숙련도는 개념에 붙어 있어 그대로 남습니다');
    const gaps = screen.getByRole('list', { name: '아직 안 배운 문법' });
    expect(banner.compareDocumentPosition(gaps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('맨 윗줄의 설정·서가가 화면 밖으로 나간다', async () => {
    const user = userEvent.setup();
    const onSettings = vi.fn();
    const onRepos = vi.fn();
    draw(DATA, vi.fn(), { onSettings, onRepos });

    await user.click(screen.getByRole('button', { name: '설정' }));
    expect(onSettings).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: '서가' }));
    expect(onRepos).toHaveBeenCalledTimes(1);
  });
});
