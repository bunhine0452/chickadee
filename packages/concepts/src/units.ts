/**
 * 대지(unit) 탐지 (03 §6.5 · D29). 대지 = 내 리포의 기능 하나 = 홈의 인쇄 시트 한 장.
 *
 * `source='dir'` 만 MVP 다. 커밋 클러스터링은 더 나은 답을 줄 수 있지만 커밋이 적은
 * 리포에서 무너지고, 디렉터리는 바이브 코딩 산출물에서도 거의 항상 있다.
 */

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
