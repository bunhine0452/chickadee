// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
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

function draw(data: HomeData, onMake = vi.fn(), extra: { reingest?: boolean } = {}) {
  render(
    <HomeScreen
      data={data}
      repoName="cart-shop-web"
      today="2026-09-03"
      streak={7}
      onSettings={() => undefined}
      onMake={onMake}
      now={NOW}
      {...extra}
    />,
  );
  return onMake;
}

describe('HomeScreen', () => {
  it('HomeData 하나로 마스트헤드·대지·「판이 없는 문법」을 다 그린다', () => {
    draw(DATA);

    const ticket = screen.getByRole('group', { name: '작업 지시서' });
    expect(ticket.textContent).toContain('cart-shop-web');
    expect(ticket.textContent).toContain('2026-09-03');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('cart-shop-web');
    // 대지는 색인 띠에 다 서고 걸리는 것은 한 장이다 (D133).
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute('aria-label')).toContain('장바구니 담기 / 빼기');
    const sheets = screen.getAllByRole('article');
    expect(sheets).toHaveLength(1);
    // 처음 걸리는 것은 인쇄 중인 대지다.
    expect(sheets[0]?.textContent).toContain('로그인 흐름');

    expect(screen.getByRole('list', { name: '판이 없는 문법' }).textContent).toContain('async / await');
    expect(screen.getByRole('img', { name: /지난 14일 잉크 농도/ })).toBeTruthy();
  });

  it('잉크 겹 패널은 접힌 채 열리고 제목 줄로 펼쳐진다 (D133)', async () => {
    const user = userEvent.setup();
    draw(DATA);

    // 접힌 속은 지우지 않고 덮는다 — 접근성 트리에서만 사라진다.
    expect(screen.queryByRole('img', { name: /잉크 겹 5단계/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: /잉크 겹/ }));
    expect(screen.getByRole('img', { name: /잉크 겹 5단계/ })).toBeTruthy();
    expect(screen.getByRole('list', { name: '다시 찍을 개념' })).toBeTruthy();
  });

  it('「판 만들기」가 화면 밖으로 개념 id 를 넘긴다', async () => {
    const onMake = vi.fn();
    const user = userEvent.setup();
    draw(DATA, onMake);

    await user.click(screen.getByRole('button', { name: 'async / await 판 만들기' }));
    expect(onMake).toHaveBeenCalledWith('common/async-await');
  });

  it('길잡이 문구는 말풍선이 아니라 live 로 읽힌다', () => {
    draw(DATA);
    expect(screen.getByRole('status').textContent).toContain('옵셔널 체이닝');
  });

  it('대지가 0개여도 깨지지 않고 빈 상태를 말한다', () => {
    draw(EMPTY);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText(/아직 대지가 없습니다/)).toBeTruthy();
    expect(screen.getByText(/이 리포로는 T2 를 짤 수 없습니다/)).toBeTruthy();
    expect(screen.getByText(/판이 없는 문법이 없습니다/)).toBeTruthy();
    expect(screen.getByText(/다시 찍을 개념이 아직 없습니다/)).toBeTruthy();
    expect(screen.getByRole('img', { name: /지난 14일 잉크 농도/ })).toBeTruthy();
  });

  it('초보 안내는 플래그가 섰을 때만, 대지보다 위에 뜬다 (02 §6.4)', () => {
    draw(DATA);
    expect(screen.queryByRole('complementary', { name: '먼저 읽을 것' })).toBeNull();
    cleanup();

    draw({ ...DATA, newcomerFlag: 'confirmed' });
    const notice = screen.getByRole('complementary', { name: '먼저 읽을 것' });
    expect(notice.textContent).toContain('0장 — 이 언어의 바닥');
    // 아무것도 잠그지 않는 것이 눈에 보여야 한다. 닫기 버튼은 두지 않는다(다시 켤 길이 없다).
    expect(notice.textContent).toContain('잠기는 것은 없습니다');
    expect(notice.querySelector('button')).toBeNull();
    // 상단이다 — 작업대(「판이 없는 문법」)보다 문서 순서가 앞이면 스크롤 없이 보인다.
    const gaps = screen.getByRole('list', { name: '판이 없는 문법' });
    expect(notice.compareDocumentPosition(gaps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('재인제스트 배너는 지문이 달라졌을 때만 뜬다 (06 §6.3)', () => {
    draw(DATA);
    expect(screen.queryByText(/재인제스트 필요/)).toBeNull();
    cleanup();

    draw(DATA, vi.fn(), { reingest: true });
    const banner = screen.getByRole('region', { name: /재인제스트 필요/ });
    // 경고가 아니라 안내다 — 다시 읽어도 겹은 남는다는 것이 배너의 본문이다 (06 §6.3).
    expect(banner.textContent).toContain('익힌 겹은 개념에 붙어 있어 그대로 남습니다');
    // 마스트헤드 바로 아래 — 대지보다 앞이라 스크롤 없이 보인다.
    const gaps = screen.getByRole('list', { name: '판이 없는 문법' });
    expect(banner.compareDocumentPosition(gaps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('마스트헤드의 설정 버튼이 화면 밖으로 나간다', async () => {
    const user = userEvent.setup();
    const onSettings = vi.fn();
    render(
      <HomeScreen
        data={DATA}
        repoName="cart-shop-web"
        today="2026-09-03"
        streak={7}
        onSettings={onSettings}
        onMake={vi.fn()}
        now={NOW}
      />,
    );
    await user.click(screen.getByRole('button', { name: '설정' }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it('대지의 스티커를 눌러 상세를 열 수 있다', async () => {
    const user = userEvent.setup();
    draw(DATA);

    await user.click(screen.getByRole('button', { name: /옵셔널 체이닝/ }));
    expect(screen.getByRole('region', { name: '옵셔널 체이닝 상세' })).toBeTruthy();
  });
});
