// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CardPayload, EdgeKind } from '@chickadee/store-sql';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DependencyMap, G, bandLineY, layoutMap, mapEdges, nodeDir, nodeName } from './DependencyMap';
import type { MapBand, MapEdge, MapFile, NodeState } from './DependencyMap';

afterEach(cleanup);

/** 목업 `data.js` 의 cart 지도를 줄이고, 목업에 없는 세 가지를 한 건씩 얹었다. */
const BANDS: MapBand[] = [
  { l: '화면', s: 'app/' },
  { l: '기능', s: 'features/cart/' },
  { l: '동작 · 통신', s: 'hooks · api' },
  { l: '공용 · 데이터', s: 'lib · server' },
];

const FILES: MapFile[] = [
  { p: 'app/cart/page.tsx', r: 0 },
  { p: 'features/cart/CartSheet.tsx', r: 1 },
  { p: 'features/cart/CartItemRow.tsx', r: 1 },
  { p: 'features/cart/QuantityStepper.tsx', r: 1, isNew: true },
  { p: 'features/cart/useCart.ts', r: 2 },
  { p: 'features/cart/cartApi.ts', r: 2 },
  { p: 'app/api/cart/route.ts', r: 2 },
  { p: 'server/cartRepo.ts', r: 3, cycle: true },
  { p: 'server/schema.ts', r: 3, cycle: true },
  { p: 'lib', r: 3, folded: 3 },
];

/** 카드 페이로드가 주는 모양 그대로 — props 는 이보다 넓게(readonly) 받는다. */
const EDGES: [string, string, EdgeKind][] = [
  ['app/cart/page.tsx', 'features/cart/CartSheet.tsx', 'static'],
  ['features/cart/CartSheet.tsx', 'features/cart/CartItemRow.tsx', 'static'],
  ['features/cart/CartSheet.tsx', 'features/cart/useCart.ts', 'static'],
  ['features/cart/CartItemRow.tsx', 'features/cart/QuantityStepper.tsx', 'static'],
  ['features/cart/useCart.ts', 'features/cart/cartApi.ts', 'static'],
  ['features/cart/cartApi.ts', 'app/api/cart/route.ts', 'http'],
  ['app/api/cart/route.ts', 'server/cartRepo.ts', 'static'],
  ['server/cartRepo.ts', 'server/schema.ts', 'static'],
  ['server/schema.ts', 'server/cartRepo.ts', 'type'],
];

const GRADED: Record<string, NodeState> = {
  'features/cart/QuantityStepper.tsx': 'ok',
  'features/cart/cartApi.ts': 'missed',
  'features/cart/CartSheet.tsx': 'wrong',
  'server/schema.ts': 'sec',
};

function draw(over: Partial<ComponentProps<typeof DependencyMap>> = {}) {
  const props = {
    bands: BANDS,
    files: FILES,
    edges: EDGES,
    selected: new Set<string>(),
    onToggle: () => {},
    hints: 0,
    ...over,
  };
  return render(<DependencyMap {...props} />);
}

/** `d` 의 첫 점 `M x y`. */
function start(d: string): { x: number; y: number } {
  const m = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d);
  return { x: Number(m?.[1]), y: Number(m?.[2]) };
}

const edgeOf = (root: ParentNode, from: string, to: string) =>
  [...root.querySelectorAll(`path[data-f="${from}"][data-t="${to}"]`)];

