/**
 * 정직성 게이트 (D186 ④) — **앱이 못 하는 것을 화면이 말하는가**.
 *
 * 넷을 잰다. 넷 다 「문구가 카탈로그에 있다」로는 모자라다 — 카탈로그에만 있고 아무도
 * 안 부르는 문구가 실제로 있었다(`t0.absent*` 넷은 2026-09-05 감사 때까지 화면에서 한 번도
 * 안 나왔다). 그래서 **키가 ko·en 둘 다 있고, 화면 컴포넌트가 그 키를 실제로 부른다**를
 * 한 쌍으로 본다.
 *
 *   ① 「네 코드엔 없다」 — 사전 예제로 구운 판 (`t0.absent*` · `t0.syntheticSource`)
 *   ② 「답이 없다」 — 미정의 동작. 형식이 아직 이것을 담지 못하므로 **카탈로그 항목만** 본다
 *      (D186 ④ · 사전 `cs/undefined-behavior`).
 *   ③ 「러너 없음 · 방언 미지원」 — `RunnerReason` **전부**
 *   ④ 「값 추적을 굽지 못했다」 — `chapter.traceMissing`
 *
 * **이 게이트가 못 잡는 것을 먼저 적는다** (`e2e-selectors.test.ts` 와 같은 태도).
 * 정적 대조는 「키가 소스에 글자로 있다」까지만 본다: 그 자리가 화면에서 안 보이게 됐거나
 * (`display:none`·조건이 영영 거짓) 조건이 틀린 것은 못 본다. 그래서 ①은 하네스로 합성 판을
 * 실제로 띄워 **문구가 보이는 것까지** 확인한다 — 나머지 셋의 갈래는 시드에 재료가 없다
 * (러너 없음은 리포에 러너가 없어야 하고, `traceMissing` 은 2단 판이 구워져야 한다).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { expect } from '@playwright/test';

import { test } from '../support/fixture.js';
import { settled } from '../support/gates.js';

function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    try {
      statSync(join(dir, 'pnpm-workspace.yaml'));
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error('워크스페이스 뿌리를 못 찾았다');
}

function walk(dir: string, ext: readonly string[], out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') walk(full, ext, out);
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const ROOT = repoRoot();

/** 로케일 하나의 카탈로그 전문. 키가 정말 있는지는 여기서 본다. */
const catalog = (locale: 'ko' | 'en'): string =>
  walk(join(ROOT, 'packages/i18n/src', locale), ['.ts'])
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

/** 화면 코드 전문 — **시험 파일은 뺀다**. 시험만 부르는 키는 화면이 부르는 것이 아니다. */
const screens = (): string =>
  walk(join(ROOT, 'apps/desktop/src'), ['.ts', '.tsx'])
    .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

const KO = catalog('ko');
const EN = catalog('en');
const SCREENS = screens();

/** 키 하나가 ko·en 에 있고 화면이 부른다. */
function assertLive(key: string): string[] {
  const bad: string[] = [];
  if (!KO.includes(`'${key}'`)) bad.push(`${key} — ko 카탈로그에 없다`);
  if (!EN.includes(`'${key}'`)) bad.push(`${key} — en 카탈로그에 없다`);
  if (!SCREENS.includes(`'${key}'`)) bad.push(`${key} — 화면 컴포넌트가 안 부른다`);
  return bad;
}

/** `RunnerReason` 의 갈래 전부. 소스에서 읽는다 — 늘어나면 이 게이트가 저절로 따라간다. */
function runnerReasons(): string[] {
  const src = readFileSync(join(ROOT, 'packages/grading/src/runner.ts'), 'utf8');
  const at = src.indexOf('export type RunnerReason');
  expect(at, 'RunnerReason 선언을 못 찾았다 — 게이트가 무엇을 재는지 잃었다').toBeGreaterThan(0);
  const body = src.slice(at, src.indexOf(';', at));
  return [...body.matchAll(/\|\s*'([^']+)'/g)].map((m) => m[1] as string);
}

// ───────── ① 「네 코드엔 없다」 ─────────

test('① 사전 예제 판의 문구가 살아 있다 — 「네 코드엔 없다」 사유 넷 + 출처 줄', () => {
  const bad = [
    't0.absentFramework', 't0.absentLibrary', 't0.absentScale', 't0.absentIdiom',
    't0.syntheticSource',
  ].flatMap(assertLive);
  expect(bad, bad.join('\n')).toEqual([]);
});

test('① 사유 표와 문구 표가 같은 넷을 든다', () => {
  const src = readFileSync(join(ROOT, 'packages/cards/src/t0-synthetic.ts'), 'utf8');
  const at = src.indexOf('export type AbsenceReason');
  const body = src.slice(at, src.indexOf(';', at));
  const reasons = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
  expect(reasons.length).toBe(4);
  // 화면이 든 표(`T0Plate` 의 `ABSENT_KEY`)에 그 넷이 다 있어야 한다.
  const plate = readFileSync(join(ROOT, 'apps/desktop/src/screens/session/T0Plate.tsx'), 'utf8');
  const missing = reasons.filter((r) => !plate.includes(`${r}:`));
  expect(missing, `T0Plate 의 사유 표에 없다: ${missing.join(' · ')}`).toEqual([]);
});

// ───────── ② 「답이 없다」 (UB) ─────────

