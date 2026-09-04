/**
 * 대지(unit) 탐지 (03 §6.5 · D29). 대지 = 내 리포의 기능 하나 = 홈의 인쇄 시트 한 장.
 *
 * `source='dir'` 만 MVP 다. 커밋 클러스터링은 더 나은 답을 줄 수 있지만 커밋이 적은
 * 리포에서 무너지고, 디렉터리는 바이브 코딩 산출물에서도 거의 항상 있다.
 *
 * **디렉터리 규칙은 층으로 나눈 리포에서 무너진다** (D160). Spring 은 package-by-layer 라
 * `BACK/src/main/java/…` 가 전부 `src` 다음 조각인 `main` 으로 뭉친다 — 실측한 리포에서
 * 대지 하나가 백엔드 107파일을 통째로 삼켰다. {@link entryUnits} 가 그 답이다.
 */
import type { ResolvedEdge } from './resolve-imports.js';

export interface UnitOf {
  name: string;
  rootPath: string;
}

/** 규칙 3번이 대지로 치지 않는 이름 — 기능이 아니라 창고다. */
const NOT_A_UNIT = new Set(['lib', 'utils', 'util', 'types', 'helpers', 'constants', 'styles']);
/** Next 라우트에서 대지가 아닌 첫 세그먼트. */
const NOT_A_ROUTE = new Set(['api']);
/** 규칙 4번 — 2단계 디렉터리가 대지가 되려면 이만큼은 있어야 한다. */
export const MIN_FILES_FOR_UNIT = 3;
/** 어디에도 안 드는 파일이 모이는 곳. */
export const OTHER_UNIT = '기타';

/**
 * 파일 하나가 어느 대지에 드는가. 첫 매치가 이긴다 (03 §6.5).
 * 4번 규칙은 파일 수를 봐야 하므로 여기서는 후보만 돌려주고 `assignUnits` 가 거른다.
 */
function candidate(path: string): UnitOf | null {
  const parts = path.split('/');
  const at = parts.indexOf('features');
  if (at !== -1 && parts[at + 1] !== undefined && parts.length > at + 2) {
    return { name: parts[at + 1] ?? '', rootPath: parts.slice(0, at + 2).join('/') };
  }
  for (const route of ['app', 'pages']) {
    const i = parts.indexOf(route);
    const seg = parts[i + 1];
    if (i !== -1 && seg !== undefined && parts.length > i + 2 && !NOT_A_ROUTE.has(seg)) {
      return { name: seg, rootPath: parts.slice(0, i + 2).join('/') };
    }
  }
  const src = parts.indexOf('src');
  const under = parts[src + 1];
  if (src !== -1 && under !== undefined && parts.length > src + 2 && !NOT_A_UNIT.has(under)) {
    return { name: under, rootPath: parts.slice(0, src + 2).join('/') };
  }
  // 4번: 2단계 디렉터리. 파일 수 조건은 호출자가 본다.
  // 규칙 2·3 이 이름을 보고 물린 것(`api`·`lib`)을 여기서 되살리지 않는다 —
  // 그러면 앞의 규칙이 아무 일도 하지 않은 것이 된다.
  const second = parts[1];
  if (parts.length > 2 && second !== undefined && !NOT_A_UNIT.has(second) && !NOT_A_ROUTE.has(second)) {
    return { name: second, rootPath: parts.slice(0, 2).join('/') };
  }
  return null;
}

export interface Assignment {
  units: UnitOf[];
  /** 파일 경로 → 대지 이름. 1:1 이다 (03 §6.5). */
  byPath: Map<string, string>;
}