describe('layoutMap', () => {
  it('밴드 행 y 와 가로 중앙 정렬은 04 §7.3 의 식 그대로다', () => {
    const { pos, W, H } = layoutMap(BANDS, FILES);

    // 가장 넓은 밴드 = 3칸 = 3·196 + 2·16 = 620.
    expect(W).toBe(G.PADL + 620 + G.PADR);
    expect(H).toBe(G.PADT + BANDS.length * (G.NH + G.GY) - G.GY + G.PADB);

    // 1칸짜리 밴드 0 은 620 폭 안에서 가운데.
    expect(pos.get('app/cart/page.tsx')).toEqual({ x: G.PADL + (620 - G.NW) / 2, y: G.PADT });
    // 3칸짜리 밴드 1 은 왼쪽 끝부터. y = PADT + 1·(NH+GY).
    expect(pos.get('features/cart/CartSheet.tsx')).toEqual({ x: G.PADL, y: G.PADT + (G.NH + G.GY) });
    expect(bandLineY(1)).toBe(G.PADT + (G.NH + G.GY) - G.GY / 2);
  });

  it('밴드 안 순서는 files 의 순서다 — 정렬하지 않는다', () => {
    const scrambled = [...FILES].reverse();
    const { pos } = layoutMap(BANDS, scrambled);
    const band1 = scrambled.filter((f) => f.r === 1).map((f) => pos.get(f.p)?.x);
    expect(band1).toEqual([G.PADL, G.PADL + (G.NW + G.GX), G.PADL + 2 * (G.NW + G.GX)]);
  });

  it('같은 입력에 같은 좌표를 낸다', () => {
    expect([...layoutMap(BANDS, FILES).pos]).toEqual([...layoutMap(BANDS, FILES).pos]);
  });

  it('24 노드 배치가 5ms 안에 끝난다 (05 §10)', () => {
    const many: MapFile[] = Array.from({ length: 24 }, (_, i) => ({ p: `f${i}.ts`, r: i % 4 }));
    const links: MapEdge[] = Array.from({ length: 23 }, (_, i) => [`f${i}.ts`, `f${i + 1}.ts`, 'static']);
    const t0 = performance.now();
    for (let i = 0; i < 10; i += 1) mapEdges(links, layoutMap(BANDS, many).pos);
    expect((performance.now() - t0) / 10).toBeLessThan(5);
  });
});

describe('mapEdges', () => {
  it('나가는 선은 아래 변 · 들어오는 선은 위 변에 붙는다', () => {
    const { pos } = layoutMap(BANDS, FILES);
    const geom = mapEdges(EDGES, pos);
    const e = geom.find((g) => g.from === 'app/cart/page.tsx');
    const from = pos.get('app/cart/page.tsx');
    expect(start(e?.paths[0] ?? '').y).toBe((from?.y ?? 0) + G.NH);
    expect(e?.paths[0]).toContain(`${pos.get('features/cart/CartSheet.tsx')?.y}`);
  });

  it('포트는 상대 노드의 x 순으로 22px 씩 벌어진다', () => {
    const { pos } = layoutMap(BANDS, FILES);
    const geom = mapEdges(EDGES, pos);
    // CartSheet 는 나가는 선이 둘 — span = min(NW−40, 1·22) = 22.
    const toRow = geom.find((g) => g.to === 'features/cart/CartItemRow.tsx');
    const toHook = geom.find((g) => g.to === 'features/cart/useCart.ts');
    const xRow = start(toRow?.paths[0] ?? '').x;
    const xHook = start(toHook?.paths[0] ?? '').x;
    expect(xRow - xHook).toBe(22);
    // 슬롯 순서는 상대 노드 x — useCart(x 128) 가 CartItemRow(x 340) 보다 왼쪽이다.
    expect(xHook).toBeLessThan(xRow);
  });

  it('아래로 가는 선과 같은 층(역방향) 선의 제어점이 다르다', () => {
    const { pos } = layoutMap(BANDS, FILES);
    const geom = mapEdges(EDGES, pos);
    const down = geom.find((g) => g.from === 'app/cart/page.tsx');
    // 아래 변(y 68)에서 아랫 밴드 위 변(y 128)까지 60px — dy = max(18, 60·0.42) = 25.2.
    const sd = start(down?.paths[0] ?? '');
    expect(sd.y).toBe(G.PADT + G.NH);
    expect(down?.paths[0]).toContain(`C${sd.x} ${sd.y + 25.2}`);
    // 같은 층 되돌이는 제어점 30 고정.
    const back = geom.find((g) => g.kind === 'type');
    const s = start(back?.paths[0] ?? '');
    expect(back?.paths[0]).toContain(`C${s.x} ${s.y + 30}`);
  });

  it('http 만 두 줄이고 나머지는 한 줄이다 — 이중선', () => {
    const geom = mapEdges(EDGES, layoutMap(BANDS, FILES).pos);
    const http = geom.find((g) => g.kind === 'http');
    expect(http?.paths).toHaveLength(2);
    expect(start(http?.paths[1] ?? '').x - start(http?.paths[0] ?? '').x).toBeCloseTo(3.4, 5);
    expect(geom.filter((g) => g.kind !== 'http').every((g) => g.paths.length === 1)).toBe(true);
  });

  it('지도에 없는 파일을 가리키는 엣지는 버린다', () => {
    const geom = mapEdges([['없는/파일.ts', 'server/schema.ts', 'static']], layoutMap(BANDS, FILES).pos);
    expect(geom).toHaveLength(0);
  });
});

