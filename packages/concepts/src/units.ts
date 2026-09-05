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
import { buildCourse } from './course.js';
import type { ResolvedEdge } from './resolve-imports.js';

export interface UnitOf {
  name: string;
  rootPath: string;
  /** 기능 폐포에서 났나, 디렉터리 규칙에서 났나 (D162 `chapter.origin`). */
  origin: 'entry' | 'dir';
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
    return { name: parts[at + 1] ?? '', rootPath: parts.slice(0, at + 2).join('/'), origin: 'dir' };
  }
  for (const route of ['app', 'pages']) {
    const i = parts.indexOf(route);
    const seg = parts[i + 1];
    if (i !== -1 && seg !== undefined && parts.length > i + 2 && !NOT_A_ROUTE.has(seg)) {
      return { name: seg, rootPath: parts.slice(0, i + 2).join('/'), origin: 'dir' };
    }
  }
  const src = parts.indexOf('src');
  const under = parts[src + 1];
  if (src !== -1 && under !== undefined && parts.length > src + 2 && !NOT_A_UNIT.has(under)) {
    return { name: under, rootPath: parts.slice(0, src + 2).join('/'), origin: 'dir' };
  }
  // 4번: 2단계 디렉터리. 파일 수 조건은 호출자가 본다.
  // 규칙 2·3 이 이름을 보고 물린 것(`api`·`lib`)을 여기서 되살리지 않는다 —
  // 그러면 앞의 규칙이 아무 일도 하지 않은 것이 된다.
  const second = parts[1];
  if (parts.length > 2 && second !== undefined && !NOT_A_UNIT.has(second) && !NOT_A_ROUTE.has(second)) {
    return { name: second, rootPath: parts.slice(0, 2).join('/'), origin: 'dir' };
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
    units.push({ name: OTHER_UNIT, rootPath: '', origin: 'dir' });
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

/**
 * `authService.js` → `auth` · `CoinSchedulerService.java` → `coin`. 접미 `Service`·`Api`·`Client`·
 * `Scheduler` 는 기능 이름이 아니라 층 이름이라 벗긴다(겹쳐 붙은 것도). 첫 글자는 소문자로 —
 * 자바 파일에서 온 이름이 JS 에서 온 이름(`auth`·`dream`)과 같은 모양이어야 홈에서 한 줄로 선다.
 */
function featureName(entry: string): string {
  const base = (entry.split('/').pop() ?? '').replace(/\.[a-z]+$/, '');
  let name = base;
  for (let prev = ''; prev !== name;) {
    prev = name;
    name = name.replace(/(Service|Api|Client|Scheduler)$/, '');
  }
  name = name || base;
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/** HTTP 호출 말고 다른 문으로 들어오는 기능의 시작 파일 — `@Scheduled` 메서드가 있는 파일 (D168). */
export interface EntrySeed { path: string }

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
export function entryUnits(edges: readonly ResolvedEdge[], seeds: readonly EntrySeed[] = []): FeatureUnit[] {
  const out = new Map<string, string[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);

  const candidates = [...new Set([
    ...edges.filter((e) => e.kind === 'http').map((e) => e.from),
    ...seeds.map((s) => s.path),
  ])].sort();
  const closureOf = (entry: string): Set<string> => {
    const seen = new Set<string>([entry]);
    const stack = [entry];
    for (let at = stack.pop(); at !== undefined; at = stack.pop()) {
      for (const next of out.get(at) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    return seen;
  };
  const closures = new Map(candidates.map((c) => [c, closureOf(c)]));
  // **다른 진입점에서 닿는 후보는 진입점이 아니다** (D168). 서버가 서버를 부르는 자리
  // (`FortuneService.java` → FastAPI)도 HTTP 호출이지만, 그 파일은 프론트의 `fortuneService.js`
  // 에서 이미 닿는다 — 자기 대지를 세우면 같은 기능이 둘로 갈린다. 서로 닿으면 큰 쪽이 남는다.
  const dominated = (c: string): boolean => candidates.some((d) => {
    if (d === c || !(closures.get(d) as Set<string>).has(c)) return false;
    const back = (closures.get(c) as Set<string>).has(d);
    if (!back) return true;
    const dc = (closures.get(d) as Set<string>).size - (closures.get(c) as Set<string>).size;
    return dc > 0 || (dc === 0 && d < c);
  });
  const entries = candidates.filter((c) => !dominated(c));
  const units = entries.map((entry) => ({
    name: featureName(entry), entry, files: [...(closures.get(entry) as Set<string>)].sort(),
  }));
  // 위로 한 단 (D163). 폐포는 진입점에서 **아래로만** 가는데, 기능의 일부인데 위쪽에 있는
  // 것이 있다 — Spring 필터 체인이 그렇다(`JwtAuthenticationFilter` 가 `JwtUtil` 을 쓴다).
  //
  // **다만 이 기능만의 파일에서만 올라간다.** 무제한으로 올라가면 공유 부품이 통로가 된다 —
  // 실측에서 `SecurityUtil` 을 일곱 기능이 쓰는 탓에 auth 가 19 → 48 이 되고 컨트롤러 아홉이
  // 딸려 왔다. 자기 것에서만 올라가면 19 → 23 이고 새로 드는 넷이 전부 로그인의 것이다
  // (필터 · 예외 처리기 · 프론트 스토어와 배럴).
  const mine = new Map<string, number>();
  for (const u of units) for (const f of u.files) mine.set(f, (mine.get(f) ?? 0) + 1);
  const callers = new Map<string, string[]>();
  for (const e of edges) callers.set(e.to, [...(callers.get(e.to) ?? []), e.from]);
  for (const u of units) {
    const grown = new Set(u.files);
    for (const f of u.files) {
      if (mine.get(f) !== 1) continue;
      for (const caller of callers.get(f) ?? []) grown.add(caller);
    }
    u.files = [...grown].sort();
  }

  // 이름이 같은 진입점 둘은 큰 쪽이 이긴다 — 홈의 대지 이름은 유일해야 한다.
  units.sort((a, b) => b.files.length - a.files.length || a.entry.localeCompare(b.entry));
  const byName = new Map<string, FeatureUnit>();
  for (const u of units) if (!byName.has(u.name)) byName.set(u.name, u);
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}


export interface PlanOptions {
  /** `proto/` 개념의 근거 낱말. 1번 챕터를 사전이 고르는 데 쓴다 (D162). */
  protoMarks?: readonly string[];
  /** HTTP 말고 다른 문 — `@Scheduled` 가 있는 파일 (D168). */
  entries?: readonly EntrySeed[];
}

/** 기능 대지와 디렉터리 대지를 합친 것 (D160). */
export interface UnitPlan {
  /** 홈에 뜨는 순서 = `order_idx`. 기능이 먼저다. */
  units: UnitOf[];
  /** 파일 경로 → 대지 이름들. **N:M 이다** — 파일 하나가 기능 여럿에 든다. */
  unitsOf: Map<string, string[]>;
}

/**
 * 기능 대지(진입점 폐포)를 먼저 두고, **어느 기능에도 안 든 파일만** 디렉터리 규칙이 받는다.
 *
 * 두 규칙이 경쟁하지 않고 층을 나눈다 (D160). 기능이 못 보는 것 — Spring 필터 체인처럼
 * 런타임에 엮이는 것 — 이 디렉터리 쪽으로 온다. 실측 리포에서 코드 121파일 중 31개가 그랬다.
 *
 * 이름이 겹치면 **기능이 이긴다.** 밀려난 디렉터리 대지의 파일은 「기타」로 간다 —
 * `unit` 의 `UNIQUE (repo_id, name)` 때문에 같은 이름 둘을 세울 수 없다.
 */
export function planUnits(
  paths: readonly string[],
  edges: readonly ResolvedEdge[],
  opts: PlanOptions = {},
): UnitPlan {
  const known = new Set(paths);
  const units: UnitOf[] = [];
  const taken = new Set<string>();
  const unitsOf = new Map<string, string[]>();

  // 챕터 순서를 여기서 매긴다 — `unit.order_idx` 가 곧 코스의 순서다 (D162).
  //
  // 규약 근거는 **경로**에서 찾는다. 인제스트의 TS 층에는 파일 본문이 없고(러스트가 읽어
  // 캡처만 넘긴다) `sites_for_rank` 도 발췌를 안 준다. 실측 리포에서는 `JwtUtil.java` ·
  // `JwtAuthenticationFilter.java` 둘이 걸려 본문으로 셀 때와 **같은 순서**가 나왔다.
  // 이름에 안 드러나는 리포에서는 아무것도 안 걸리고 규칙(새로 여는 파일 적은 순)이 정한다.
  const hits = new Map<string, number>();
  const marks = opts.protoMarks ?? [];
  const features = entryUnits(edges, opts.entries ?? []);
  if (marks.length > 0) {
    for (const u of features) {
      for (const f of u.files) {
        if (!hits.has(f)) hits.set(f, marks.filter((m) => f.includes(m)).length);
      }
    }
  }

  for (const feature of buildCourse(features, { protoHits: hits })) {
    const mine = feature.files.filter((p) => known.has(p));
    if (mine.length === 0) continue;
    // 기능은 파일이 여러 갈래에 흩어져 있다(`BACK/…` 과 `FRONT/…`). 공통 뿌리가 없다.
    units.push({ name: feature.name, rootPath: '', origin: 'entry' });
    taken.add(feature.name);
    for (const path of mine) unitsOf.set(path, [...(unitsOf.get(path) ?? []), feature.name]);
  }

  const rest = paths.filter((p) => !unitsOf.has(p));
  if (rest.length === 0) return { units, unitsOf };

  const dir = assignUnits(rest);
  // **이 패스가 실제로 세운 이름**만 센다. `units` 를 그냥 보면 기능이 먼저 넣은 같은 이름에
  // 걸려, 밀려나야 할 디렉터리 파일이 그 기능 안으로 들어간다.
  const dirNames = new Set<string>();
  const dropped: string[] = [];
  for (const unit of dir.units) {
    if (taken.has(unit.name)) continue;
    units.push(unit);
    taken.add(unit.name);
    dirNames.add(unit.name);
  }
  for (const [path, name] of dir.byPath) {
    if (dirNames.has(name)) unitsOf.set(path, [name]);
    else dropped.push(path);
  }
  if (dropped.length > 0) {
    if (!taken.has(OTHER_UNIT)) {
      units.push({ name: OTHER_UNIT, rootPath: '', origin: 'dir' });
      taken.add(OTHER_UNIT);
    }
    for (const path of dropped) unitsOf.set(path, [OTHER_UNIT]);
  }
  return { units, unitsOf };
}
