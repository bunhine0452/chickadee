/**
 * 화면 전수 스크린샷 게이트 (D186 ② · 정본 §10).
 *
 * **이 게이트는 그림이 예쁜지를 재지 않는다.** 재는 것은 셋이다.
 *
 *   ① 목록 × 폭 셋 × 테마 둘이 **한 장도 빠짐없이** 있다.
 *   ② 어느 그림도 0바이트가 아니고 **빈 화면이 아니다**(픽셀 분산 하한).
 *   ③ 화면 목록이 **코드보다 뒤처지지 않았다** — 라우트와 판 유형을 소스에서 읽어
 *      새로 생긴 것이 목록에 없으면 여기서 걸린다.
 *
 * ③ 이 이 게이트의 값어치다. ①②만 재면 「목록에서 빼면 초록」이 되고, 그러면 전수라는
 * 말이 매달 조금씩 줄어든다. 목록에 못 넣는 것은 `NOT_SHOT` 에 **사유와 함께** 남긴다.
 *
 * 다시 찍는 법: `pnpm shots` (= `node --import tsx scripts/shoot-screens.mjs`).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from '@playwright/test';

// **목록의 출처를 둘로 만들지 않으려고** 찍는 쪽 모듈을 그대로 들여온다 — 게이트가 자기
// 사본을 들면 찍는 쪽과 재는 쪽이 조용히 갈라진다. `--list` 외의 부수 효과는 없다
// (모듈 끝의 `main()` 은 `process.argv[1]` 이 그 스크립트일 때만 돈다).
import * as shooter from '../../scripts/shoot-screens.mjs';

const { SCREENS, WIDTHS, THEMES, RENDERER_OF, NOT_SHOT, shotName } = shooter;

function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('워크스페이스 뿌리를 못 찾았다');
}

const ROOT = repoRoot();
const DIR = join(ROOT, shooter.SHOTS_DIR);

const shootable = SCREENS.filter((s) => s.open !== undefined);
const expected = shootable.length * WIDTHS.length * THEMES.length;

// ───────── ① 전수 ─────────

test('그림 수 = 화면 × 폭 셋 × 테마 둘', () => {
  const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.png')) : [];
  const want = new Set(
    shootable.flatMap((s) => THEMES.flatMap((t) => WIDTHS.map((w) => shotName(s.id, t, w)))),
  );
  const missing = [...want].filter((f) => !files.includes(f));
  // 남는 그림도 걸린다 — 화면 이름을 바꾸고 옛 그림을 안 지우면 색인이 거짓말을 한다.
  const extra = files.filter((f) => !want.has(f));
  expect(missing, `없는 그림 ${missing.length}장:\n  ${missing.join('\n  ')}\n다시 찍어라: pnpm shots`)
    .toEqual([]);
  expect(extra, `목록에 없는 그림 ${extra.length}장 — 이름이 바뀌었으면 지워라:\n  ${extra.join('\n  ')}`)
    .toEqual([]);
  expect(files.length).toBe(expected);
});

// ───────── ② 빈 화면이 아니다 ─────────

/**
 * 픽셀 분산 하한(160×90 으로 줄여 잰 밝기 표준편차). 값의 근거는 실측이다 — 바탕 한 색인
 * 빈 화면은 0 이고, 이 리포에서 가장 조용한 **진짜** 그림(인제스트 · 2560)이 **7.3** 이었다.
 * 4 는 그 아래이고 0 보다는 위다: 잡으려는 것은 「글자가 몇 줄 없다」가 아니라 「아무것도
 * 안 그려졌다」이고, 넓은 창의 성긴 화면을 위반으로 세면 게이트가 디자인을 재기 시작한다.
 */
const MIN_STDDEV = 4;

/** 0바이트는 물론이고 몇백 바이트짜리 PNG 도 화면이 아니다. */
const MIN_BYTES = 2_000;

test('어느 그림도 0바이트·빈 화면이 아니다', async ({ page, browserName }) => {
  // 픽셀은 엔진과 무관하다 — 두 엔진에서 같은 파일을 두 번 디코드할 이유가 없다.
  test.skip(browserName !== 'chromium', '픽셀 검사는 파일의 성질이라 엔진마다 되풀이하지 않는다');
  test.setTimeout(120_000);

  const files = readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();
  expect(files.length).toBeGreaterThan(0);

  await page.setContent('<canvas id="c"></canvas>');
  const tiny: string[] = [];
  const flat: string[] = [];

  for (const file of files) {
    const path = join(DIR, file);
    if (statSync(path).size < MIN_BYTES) {
      tiny.push(`${file} (${statSync(path).size}B)`);
      continue;
    }
    const b64 = readFileSync(path).toString('base64');
    // 160×90 으로 줄여 재는 이유: 2560×2000 을 그대로 훑으면 144장에 분 단위가 된다.
    // 「아무것도 안 그려졌다」는 축소해도 그대로 0 이다.
    const sd = await page.evaluate(async (data: string) => {
      const res = await fetch(`data:image/png;base64,${data}`);
      const bmp = await createImageBitmap(await res.blob());
      const cv = document.getElementById('c') as HTMLCanvasElement;
      cv.width = 160;
      cv.height = 90;
      const ctx = cv.getContext('2d');
      if (ctx === null) return -1;
      ctx.drawImage(bmp, 0, 0, 160, 90);
      const { data: px } = ctx.getImageData(0, 0, 160, 90);
      let sum = 0;
      let sq = 0;
      const n = px.length / 4;
      for (let i = 0; i < px.length; i += 4) {
        const l = 0.2126 * (px[i] ?? 0) + 0.7152 * (px[i + 1] ?? 0) + 0.0722 * (px[i + 2] ?? 0);
        sum += l;
        sq += l * l;
      }
      return Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2));
    }, b64);
    if (sd < MIN_STDDEV) flat.push(`${file} (분산 ${sd.toFixed(1)})`);
  }

  expect(tiny, `너무 작은 그림:\n  ${tiny.join('\n  ')}`).toEqual([]);
  expect(flat, `빈 화면으로 보이는 그림:\n  ${flat.join('\n  ')}`).toEqual([]);
});

