/**
 * 번들 사전 — Vite 가 빌드 때 `dictionary/**` 의 원문을 JS 에 굽는다 (D66).
 *
 * 왜 명령이 아니라 번들인가: MVP 에 남는 경로는 읽기 전용 번들 하나뿐이고(00 §6-6),
 * 그것을 Rust 명령으로 돌리면 파일 읽기·리소스 경로 해석·오류 코드가 예산에서 나가는데
 * 얻는 것이 없다. 번들에 구우면 사전이 타입 검사와 해시의 대상이 된다.
 *
 * 키는 리포 루트 기준 `dictionary/<lang>/<file>` 이다.
 */

/**
 * Vite 가 빌드 때 채우는 `import.meta.glob`.
 *
 * 전역 선언(`declare global`) 대신 **국소 캐스트**를 쓴다: 전역으로 선언하면
 * `vite/client` 타입이 이미 있는 패키지(앱)에서 중복 선언이 되고, 별도 `.d.ts` 로 두면
 * 이 패키지를 **원본으로** 컴파일하는 다른 패키지(`concepts`)의 tsconfig 에 들어가지 않는다.
 * 캐스트는 타입을 지우고 나면 `import.meta.glob(...)` 그대로라 Vite 의 변환도 그대로 걸린다.
 */
type Globber = { glob(p: string, o: { query: string; import: string; eager: true }): Record<string, string> };

const RAW = (import.meta as unknown as Globber).glob('../../../dictionary/**/*.{yaml,scm}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** `../../../dictionary/ts/_lang.yaml` → `ts/_lang.yaml` */
function relOf(key: string): string | null {
  const at = key.indexOf('/dictionary/');
  return at === -1 ? null : key.slice(at + '/dictionary/'.length);
}

const FILES: ReadonlyMap<string, string> = new Map(
  Object.entries(RAW)
    .map(([key, text]) => [relOf(key), text] as const)
    .filter((pair): pair is readonly [string, string] => pair[0] !== null),
);

/**
 * `dictionary/` 아래에 살지만 **개념이 아닌** 네임스페이스. 여기 든 이름은 `loadDict` 가
 * 아예 안 본다 — 그 파일들은 개념 스키마를 만족하지 않으므로 로더에 걸리면 문제 목록이
 * 그것으로 채워진다 (`dict.test.ts` 의 「스키마를 어긴 파일이 없다」).
 *
 * `drills/` 가 그 하나다. 작은 문제 층의 문제 YAML 이고 (D186 ⑧), 사전과 같은 자리에 사는
 * 이유는 같은 것이기 때문이다 — 사람이 손으로 쓴 **한국어 정본 + 영어 병기** 내용이고
 * 번들에 구워져 타입 검사와 해시의 대상이 된다.
 */
const NOT_CONCEPTS = new Set(['drills']);

/**
 * 번들에 든 네임스페이스 전부. `_lang.yaml` 은 **있어도 되고 없어도 된다** —
 * `common/`·`arch/` 는 개념만 있는 네임스페이스이고 문법에 매이지 않는다 (03 §3.1·§4.1).
 * 03 §4.1 의 그림에도 `common/` 에는 `_lang.yaml` 이 없다.
 */
export function bundledLangs(): string[] {
  const out = new Set<string>();
  for (const rel of FILES.keys()) {
    const [lang, file] = rel.split('/');
    if (lang === undefined || file === undefined || !file.endsWith('.yaml')) continue;
    if (NOT_CONCEPTS.has(lang)) continue;
    out.add(lang);
  }
  return [...out].sort();
}

/**
 * 작은 문제 층의 원문 (D186 ⑧). 키는 `drills/<id>/drill.yaml` 이고 파싱은 부르는 쪽
 * (`packages/cards/src/drill.ts`)이 한다 — 사전 로더와 스키마가 다르다.
 */
export function bundledDrills(): { relPath: string; text: string }[] {
  return [...FILES.entries()]
    .filter(([rel]) => rel.startsWith('drills/') && rel.endsWith('.yaml'))
    .map(([relPath, text]) => ({ relPath, text }))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));
}

/** 언어 하나의 모든 원문. 파싱은 `load.ts` 가 한다 (Rust 는 YAML 을 읽지 않는다 — D40). */
export function bundledFiles(lang: string): { relPath: string; text: string }[] {
  const prefix = `${lang}/`;
  return [...FILES.entries()]
    .filter(([rel]) => rel.startsWith(prefix))
    .map(([relPath, text]) => ({ relPath, text }))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));
}

/** 파일 하나. `.scm` 을 개념 파일에서 상대 경로로 가리킬 때 쓴다. */
export function bundledFile(rel: string): string | undefined {
  return FILES.get(rel);
}
