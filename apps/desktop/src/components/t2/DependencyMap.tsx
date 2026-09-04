import { memo, useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { t, type MessageKey } from '@chickadee/i18n';
import { cx } from '@chickadee/ui';
import type { EdgeKind } from '@chickadee/store-sql';

import './DependencyMap.css';

/**
 * 배치 상수 — 04 §7.3 「결정론적 배치(목업 `t2.js` 상수)」.
 *
 * 목업의 `G` 와 하나만 다르다: **`NW` 178 → 196**. 05 §4.2 의 13px 하한이 목업의
 * `.nd .dir{12.5px}` 와 `.newtag{12px}` 를 막아 둘 다 `--fs-13` 으로 올라가는데, 그러면
 * 상자 안 글이 넓어진다. 가장 긴 표본 이름 `QuantityStepper.tsx`(19자 × 14px 모노 = 159.6px,
 * 왼 여백 11 → 170.6px 에서 끝)가 178 폭에서는 판정 배지 자리(`NW−22` = 156)를 이미 밟고
 * 있었다 — 196 이면 배지가 174 에서 시작해 3.4px 이 남는다. 나머지 상수는 목업 그대로.
 */
export const G = {
  NW: 196,
  NH: 46,
  GX: 16,
  GY: 60,
  PADL: 128,
  PADT: 22,
  PADR: 22,
  PADB: 18,
} as const;

/** 「＋ 새 파일」 배지 — 12px 에서 13px 로 올리며 폭 56 → 74 (오른쪽 위 모서리에 건다). */
const NEW_TAG = { w: 74, dx: G.NW - 76, tx: G.NW - 70 } as const;
/** 「⟲ 순환」 배지 — 목업에 없다. 새 파일 배지와 같은 모양으로 왼쪽 위 모서리에 건다. */
const CYCLE_TAG = { w: 62, dx: 2, tx: 8 } as const;
/** `http` 이중선의 두 줄 사이 간격의 절반. 엣지는 대체로 수직이라 x 로 밀면 법선과 같다. */
const HTTP_GAP = 1.7;

/** 밴드 한 줄의 이름표. `l` 은 층 이름, `s` 는 그 층 파일들의 최장 공통 디렉터리 (04 §7.2). */
export interface MapBand {
  readonly l: string;
  readonly s: string;
}

/** 지도 노드 하나. `packages/store-sql` `CardPayload` t2 변형의 `files` 원소와 같은 모양이다. */
export interface MapFile {
  readonly p: string;
  /** 밴드 번호(0 = 화면 … 3 = 공용·데이터). */
  readonly r: number;
  /** 이번 커밋에서 새로 만들어진 파일. 힌트 2단부터 또는 채점 뒤에만 보인다. */
  readonly isNew?: boolean;
  /** 접힌 폴더면 그 안의 파일 수 (04 §7.4). */
  readonly folded?: number;
  /** 크기 > 1 인 SCC 에 든 파일 (04 §7.2). */
  readonly cycle?: boolean;
}

/** `[가져다 쓰는 쪽, 쓰이는 쪽, 종류]`. 화살표는 언제나 「가져다 쓴다」 방향이다. */
export type MapEdge = readonly [string, string, EdgeKind];

/** 채점 뒤 노드 상태 4종. 04 §8.1 의 3티어 + 「골라도 안 골라도 감점 없는」 sec. */
export type NodeState = 'ok' | 'missed' | 'wrong' | 'sec';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface MapLayout {
  /** 파일 경로 → 상자 왼쪽 위 모서리. */
  readonly pos: ReadonlyMap<string, Point>;
  readonly W: number;
  readonly H: number;
}

/** 판정 배지 글자. 목업 `svgHTML()` 그대로. */
const BADGE: Readonly<Record<NodeState, string>> = {
  ok: '✓',
  missed: '＋',
  wrong: '✕',
  sec: '◆',
};

/** 색만으로는 판정이 전달되지 않는다 (05 §9) — 낱말을 `aria-label` 에 같이 싣는다. */
const STATE_KEY: Readonly<Record<NodeState, MessageKey>> = {
  ok: 'map.stateOk',
  missed: 'map.stateMissed',
  wrong: 'map.stateWrong',
  sec: 'map.stateSec',
};

/** 좌표 문자열이 부동소수 꼬리를 달지 않게 — 배치 결정론 테스트가 `d` 를 글자로 본다. */
const r2 = (n: number): number => Math.round(n * 100) / 100;

/** 상자에 낼 이름. 접힌 폴더는 `lib/ (3)` 으로 낸다 (04 §7.4). */
export function nodeName(f: MapFile): string {
  const base = f.p.replace(/\/+$/, '').split('/').pop() ?? f.p;
  return f.folded === undefined ? base : `${base}/ (${f.folded})`;
}

/**
 * 상자 둘째 줄. 목업 `dir()` 그대로 뒤 한 칸을 떼고 `/` 를 붙인다 — 루트 파일은 `/` 가 된다.
 * 접힌 폴더가 루트에 있으면 낼 경로가 없으니 그 자리에 무엇인지를 적는다.
 */
export function nodeDir(f: MapFile): string {
  const parts = f.p.replace(/\/+$/, '').split('/');
  parts.pop();
  const dir = `${parts.join('/')}/`;
  return f.folded !== undefined && dir === '/' ? t('map.folded') : dir;
}

/**
 * 목업 `layout()` 그대로. 밴드 행 `y = PADT + r·(NH+GY)`, 밴드 안 노드는 가로 중앙 정렬.
 *
 * **`files` 의 순서가 곧 밴드 안 순서다** — 정렬하지 않는다. 생성기가 barycenter 스윕으로
 * 이미 정했고(04 §7.3), 여기서 한 번 더 정렬하면 그 결과가 지워진다.
 */
export function layoutMap(bands: readonly MapBand[], files: readonly MapFile[]): MapLayout {
  const rows: MapFile[][] = bands.map(() => []);
  const last = bands.length - 1;
  for (const f of files) {
    const r = Math.min(Math.max(f.r, 0), last);
    rows[r]?.push(f);
  }

  const widthOf = (n: number) => (n === 0 ? 0 : n * G.NW + (n - 1) * G.GX);
  const maxW = Math.max(0, ...rows.map((b) => widthOf(b.length)));

  const pos = new Map<string, Point>();
  rows.forEach((b, r) => {
    const x0 = G.PADL + (maxW - widthOf(b.length)) / 2;
    const y = G.PADT + r * (G.NH + G.GY);
    b.forEach((f, i) => pos.set(f.p, { x: x0 + i * (G.NW + G.GX), y }));
  });

  return {
    pos,
    W: G.PADL + maxW + G.PADR,
    H: bands.length === 0 ? G.PADT + G.PADB : G.PADT + bands.length * (G.NH + G.GY) - G.GY + G.PADB,
  };
}

/** 밴드 사이 점선의 y. 첫 밴드 위에는 긋지 않는다 (목업 `if (r)`). */
export function bandLineY(r: number): number {
  return G.PADT + r * (G.NH + G.GY) - G.GY / 2;
}

/** 밴드 이름표의 y 두 개. */
export function bandTextY(r: number): { l: number; s: number } {
  const y = G.PADT + r * (G.NH + G.GY);
  return { l: y + 19, s: y + 37 };
}

export interface EdgeGeom {
  readonly from: string;
  readonly to: string;
  readonly kind: EdgeKind;
  /** `http` 이중선은 두 줄, 나머지는 한 줄. 화살촉은 **마지막** 줄에만 붙는다. */
  readonly paths: readonly string[];
}

/**
 * 포트 분산과 베지어. 목업 `port()` · 엣지 `d` 계산 그대로 (04 §7.3).
 *
 * 나가는 선은 상자 아래 변, 들어오는 선은 위 변. 슬롯 순서는 **상대 노드의 x** 라
 * 선이 서로 넘어가지 않는다. `pos` 에 없는 파일을 가리키는 엣지는 그린 자리가 없으니 버린다.
 */
export function mapEdges(edges: readonly MapEdge[], pos: ReadonlyMap<string, Point>): EdgeGeom[] {
  const outs = new Map<string, string[]>();
  const ins = new Map<string, string[]>();
  const live = edges.filter(([f, t]) => pos.has(f) && pos.has(t));
  for (const [f, t] of live) {
    const o = outs.get(f);
    if (o === undefined) outs.set(f, [t]);
    else o.push(t);
    const i = ins.get(t);
    if (i === undefined) ins.set(t, [f]);
    else i.push(f);
  }

  /** `live` 로 걸러 둔 뒤라 `pos` 에 반드시 있다. */
  const port = (p: string, list: readonly string[], other: string, top: boolean): Point => {
    const at = pos.get(p) ?? { x: 0, y: 0 };
    const n = list.length;
    const span = Math.min(G.NW - 40, (n - 1) * 22);
    const i = [...list].sort((a, b) => (pos.get(a)?.x ?? 0) - (pos.get(b)?.x ?? 0)).indexOf(other);
    return {
      x: at.x + G.NW / 2 - span / 2 + (n > 1 ? (i * span) / (n - 1) : 0),
      y: top ? at.y : at.y + G.NH,
    };
  };

  const curve = (s: Point, t: Point, dx: number): string => {
    const sx = r2(s.x + dx);
    const tx = r2(t.x + dx);
    const dy = r2(Math.max(18, (t.y - s.y) * 0.42));
    return s.y < t.y
      ? `M${sx} ${s.y} C${sx} ${s.y + dy} ${tx} ${t.y - dy} ${tx} ${t.y}`
      : `M${sx} ${s.y} C${sx} ${s.y + 30} ${tx} ${t.y - 30} ${tx} ${t.y}`;
  };

  return live.map(([from, to, kind]) => {
    const s = port(from, outs.get(from) ?? [], to, false);
    const t = port(to, ins.get(to) ?? [], from, true);
    return {
      from,
      to,
      kind,
      paths: kind === 'http' ? [curve(s, t, -HTTP_GAP), curve(s, t, HTTP_GAP)] : [curve(s, t, 0)],
    };
  });
}

interface MapNodeProps {
  file: MapFile;
  x: number;
  y: number;
  selected: boolean;
  /** 채점 전이면 `null`. */
  state: NodeState | null;
  graded: boolean;
  /** 「＋ 새 파일」 배지를 낼 때. 힌트 2단부터, 또는 채점 뒤 (목업). */
  showNew: boolean;
  onToggle: (path: string) => void;
  onHover: (path: string | null) => void;
}

/**
 * 상자 하나. 24개가 걸리고 호버할 때마다 부모가 다시 그리므로 `memo` 다 (05 §10) —
 * 호버는 엣지의 클래스만 바꾸고 노드 props 는 건드리지 않는다.
 */
const MapNode = memo(function MapNode({
  file,
  x,
  y,
  selected,
  state,
  graded,
  showNew,
  onToggle,
  onHover,
}: MapNodeProps) {
  const toggle = () => {
    if (!graded) onToggle(file.p);
  };
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const label = [
    file.p,
    file.folded === undefined ? null : t('map.foldedFiles', { n: String(file.folded) }),
    file.cycle === true ? t('map.cycle') : null,
    showNew ? t('map.newFile') : null,
    state === null ? null : t(STATE_KEY[state]),
  ]
    .filter((s): s is string => s !== null)
    .join(' · ');

  return (
    <g
      className={cx('nd', selected && !graded && 'sel', state, file.folded !== undefined && 'fold')}
      data-p={file.p}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={label}
      onClick={toggle}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onHover(file.p)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(file.p)}
      onBlur={() => onHover(null)}
    >
      {file.folded === undefined ? null : (
        <rect className="stack" x={x + 5} y={y + 5} width={G.NW} height={G.NH} rx={2} />
      )}
      <rect x={x} y={y} width={G.NW} height={G.NH} rx={2} />
      <text className="nm" x={x + 11} y={y + 19}>
        {nodeName(file)}
      </text>
      <text className="dir" x={x + 11} y={y + 36}>
        {nodeDir(file)}
      </text>
      {state === null ? null : (
        <text className="badge" x={x + G.NW - 22} y={y + 28}>
          {BADGE[state]}
        </text>
      )}
      {file.cycle === true ? (
        <>
          <rect className="cycbg" x={x + CYCLE_TAG.dx} y={y - 11} width={CYCLE_TAG.w} height={20} rx={2} />
          <text className="cyctag" x={x + CYCLE_TAG.tx} y={y + 3}>
            {t('map.cycleTag')}
          </text>
        </>
      ) : null}
      {showNew ? (
        <>
          <rect className="newbg" x={x + NEW_TAG.dx} y={y - 11} width={NEW_TAG.w} height={20} rx={2} />
          <text className="newtag" x={x + NEW_TAG.tx} y={y + 3}>
            {t('map.newTag')}
          </text>
        </>
      ) : null}
    </g>
  );
});