// ───────── ③ 목록이 코드보다 뒤처지지 않았다 ─────────

const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

/** `export type X = 'a' | 'b' | …;` 에서 따옴표 안의 이름만. 줄바꿈을 넘어 읽는다. */
function unionOf(source: string, name: string): string[] {
  const at = source.indexOf(`export type ${name} =`);
  if (at < 0) throw new Error(`${name} 을 소스에서 못 찾았다 — 이름이 바뀌었으면 게이트를 고쳐라`);
  const end = source.indexOf(';', at);
  return [...source.slice(at, end).matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
}

test('라우트가 하나도 빠지지 않았다', () => {
  const routes = unionOf(read('apps/desktop/src/store.ts'), 'Screen');
  // 코스는 `Screen` 이 아니라 `useCourse.open` 이 세우는 화면이다 (D171) — 열거에 더한다.
  const all = [...routes, 'course'];
  const covered = new Set(SCREENS.map((s) => s.route).filter((r): r is string => r !== undefined));
  const missing = all.filter((r) => !covered.has(r));
  expect(missing, `그림이 없는 화면: ${missing.join(' · ')} — scripts/shoot-screens.mjs 의 SCREENS 에 더하라`)
    .toEqual([]);
  // 반대편 — 없는 라우트를 가리키는 항목은 목록이 낡았다는 뜻이다.
  const unknown = [...covered].filter((r) => !all.includes(r));
  expect(unknown, `없는 라우트를 가리킨다: ${unknown.join(' · ')}`).toEqual([]);
});

test('판 유형이 하나도 빠지지 않았다', () => {
  const types = unionOf(read('packages/cards/src/stage-types.ts'), 'StageType');
  expect(types.length).toBeGreaterThan(10);
  const unmapped = types.filter((t) => RENDERER_OF[t] === undefined);
  expect(unmapped, `그리는 판을 모르는 유형: ${unmapped.join(' · ')} — RENDERER_OF 에 자리를 만들어라`)
    .toEqual([]);

  const shotRenderers = new Set(SCREENS.map((s) => s.renders).filter((r): r is string => r !== undefined));
  const needed = [...new Set(types.map((t) => RENDERER_OF[t] as string))];
  const missing = needed.filter((r) => !shotRenderers.has(r));
  expect(missing, `그림이 없는 판: ${missing.join(' · ')}`).toEqual([]);
});

test('T0 판 종류가 하나도 빠지지 않았다', () => {
  // `CardPayload` 의 t0 갈래. 유형 셋 다 `ChoicePlate` 한 장으로 그려지고, 그 한 장이 `t0-ask` 다.
  // `kind:` **그 줄만** 읽는다 — 블록 전체를 읽으면 바로 위의 `track: z.literal('t0')` 이 딸려 온다.
  const src = read('packages/store-sql/src/schemas.ts');
  const at = src.indexOf('const t0PayloadSchema');
  const kindAt = src.indexOf('kind:', at);
  const line = src.slice(kindAt, src.indexOf('\n', kindAt));
  const kinds = [...line.matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
  expect(kinds.sort()).toEqual(['blank', 'meaning', 'point']);
  expect(SCREENS.some((s) => s.id === 't0-ask')).toBe(true);
});

// ───────── 정직성 (D186 ④) ─────────

test('못 찍는 것에는 사유가 있다', () => {
  expect(NOT_SHOT.length).toBeGreaterThan(0);
  const thin = NOT_SHOT.filter((e) => e.what.trim().length < 4 || e.why.trim().length < 40);
  expect(thin, `사유가 없거나 너무 짧다: ${JSON.stringify(thin)}`).toEqual([]);
});

test('README 색인이 화면 전부를 싣는다', () => {
  const readme = read(join(shooter.SHOTS_DIR, 'README.md'));
  const missing = SCREENS.filter((s) => !readme.includes(s.id)).map((s) => s.id);
  expect(missing, `색인에 없는 화면: ${missing.join(' · ')}`).toEqual([]);
  // 그림을 실제로 거는지 — 이름만 적힌 색인은 사람이 한 번에 볼 수 없다.
  const sample = shotName(shootable[0]?.id ?? '', THEMES[0] ?? '', WIDTHS[0] ?? 0);
  expect(readme).toContain(sample);
});