describe('nodeName · nodeDir', () => {
  it('접힌 폴더는 lib/ (3) 으로 낸다 (04 §7.4)', () => {
    expect(nodeName({ p: 'lib', r: 3, folded: 3 })).toBe('lib/ (3)');
    expect(nodeName({ p: 'src/lib/', r: 3, folded: 7 })).toBe('lib/ (7)');
    expect(nodeDir({ p: 'src/lib/', r: 3, folded: 7 })).toBe('src/');
    expect(nodeDir({ p: 'lib', r: 3, folded: 3 })).toBe('접힌 폴더');
  });

  it('보통 파일은 목업 base/dir 그대로다', () => {
    expect(nodeName({ p: 'features/cart/useCart.ts', r: 2 })).toBe('useCart.ts');
    expect(nodeDir({ p: 'features/cart/useCart.ts', r: 2 })).toBe('features/cart/');
  });
});

describe('DependencyMap', () => {
  it('svg 는 이름 있는 group 이고 노드는 누를 수 있는 단추다', () => {
    draw({ label: 'cart 기능 의존 지도' });
    expect(screen.getByRole('group', { name: 'cart 기능 의존 지도' })).toBeTruthy();
    const nodes = screen.getAllByRole('button');
    expect(nodes).toHaveLength(FILES.length);
    expect(nodes[0]?.getAttribute('tabindex')).toBe('0');
    expect(nodes[0]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('고른 파일은 aria-pressed 와 sel 이 같이 선다', () => {
    const { container } = draw({ selected: new Set(['features/cart/useCart.ts']) });
    const node = container.querySelector('[data-p="features/cart/useCart.ts"]');
    expect(node?.getAttribute('aria-pressed')).toBe('true');
    expect(node?.getAttribute('class')).toContain('sel');
  });

  it('클릭과 Enter · Space 가 같은 토글을 부른다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const { container } = draw({ onToggle });
    const node = container.querySelector('[data-p="lib"]') as Element;

    await user.click(node);
    fireEvent.keyDown(node, { key: 'Enter' });
    fireEvent.keyDown(node, { key: ' ' });
    fireEvent.keyDown(node, { key: 'a' });
    expect(onToggle.mock.calls).toEqual([['lib'], ['lib'], ['lib']]);
  });

  it('채점 뒤에는 토글하지 않는다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const { container } = draw({ onToggle, graded: GRADED });
    await user.click(container.querySelector('[data-p="lib"]') as Element);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('채점 상태 4종이 클래스와 배지로 함께 나온다', () => {
    const { container } = draw({ graded: GRADED, selected: new Set(['features/cart/CartSheet.tsx']) });
    const badge = (p: string) => container.querySelector(`[data-p="${p}"] .badge`)?.textContent;
    expect(badge('features/cart/QuantityStepper.tsx')).toBe('✓');
    expect(badge('features/cart/cartApi.ts')).toBe('＋');
    expect(badge('features/cart/CartSheet.tsx')).toBe('✕');
    expect(badge('server/schema.ts')).toBe('◆');
    expect(container.querySelectorAll('.nd.ok')).toHaveLength(1);
    expect(container.querySelectorAll('.nd.missed')).toHaveLength(1);
    expect(container.querySelectorAll('.nd.sec')).toHaveLength(1);
    // 채점 뒤에는 sel 을 벗는다 — 판정이 대신 말한다 (목업).
    expect(container.querySelector('[data-p="features/cart/CartSheet.tsx"]')?.getAttribute('class')).not.toContain(
      'sel',
    );
  });

  it('판정은 색만으로 전해지지 않는다 — aria-label 이 낱말을 싣는다', () => {
    const { container } = draw({ graded: GRADED });
    expect(container.querySelector('[data-p="features/cart/cartApi.ts"]')?.getAttribute('aria-label')).toBe(
      'features/cart/cartApi.ts · 놓침',
    );
  });

  it('접힌 폴더는 이름 · 뒤 상자 · 이름표를 함께 낸다', () => {
    const { container } = draw();
    const fold = container.querySelector('[data-p="lib"]');
    expect(fold?.getAttribute('class')).toContain('fold');
    expect(fold?.querySelector('.nm')?.textContent).toBe('lib/ (3)');
    expect(fold?.querySelector('.stack')).toBeTruthy();
    expect(fold?.getAttribute('aria-label')).toBe('lib · 접힌 폴더 · 파일 3개');
  });

  it('순환 노드에는 ⟲ 배지가 붙는다 (04 §7.2)', () => {
    const { container } = draw();
    expect(container.querySelectorAll('.cyctag')).toHaveLength(2);
    expect(container.querySelector('[data-p="server/schema.ts"] .cyctag')?.textContent).toBe('⟲ 순환');
    expect(container.querySelector('[data-p="lib"] .cyctag')).toBeNull();
  });

  it('type 은 점선 class · http 는 두 줄이고 뒤 줄에 화살촉이 없다', () => {
    const { container } = draw();
    const type = edgeOf(container, 'server/schema.ts', 'server/cartRepo.ts');
    expect(type).toHaveLength(1);
    expect(type[0]?.getAttribute('class')).toContain('type');

    const http = edgeOf(container, 'features/cart/cartApi.ts', 'app/api/cart/route.ts');
    expect(http).toHaveLength(2);
    expect(http[0]?.getAttribute('class')).toContain('under');
    expect(http[1]?.getAttribute('class')).not.toContain('under');
  });

  it('「새 파일」 배지는 힌트 2단부터, 채점 뒤에는 항상 보인다', () => {
    const { container, rerender } = draw({ hints: 1 });
    expect(container.querySelectorAll('.newtag')).toHaveLength(0);

    rerender(
      <DependencyMap bands={BANDS} files={FILES} edges={EDGES} selected={new Set()} onToggle={() => {}} hints={2} />,
    );
    expect(container.querySelectorAll('.newtag')).toHaveLength(1);
    expect(container.querySelector('.newtag')?.textContent).toBe('＋ 새 파일');

    rerender(
      <DependencyMap
        bands={BANDS}
        files={FILES}
        edges={EDGES}
        selected={new Set()}
        onToggle={() => {}}
        hints={0}
        graded={GRADED}
      />,
    );
    expect(container.querySelectorAll('.newtag')).toHaveLength(1);
  });

  it('카드 페이로드의 t2 변형을 그대로 받는다 (D100)', () => {
    // 이 대입이 깨지면 props 가 02 의 카드 모양에서 떨어져 나간 것이다.
    const card: Extract<CardPayload, { track: 't2' }> = {
      track: 't2',
      kind: 'placement',
      q: '어느 파일들을 고쳐야 할까요?',
      hint: '지도에서 파일 상자를 클릭해 고릅니다.',
      bands: BANDS,
      files: FILES,
      edges: EDGES,
      core: {},
      sec: {},
      trap: {},
      hints: [],
    };
    const { container } = render(
      <DependencyMap
        bands={card.bands}
        files={card.files}
        edges={card.edges}
        selected={new Set()}
        onToggle={() => {}}
        hints={card.hints.length}
      />,
    );
    expect(container.querySelectorAll('.nd')).toHaveLength(FILES.length);
  });

  it('마우스와 포커스 둘 다 관련 엣지를 세우고 나머지를 눕힌다', async () => {
    const onHover = vi.fn();
    const user = userEvent.setup();
    const { container } = draw({ onHover });
    const node = container.querySelector('[data-p="features/cart/CartSheet.tsx"]') as Element;

    await user.hover(node);
    expect(container.querySelectorAll('.edge.hl')).toHaveLength(3);
    expect(container.querySelectorAll('.edge.fade').length).toBeGreaterThan(0);
    expect(onHover).toHaveBeenLastCalledWith('features/cart/CartSheet.tsx');

    await user.unhover(node);
    expect(container.querySelectorAll('.edge.hl')).toHaveLength(0);
    expect(container.querySelectorAll('.edge.fade')).toHaveLength(0);
    expect(onHover).toHaveBeenLastCalledWith(null);

    fireEvent.focusIn(node);
    expect(container.querySelectorAll('.edge.hl')).toHaveLength(3);
    fireEvent.focusOut(node);
    expect(container.querySelectorAll('.edge.hl')).toHaveLength(0);
  });
});
