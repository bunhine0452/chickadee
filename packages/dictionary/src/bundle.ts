/**
 * 번들 사전 — Vite 가 빌드 때 `dictionary/**` 의 원문을 JS 에 굽는다 (D66).
 *
 * 왜 명령이 아니라 번들인가: MVP 에 남는 경로는 읽기 전용 번들 하나뿐이고(00 §6-6),
 * 그것을 Rust 명령으로 돌리면 파일 읽기·리소스 경로 해석·오류 코드가 예산에서 나가는데
 * 얻는 것이 없다. 번들에 구우면 사전이 타입 검사와 해시의 대상이 된다.
 *
 * 키는 리포 루트 기준 `dictionary/<lang>/<file>` 이다.
 */

declare global {
  // Vite 가 빌드 때 채운다. 모듈 안에 두는 이유: 별도 `.d.ts` 는 이 패키지를 원본으로
  // 컴파일하는 다른 패키지의 tsconfig 에 들어가지 않는다.
  interface ImportMeta {
    glob(
      pattern: string,
      options: { query: string; import: string; eager: true },
    ): Record<string, string>;
  }
}

const RAW = import.meta.glob('../../../dictionary/**/*.{yaml,scm}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

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
 * 번들에 든 네임스페이스 전부. `_lang.yaml` 은 **있어도 되고 없어도 된다** —
 * `common/`·`arch/` 는 개념만 있는 네임스페이스이고 문법에 매이지 않는다 (03 §3.1·§4.1).
 * 03 §4.1 의 그림에도 `common/` 에는 `_lang.yaml` 이 없다.
 */
export function bundledLangs(): string[] {
  const out = new Set<string>();
  for (const rel of FILES.keys()) {
    const [lang, file] = rel.split('/');
    if (lang !== undefined && file !== undefined && file.endsWith('.yaml')) out.add(lang);
  }
  return [...out].sort();
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