test('② 미정의 동작 — 사전 항목이 「답이 없다」를 말한다 (형식이 아직 못 담아 카탈로그만)', () => {
  const path = join(ROOT, 'dictionary/cs/undefined-behavior.yaml');
  const yaml = readFileSync(path, 'utf8');
  // 「어긋난 답이 나오는 것이 아니라 **답이 없다**」 — 이 구별이 사라지면 이 개념은 없는 것과 같다.
  expect(yaml, '`cs/undefined-behavior` 에서 「답이 없다」가 사라졌다').toContain('답이 없다');
  expect(yaml).toContain('id: cs/undefined-behavior');
});

// ───────── ③ 러너 없음 · 방언 미지원 ─────────

test('③ `RunnerReason` 갈래마다 ko·en 문구가 있고 화면이 그 표를 든다', () => {
  const reasons = runnerReasons();
  expect(reasons.length).toBeGreaterThanOrEqual(6);

  const map = readFileSync(join(ROOT, 'apps/desktop/src/data/runner.ts'), 'utf8');
  const bad: string[] = [];
  for (const reason of reasons) {
    if (!map.includes(`'${reason}'`)) bad.push(`${reason} — data/runner.ts 의 표에 없다`);
  }
  // 표가 내주는 키 전부가 ko·en 에 있어야 한다.
  for (const m of map.matchAll(/'(run\.reason\.[A-Za-z]+)'/g)) {
    const key = m[1] as string;
    if (!KO.includes(`'${key}'`)) bad.push(`${key} — ko 카탈로그에 없다`);
    if (!EN.includes(`'${key}'`)) bad.push(`${key} — en 카탈로그에 없다`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('③ 실행 패널이 그 이유를 실제로 그린다', () => {
  const panel = readFileSync(join(ROOT, 'apps/desktop/src/components/run/RunPanel.tsx'), 'utf8');
  expect(panel, 'RunPanel 이 `reasonKey` 를 안 부른다 — 이유가 화면에 안 뜬다').toContain('reasonKey');
  const bad = ['run.none', 'run.noneHint'].flatMap(assertLive);
  expect(bad, bad.join('\n')).toEqual([]);
});

// ───────── ④ 값 추적을 굽지 못했다 ─────────

test('④ 「값 추적 판을 굽지 못했다」가 단 오버레이에 붙어 있다', () => {
  const bad = assertLive('chapter.traceMissing');
  expect(bad, bad.join('\n')).toEqual([]);
  const overlay = readFileSync(join(ROOT, 'apps/desktop/src/screens/course/StageOverlay.tsx'), 'utf8');
  expect(overlay).toContain('chapter.traceMissing');
});

// ───────── ① 하네스 — 합성 판을 실제로 띄운다 ─────────

/**
 * 세션을 평소대로 연 다음 **첫 판의 카드를 합성으로 바꾸고** 다시 띄운다.
 *
 * 카드를 손으로 심어 큐에 끼우지 않는 이유: 큐는 앱이 짜고 그 규칙(D113)이 게이트의 대상이
 * 아니다. 여기서 재는 것은 **판이 합성일 때 화면이 무엇을 말하는가** 하나다.
 * `card.site_id` 가 NULL 이면 대응하는 `concept_site` 행이 없다는 뜻이고 그것이 곧 합성이다
 * (`data/cards.ts` 의 `makeSyntheticPlate` 가 그렇게 쓴다).
 */
test('① 합성 판을 띄우면 「내 코드」가 아니라 「사전 예제」라고 적힌다', async ({ page, app }) => {
  await page.goto('/?dev=1');
  await page.locator('.masthead').waitFor();
  await page.getByRole('button', { name: /학습 시작|이어 풀기/ }).click();
  await page.locator('article.ps').waitFor();

  const row = app.db
    .prepare(
      `SELECT i.card_id AS id FROM session_item i
        WHERE i.session_id = (SELECT MAX(id) FROM session) AND i.pos = 0`,
    )
    .get() as { id: number } | undefined;
  expect(row, '세션의 첫 판을 못 찾았다').toBeTruthy();

  // 리포에 자리가 **아예 없는** 개념으로 바꾼다 — `ABSENCE` 표가 사유를 아는 개념이라야
  // 「왜 없나」 한 줄까지 뜬다.
  app.db.prepare('UPDATE card SET site_id = NULL, concept_id = ? WHERE id = ?')
    .run('ts/implicit-conversion', (row as { id: number }).id);
  app.db.prepare('UPDATE session_item SET concept_id = ? WHERE card_id = ?')
    .run('ts/implicit-conversion', (row as { id: number }).id);

  // 다시 띄우면 홈이다 — 열린 세션은 「이어 풀기」로 되돌아온다 (05 §2.3).
  await page.reload();
  await page.locator('.masthead').waitFor();
  await page.getByRole('button', { name: /학습 시작|이어 풀기/ }).click();
  await page.locator('article.ps').waitFor();
  await settled(page);

  const sheet = page.locator('article.ps').first();
  // 판 머리의 출처 줄이 **파일 경로가 아니라** 「사전 예제」다. 문구가 아니라 모양으로 본다 —
  // 「내 코드」라는 낱말은 「내 코드에서 떠 온 줄이 아닙니다」에도 들어 있다.
  const src = await sheet.locator('.ps-src').innerText();
  expect(src).toContain('사전 예제');
  expect(src, `출처 줄에 파일:줄 이 남아 있다 — ${src}`).not.toMatch(/\.[a-z]+:\d+/);
  // 왜 네 코드엔 없나 — 사유 한 줄.
  await expect(sheet.locator('.t0-absent')).toContainText('네 코드에 없습니다');
  // 첫 판 안내도 「당신 리포에서 떠 온 줄」이라고 말하지 않는다.
  await expect(sheet).not.toContainText('당신 리포에서 그대로 떠 온 줄');
});
