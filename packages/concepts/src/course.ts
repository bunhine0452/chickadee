/**
 * 코스 — 기능을 챕터로 세우고 순서를 매긴다 (D162 · `docs/program/course.md` §2).
 *
 * 순서는 두 규칙이다.
 *
 * **① 첫 챕터는 새로 여는 파일이 가장 적은 것.** 뼈대를 작은 데서 본다.
 *
 * `course.md` §2 는 로그인을 1번으로 고정하자고 했다 — 나머지 일곱이 컨트롤러 첫 줄에서
 * `SecurityUtil.getCurrentUserId()` 를 부르므로 로그인을 모르면 그 줄이 안 읽힌다는 이유다.
 * **그 판단은 의미론이고 그래프가 못 본다.** 지표 셋을 재 봤고 전부 다른 챕터를 골랐다:
 * 겹치는 파일 수 · 들어오는 간선 · 공유 비율은 셋 다 **「내가 남에게 의존하는 정도」**를 재지
 * 「남이 나에게 의존하는 정도」를 안 잰다. 실측이 그것을 드러냈다 — `dreamResult` 는 28파일 중
 * 자기 것이 **3장**뿐(공유 0.89)이라 남의 것에 얹혀 있고, 그 탓에 세 지표에서 다 1번이 됐다.
 * `SecurityUtil`(7챕터)·`api.js`(8챕터) 같은 공유 부품에는 **폐포 의미론상 주인이 없다.**
 *
 * 그래서 그래프에 지표를 하나 더 만들지 않고 **사전에 물어본다** — 규약(`proto/`)의 근거
 * 낱말이 가장 많이 보이는 챕터가 1번이다. JWT·토큰을 다루는 기능이 먼저라는 규칙이고,
 * 그 판단은 코드의 모양이 아니라 **무엇에 대한 코드인가**에서 온다.
 * 사람이 `first` 로 직접 고정할 수도 있다.
 *
 * **② 그다음은 새로 여는 파일이 적은 순.** 앞 챕터가 이미 연 파일은 다시 안 센다 —
 * 뼈대를 1번에서 배우고 그 뼈대의 최소형을 다음에 본다. 동점은 이름으로 끊는다.
 */
import type { FeatureUnit } from './units.js';

export interface Chapter extends FeatureUnit {
  /** 1부터. 홈과 `chapter.order_idx` 가 이 순서를 쓴다. */
  order: number;
  /** 이 챕터가 **처음** 여는 파일 — 앞 챕터가 안 연 것. 챕터의 실제 무게다. */
  opens: string[];
}

export interface CourseOptions {
  /** 사람이 1번으로 못박은 챕터. `protoHits` 보다 우선한다. */
  first?: string;
  /**
   * 파일 → 그 파일에서 보인 규약(`proto/`) 근거 낱말 수.
   *
   * **이 기능만의 파일에서만 센다.** 공유 파일로 세면 전부 동점이 된다 — `api.js` 하나에
   * `accessToken` 이 있고 그 파일은 여덟 챕터가 다 갖고 있다.
   */
  protoHits?: ReadonlyMap<string, number>;
}

/** 이 챕터만의 파일에 보인 규약 근거 수. 공유 파일은 안 센다. */
function protoScore(
  unit: FeatureUnit,
  mine: ReadonlyMap<string, number>,
  hits: ReadonlyMap<string, number>,
): number {
  return unit.files.reduce(
    (n, f) => (mine.get(f) === 1 ? n + (hits.get(f) ?? 0) : n),
    0,
  );
}

export function buildCourse(units: readonly FeatureUnit[], opts: CourseOptions = {}): Chapter[] {
  if (units.length === 0) return [];
  const left = [...units];
  const out: Chapter[] = [];
  const opened = new Set<string>();

  let pinned = left.findIndex((u) => u.name === opts.first);
  if (pinned < 0 && opts.protoHits !== undefined) {
    const mine = new Map<string, number>();
    for (const u of units) for (const f of u.files) mine.set(f, (mine.get(f) ?? 0) + 1);
    const scored = left
      .map((u) => [u, protoScore(u, mine, opts.protoHits as ReadonlyMap<string, number>)] as const)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name));
    if (scored.length > 0) pinned = left.indexOf(scored[0]?.[0] as FeatureUnit);
  }
  if (pinned > 0) left.unshift(...left.splice(pinned, 1));

  for (let order = 1; left.length > 0; order += 1) {
    // 새로 여는 파일이 적은 순. 앞 챕터가 이미 연 것은 다시 안 센다 — 뼈대를 작은 데서 보고
    // 그 위에 쌓는다. 1번을 사람이 고정했으면 그것만 건너뛴다.
    if (order > 1 || pinned < 0) {
      left.sort((a, b) =>
        a.files.filter((f) => !opened.has(f)).length - b.files.filter((f) => !opened.has(f)).length
        || a.name.localeCompare(b.name));
    }
    const next = left.shift() as FeatureUnit;
    const opens = next.files.filter((f) => !opened.has(f));
    for (const f of opens) opened.add(f);
    out.push({ ...next, order, opens });
  }
  return out;
}
