// @vitest-environment jsdom
/**
 * `en` 스모크 — 홈·인제스트와 `components/home` 이 실제로 영어로 뜨는가 (D117 · 05 §9).
 *
 * 재는 것이 둘이다.
 *
 * ① **모듈 상수로 얼어붙은 문장이 없다.** `const X = '…'` 는 모듈이 열리는 시점에 굳고
 *    그 시점은 `setLocale()` 보다 이르다. 그런 문장은 언어를 바꿔도 한국어로 남는데,
 *    `tsc` 도 카탈로그 린트도 그것을 못 잡는다 — **화면을 그려 봐야** 드러난다. 그래서
 *    픽스처의 데이터는 전부 ASCII 로 두고, 그려진 글자에 한글이 하나라도 있으면 그것은
 *    문구가 얼어붙은 자리다.
 *
 * ② **행 길이 게이트가 en 에서 잴 것이 남아 있다.** `tests/gates/design.spec.ts` 의
 *    `measure()` 는 본문 판정(`hasBody`)을 통과한 요소만 잰다. en 판정은 「라틴 글자
 *    40자 이상」이라, 번역이 지나치게 짧으면 **재는 요소가 0건이 되어 위반도 0건**이 되고
 *    게이트가 소리 없이 통과한다. 그 게이트는 지금 0건을 실패로 보지만, 여기서 먼저
 *    잡으면 브라우저를 띄우기 전에 안다.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { setLocale } from '@chickadee/i18n';

// 마스트헤드가 `settings` 를 읽어 모양을 복원한다 — 여기서는 그 조회만 비워 둔다.
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
const { IngestScreen } = await import('../ingest/IngestScreen.js');

const NOW = Date.UTC(2026, 8, 3, 9, 0, 0);
const DAY = 86_400_000;
const HANGUL = /[가-힣]/g;

/**
 * 홈 한 화면치. **값이 전부 ASCII 다** — 개념 이름·대지 이름은 사전에서 오는 데이터라
 * 로케일 축과 별개다(D118). 그것까지 한글로 두면 한글이 나와도 그것이 얼어붙은 문구인지
 * 데이터인지 갈라낼 수 없다.
 */
const DATA: HomeData = {
  masthead: { concepts: 21, printed: 9, avgLayer: 2.4 },
  inkScale: [4, 3, 6, 5, 3],
  sheets: [
    {
      unitId: 1,
      name: 'cart add / remove',
      rootPath: 'src/features/cart',
      files: 12,
      avgLayer: 3,
      state: 'current',
      nodes: [
        {
          conceptId: 'ts/use-state',
          track: 't0',
          nameKo: 'useState initial value',
          token: 'useState',
          layer: 3,
          shownLayer: 3,
          state: 'done',
          dueAt: NOW + 3 * DAY,
        },
        {
          conceptId: 'ts/optional-chaining',
          track: 't0',
          nameKo: 'optional chaining',
          token: '?.',
          layer: 0,
          shownLayer: 0,
          state: 'current',
          dueAt: null,
        },
        {
          conceptId: 'ts/try-catch',
          track: 't1',
          nameKo: 'try / catch',
          token: null,
          layer: 0,
          shownLayer: 0,
          state: 'locked',
          dueAt: null,
        },
      ],
    },
  ],
  gaps: [
    {
      conceptId: 'ts/nullish',
      nameKo: 'nullish coalescing',
      token: '??',
      siteCount: 14,
      minUnknown: 0,
      hot: true,
      fill: 1,
    },
  ],
  retake: [
    {
      conceptId: 'ts/use-state',
      nameKo: 'useState initial value',
      token: 'useState',
      track: 't0',
      layer: 2,
      dueAt: NOW + DAY,
      excerpt: null,
    },
  ],
  days: Array.from({ length: 14 }, (_, i) => (i % 3 === 0 ? 0 : 8)),
  lastRun: null,
  files: 31,
  newcomerFlag: 'confirmed',
  openableBlocks: 0,
};

/** `tests/gates/design.spec.ts` 가 재는 자리. `devtools/gates.ts` 의 것과 같아야 한다. */
const MEASURE_SELECTOR = 'p, .note, .board-note, .forecast p, .detail-in p, .streak-note, .ask, .fb p';

/** `gates.ts` 의 `hasBody(el, 'en')` — 라틴 글자 40자 이상이면 본문이다. */
const isEnBody = (el: Element): boolean =>
  ((el.textContent ?? '').match(/[A-Za-z]/g) ?? []).length >= 40;

/**
 * 화면 전체의 글자. 예외 목록은 비어 있다 — 홈에서 `t()` 를 안 거치는 자리가 없다.
 *
 * 여기 예외를 다시 만들지 마라. `TimeQueue` 가 시간 단위(`초`·`분`)와 진행 문장을 직접
 * 들고 있어 한동안 빠져 있었고, 그 자리는 `queue.*` 키로 넘어왔다.
 */
function ownText(container: HTMLElement): string {
  return container.textContent ?? '';
}

beforeAll(() => {
  setLocale('en');
});

afterEach(cleanup);

describe('en 스모크 — 홈 · 인제스트 · components/home', () => {
  it('그려진 글자에 한글이 없다 — 얼어붙은 문구가 있으면 여기서 걸린다', () => {
    const home = render(
      <HomeScreen
        data={DATA}
        repoName="cart-shop"
        today="2026-09-03"
        streak={4}
        today_={{
          items: [{ kind: 't0', label: 'Grammar', mins: 0.5 }],
          mins: 11,
          resumeAt: null,
          streak: 4,
          days: DATA.days,
        }}
        onStart={() => undefined}
        onSettings={() => undefined}
        onMake={() => undefined}
        onPick={() => undefined}
        reingest
        now={NOW}
      />,
    );

    const left = ownText(home.container).match(HANGUL) ?? [];
    expect(left.join(''), '이 글자를 내는 자리가 로케일보다 먼저 굳었다').toEqual([].join(''));
    cleanup();

    const ingest = render(
      <IngestScreen
        repoName="cart-shop"
        at={{ phase: 'parse', done: 3, total: 6 }}
        warnings={[{ relPath: 'src/big.ts', reason: 'oversize' }]}
        done={false}
        onCancel={() => undefined}
        onDone={() => undefined}
      />,
    );
    const ingestLeft = ownText(ingest.container).match(HANGUL) ?? [];
    expect(ingestLeft.join(''), '인제스트 문구가 로케일보다 먼저 굳었다').toEqual([].join(''));
  });

  it('영어 문구가 실제로 나오고, 행 길이 게이트가 잴 본문이 남는다', () => {
    const { container } = render(
      <HomeScreen
        data={DATA}
        repoName="cart-shop"
        today="2026-09-03"
        streak={4}
        onSettings={() => undefined}
        onMake={() => undefined}
        onPick={() => undefined}
        reingest
        now={NOW}
      />,
    );

    // 카탈로그를 거친다는 것을 몇 자리에서 못 박는다 — 폴백으로 ko 가 오면 여기서 갈린다.
    expect(screen.getByText('Ink layers')).toBeTruthy();
    expect(screen.getByText('Grammar without a plate')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Settings/ })).toBeTruthy();

    // 잰 것이 0건이면 위반도 0건이라 게이트가 소리 없이 통과한다 — 그 함정을 여기서 막는다.
    const bodies = [...container.querySelectorAll(MEASURE_SELECTOR)].filter(isEnBody);
    expect(bodies.length, 'en 본문으로 잡히는 요소가 0건이다 — 번역이 짧아 게이트가 헛돈다')
      .toBeGreaterThanOrEqual(9);
  });
});