export function assignUnits(paths: readonly string[]): Assignment {
  const hits = new Map<string, { unit: UnitOf; paths: string[] }>();
  const leftover: string[] = [];
  for (const path of paths) {
    const unit = candidate(path);
    if (!unit || unit.name === '') {
      leftover.push(path);
      continue;
    }
    const at = hits.get(unit.name) ?? { unit, paths: [] };
    at.paths.push(path);
    hits.set(unit.name, at);
  }

  const units: UnitOf[] = [];
  const byPath = new Map<string, string>();
  for (const { unit, paths: mine } of hits.values()) {
    // 파일이 셋도 안 되는 디렉터리는 기능이라기보다 흩어진 파일이다.
    if (mine.length < MIN_FILES_FOR_UNIT) {
      leftover.push(...mine);
      continue;
    }
    units.push(unit);
    for (const path of mine) byPath.set(path, unit.name);
  }
  if (leftover.length > 0) {
    units.push({ name: OTHER_UNIT, rootPath: '' });
    for (const path of leftover) byPath.set(path, OTHER_UNIT);
  }
  units.sort((a, b) => (a.name === OTHER_UNIT ? 1 : 0) - (b.name === OTHER_UNIT ? 1 : 0)
    || a.name.localeCompare(b.name));
  return { units, byPath };
}


/** 진입점 하나에서 도달하는 기능 하나 (D160). */
export interface FeatureUnit {
  /** 홈에 뜨는 이름. 진입 파일 이름에서 뽑는다 — `authService.js` → `auth`. */
  name: string;
  /** 프론트에서 백을 부른 자리. 이 기능의 시작이다. */
  entry: string;
  /** 도달하는 파일 전부(진입 파일 포함). 경로 오름차순. */
  files: string[];
}

/** `authService.js` → `auth`. 접미 `Service`·`Api`·`Client` 는 기능 이름이 아니다. */
function featureName(entry: string): string {
  const base = (entry.split('/').pop() ?? '').replace(/\.[a-z]+$/, '');
  return base.replace(/(Service|Api|Client)$/, '') || base;
}

/**
 * **기능 = HTTP 진입점에서 도달하는 것** (D160).
 *
 * 프론트가 백을 부른 자리(`kind === 'http'` 인 엣지의 `from`)를 시작으로 삼아 엣지를 따라간
 * 폐포가 기능 하나다. 「로그인 기능 하나를 만들려고 어떤 코드들이 유기적으로 연결되어
 * 있는가」에 그래프가 직접 답한다.
 *
 * 커밋 클러스터링 대신 이것을 고른 이유는 **결정적**이라서다 — 커밋 위생에 안 기댄다.
 * 대가는 **런타임 배선을 못 본다**는 것이다: Spring 의 필터 체인(`SecurityConfig` ·
 * `JwtAuthenticationFilter`)은 컨트롤러가 import 하지 않아 어느 폐포에도 안 든다.
 * 실측 리포에서 코드 121파일 중 31개가 그렇게 남았고, 그것들은 디렉터리 규칙이 받는다.
 *
 * **돌려주는 것은 N:M 이다** — 파일 하나가 기능 여럿에 들 수 있다. 실측에서 90파일 중
 * 13개가 그랬고(`UserDao` 는 로그인이자 회원정보다), 1:1 로 접으면 어느 쪽으로 접어도
 * 정보가 사라진다. `unit_file` 의 기본키가 `(unit_id, file_id)` 라 저장은 이미 N:M 이다.
 */
export function entryUnits(edges: readonly ResolvedEdge[]): FeatureUnit[] {
  const out = new Map<string, string[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);

  const entries = [...new Set(edges.filter((e) => e.kind === 'http').map((e) => e.from))];
  const units = entries.map((entry) => {
    const seen = new Set<string>([entry]);
    const stack = [entry];
    for (let at = stack.pop(); at !== undefined; at = stack.pop()) {
      for (const next of out.get(at) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    return { name: featureName(entry), entry, files: [...seen].sort() };
  });
  // 이름이 같은 진입점 둘은 큰 쪽이 이긴다 — 홈의 대지 이름은 유일해야 한다.
  units.sort((a, b) => b.files.length - a.files.length || a.entry.localeCompare(b.entry));
  const byName = new Map<string, FeatureUnit>();
  for (const u of units) if (!byName.has(u.name)) byName.set(u.name, u);
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
