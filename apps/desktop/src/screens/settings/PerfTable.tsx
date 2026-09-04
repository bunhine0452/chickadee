/**
 * 성능 표 (06 §8 — 「설정 화면 「성능」 절에서 표로 본다」).
 *
 * `perf_sample` 은 최근 500행 순환이므로 이 표가 보는 것은 **추세**이지 이력이 아니다.
 * 예산은 05 §10 의 것이고 넘은 값에 표시를 남긴다 — 여기서 목표를 낮추지 않는다.
 */
import { t, type MessageKey } from '@chickadee/i18n';

import { BUDGET, type Mark } from '../../devtools/audit.js';

export interface PerfRow {
  kind: string;
  ms: number;
}

/**
 * 06 §8 이 적은 `kind` 값들의 사람 이름. 모르는 이름은 그대로 보인다.
 * 표가 문장이 아니라 **키**를 드는 이유는 로케일이다 (D117).
 */
const KIND_KEY: Record<string, MessageKey> = {
  'ingest.total': 'settings.perf.kindIngestTotal',
  'ingest.file_p95': 'settings.perf.kindIngestFileP95',
  queue: 'settings.perf.kindQueue',
  't1.grade': 'settings.perf.kindT1Grade',
  frame_p95: 'settings.perf.kindFrameP95',
  'home:paint': 'settings.perf.kindHomePaint',
  'session:mount': 'settings.perf.kindSessionMount',
  't0:grade': 'settings.perf.kindT0Grade',
  't1:monaco': 'settings.perf.kindT1Monaco',
  'theme:switch': 'settings.perf.kindThemeSwitch',
  'lifer:open': 'settings.perf.kindLiferOpen',
};

const kindLabel = (kind: string): string => {
  const key = KIND_KEY[kind];
  return key === undefined ? kind : t(key);
};

export interface PerfStat {
  kind: string;
  label: string;
  n: number;
  p50: number;
  p95: number;
  max: number;
  budget: number | null;
}

/** 오름차순 표본에서 백분위. 표본이 적어도 값을 내야 하므로 최근접을 쓴다. */
function pct(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const at = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * q)));
  return sorted[at] ?? 0;
}

/** 표본을 `kind` 로 묶어 표 한 줄씩 만든다. 순수 함수 — 테스트가 여기를 잡는다. */
export function summarize(rows: readonly PerfRow[]): PerfStat[] {
  const byKind = new Map<string, number[]>();
  for (const row of rows) {
    const at = byKind.get(row.kind);
    if (at === undefined) byKind.set(row.kind, [row.ms]);
    else at.push(row.ms);
  }
  return [...byKind.entries()]
    .map(([kind, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return {
        kind,
        label: kindLabel(kind),
        n: sorted.length,
        p50: pct(sorted, 0.5),
        p95: pct(sorted, 0.95),
        max: sorted[sorted.length - 1] ?? 0,
        budget: kind in BUDGET ? BUDGET[kind as Mark] : null,
      };
    })
    .sort((a, b) => (a.kind < b.kind ? -1 : 1));
}

const ms = (n: number): string => `${n.toFixed(1)}`;

export function PerfTable({ rows }: { rows: readonly PerfRow[] }) {
  const stats = summarize(rows);
  if (stats.length === 0) {
    return <p className="set-empty">{t('settings.perf.empty')}</p>;
  }
  return (
    <div className="set-tablewrap">
      <table className="set-table">
        <caption>{t('settings.perf.caption', { n: String(rows.length) })}</caption>
        <thead>
          <tr>
            <th scope="col">{t('settings.perf.colItem')}</th>
            <th scope="col">{t('settings.perf.colSamples')}</th>
            <th scope="col">p50</th>
            <th scope="col">p95</th>
            <th scope="col">{t('settings.perf.colMax')}</th>
            <th scope="col">{t('settings.perf.colBudget')}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.kind} data-over={s.budget !== null && s.p95 > s.budget ? 'on' : 'off'}>
              <th scope="row">{s.label}</th>
              <td>{s.n}</td>
              <td>{ms(s.p50)}</td>
              <td>{ms(s.p95)}</td>
              <td>{ms(s.max)}</td>
              <td>{s.budget === null ? '—' : s.budget}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