export interface DependencyMapProps {
  bands: readonly MapBand[];
  files: readonly MapFile[];
  edges: readonly MapEdge[];
  selected: ReadonlySet<string>;
  onToggle: (path: string) => void;
  /** 채점 뒤에만. 없으면 고르는 중이다. */
  graded?: Readonly<Record<string, NodeState>> | undefined;
  /** 힌트 단계 0~3. 2단부터 「새 파일」 배지가 보인다 (목업). */
  hints: number;
  onHover?: ((path: string | null) => void) | undefined;
  /** `svg` 의 이름. 「cart 기능 의존 지도」처럼 무엇의 지도인지 부모가 안다. */
  label?: string | undefined;
}

/**
 * `.map` — 계층 밴드 의존 지도 (05 §5).
 *
 * 마우스와 **포커스 둘 다** 관련 엣지를 `hl` 로 세우고 나머지를 `fade` 로 눕힌다. 호버 문장은
 * `MapStatus` 가 받아 적되 `aria-live` 로 보내지 않는다 — Tab 으로 24개를 지나가면 24번
 * 읽어 준다. 노드의 `aria-label` 이 같은 사실을 이미 싣고 있다 (05 §5).
 *
 * 화살촉 마커 id 는 목업과 같은 `ar`·`arK` 다. 한 화면에 지도는 하나뿐이라 `useId` 로
 * 흩지 않는다 — 흩으면 `url(#…)` 참조가 React 의 콜론·꺾쇠 id 를 받게 된다.
 */
