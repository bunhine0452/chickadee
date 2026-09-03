/**
 * 성능 표 (06 §8 — 「설정 화면 「성능」 절에서 표로 본다」).
 *
 * `perf_sample` 은 최근 500행 순환이므로 이 표가 보는 것은 **추세**이지 이력이 아니다.
 * 예산은 05 §10 의 것이고 넘은 값에 표시를 남긴다 — 여기서 목표를 낮추지 않는다.
 */
import { BUDGET, type Mark } from '../../devtools/audit.js';

export interface PerfRow {
  kind: string;
  ms: number;
}

/** 06 §8 이 적은 `kind` 값들의 사람 이름. 모르는 이름은 그대로 보인다. */
const KIND_NAMES: Record<string, string> = {
  'ingest.total': '인제스트 총',
  'ingest.file_p95': '파일당 파싱 p95',
  queue: '큐 생성',
  't1.grade': 'T1 채점',
  frame_p95: '홈 프레임 p95',
  'home:paint': '홈 첫 조판',
  'session:mount': '세션 열기',
  't0:grade': 'T0 채점',
  't1:monaco': 'T1 편집기',
  'theme:switch': '공정 전환',
  'lifer:open': 'LIFER 열기',
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
        label: KIND_NAMES[kind] ?? kind,
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
    return <p className="set-empty">아직 잰 것이 없습니다. 리포를 읽거나 판을 찍으면 쌓입니다.</p>;
  }
  return (
    <div className="set-tablewrap">
      <table className="set-table">
        <caption>최근 표본 {rows.length}건 (밀리초)</caption>
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">표본</th>
            <th scope="col">p50</th>
            <th scope="col">p95</th>
            <th scope="col">최대</th>
            <th scope="col">예산</th>
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