export function DependencyMap({
  bands,
  files,
  edges,
  selected,
  onToggle,
  graded,
  hints,
  onHover,
  label = t('map.label'),
}: DependencyMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { pos, W, H } = useMemo(() => layoutMap(bands, files), [bands, files]);
  const geom = useMemo(() => mapEdges(edges, pos), [edges, pos]);

  const hover = useCallback(
    (path: string | null) => {
      setHovered(path);
      onHover?.(path);
    },
    [onHover],
  );

  const isGraded = graded !== undefined;
  const showNew = hints >= 2 || isGraded;

  return (
    <div className="map">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-label={label}>
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 Z" fill="var(--ink-mute)" />
          </marker>
          <marker id="arK" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 Z" fill="var(--ink)" />
          </marker>
        </defs>

        {bands.map((b, r) => {
          const ty = bandTextY(r);
          return (
            <g key={`${r}:${b.l}`}>
              <text className="band-l" x={10} y={ty.l}>
                {b.l}
              </text>
              <text className="band-s" x={10} y={ty.s}>
                {b.s}
              </text>
              {r === 0 ? null : (
                <line className="band-line" x1={G.PADL - 14} x2={W - G.PADR} y1={bandLineY(r)} y2={bandLineY(r)} />
              )}
            </g>
          );
        })}

        {geom.map((e, i) => {
          const rel = hovered !== null && (e.from === hovered || e.to === hovered);
          const cls = cx('edge', e.kind, hovered !== null && (rel ? 'hl' : 'fade'));
          return e.paths.map((d, k) => (
            <path
              key={`${i}:${k}`}
              className={cx(cls, k < e.paths.length - 1 && 'under')}
              data-f={e.from}
              data-t={e.to}
              data-kind={e.kind}
              d={d}
            />
          ));
        })}

        {files.map((f) => {
          const at = pos.get(f.p);
          if (at === undefined) return null;
          return (
            <MapNode
              key={f.p}
              file={f}
              x={at.x}
              y={at.y}
              selected={selected.has(f.p)}
              state={graded?.[f.p] ?? null}
              graded={isGraded}
              showNew={showNew && f.isNew === true}
              onToggle={onToggle}
              onHover={hover}
            />
          );
        })}
      </svg>
    </div>
  );
}
