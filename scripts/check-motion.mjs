/**
 * 모션 상한 게이트 (06 §2 · 정본 §6). **200ms** 를 넘는 애니메이션·전환이 있으면 실패한다.
 * 예외는 없다 — 720ms 와 LIFER 1.36s 예외는 D182 가 걷었다.
 *
 * 정적 파싱인 이유: 「상시 애니메이션 금지」와 「최대 200ms」는 **선언**의 성질이라
 * 브라우저를 띄우지 않고도 전수로 볼 수 있다. 실행 중 잔존 여부는 감축 모드 게이트가
 * 브라우저에서 따로 본다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ROOTS = ['apps/desktop/src', 'packages/ui/src'];

/** 정본 §6: 모션은 상태 변화를 설명할 때만, 최대 200ms. */
export const BUDGET_MS = 200;

/**
 * **예외 없음.** 정본 §6 이 「대기·강조·환영 애니메이션은 없다」로 닫았고, 남길 만한
 * 연출이 하나도 없다. 새 예외는 결정 등록부를 먼저 거쳐야 한다(06 §2) — 예외 목록이
 * 규칙을 무력화하는 일을 막는 자리가 여기다.
 */
export const EXCEPTIONS = [];

/** `infinite` 는 상시 애니메이션이다 — 정본 §3-7 · §6 이 통째로 금지한다. */
const INFINITE = /animation(?:-iteration-count)?\s*:[^;}]*\binfinite\b/gi;
const DURATION = /(animation|transition)(?:-duration)?\s*:([^;}]*)/gi;
const TIME = /(-?[\d.]+)\s*(ms|s)\b/g;

function* cssFiles(dir) {
  for (const name of readdirSync(dir)) {
    const at = join(dir, name);
    if (statSync(at).isDirectory()) yield* cssFiles(at);
    else if (name.endsWith('.css')) yield at;
  }
}

/** 선언 하나가 담은 가장 긴 시간(ms). `0s` 는 시간이 아니라 「없음」이다. */
function longestMs(value) {
  let max = 0;
  for (const [, n, unit] of value.matchAll(TIME)) {
    const ms = unit === 's' ? Number(n) * 1000 : Number(n);
    if (ms > max) max = ms;
  }
  return max;
}

/** 그 선언이 속한 규칙의 선택자 — 실패 보고가 자리를 말해야 고칠 수 있다. */
function selectorAt(text, index) {
  const before = text.slice(0, index);
  const open = before.lastIndexOf('{');
  if (open < 0) return '<root>';
  const start = Math.max(before.lastIndexOf('}', open), before.lastIndexOf('{', open - 1)) + 1;
  return before.slice(start, open).trim().replace(/\s+/g, ' ').slice(0, 80);
}

/** 주석은 규칙이 아니다. 「`infinite` 를 지웠다」는 메모까지 위반으로 세면 아무도 안 적는다. */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));

export function scanCss(source, file) {
  const text = stripComments(source);
  const findings = [];
  for (const m of text.matchAll(INFINITE)) {
    findings.push({ file, kind: 'infinite', ms: Infinity, sel: selectorAt(text, m.index ?? 0) });
  }
  for (const m of text.matchAll(DURATION)) {
    const ms = longestMs(m[2] ?? '');
    if (ms === 0) continue;
    const sel = selectorAt(text, m.index ?? 0);
    const exception = EXCEPTIONS.find((e) => e.match.test(sel) || e.match.test(m[2] ?? ''));
    const cap = exception ? exception.ms : BUDGET_MS;
    if (ms > cap) findings.push({ file, kind: m[1], ms, sel, cap });
  }
  return findings;
}

/**
 * 시간 토큰도 잰다.
 *
 * D182 이후 CSS 는 `transition: opacity var(--dur-base)` 처럼 **토큰으로** 시간을 쓴다.
 * 정적 스캐너는 `var()` 안을 못 보므로, 그 자리는 토큰 값이 상한 안에 있다는 것으로만
 * 막힌다 — 토큰 하나를 1s 로 올리면 화면 전체가 조용히 느려지고 위 스캔은 0건을 낸다.
 * 그래서 생성물 tokens.css 의 `--dur-*` 를 여기서 함께 본다.
 */
export function scanDurationTokens(root = ROOT) {
  const css = readFileSync(join(root, 'apps/desktop/src/styles/tokens.css'), 'utf8');
  const findings = [];
  for (const m of css.matchAll(/(--dur-[\w-]+)\s*:\s*([^;]+);/g)) {
    const ms = longestMs(m[2] ?? '');
    if (ms > BUDGET_MS) {
      findings.push({ file: 'apps/desktop/src/styles/tokens.css', kind: 'token', ms, sel: m[1] ?? '', cap: BUDGET_MS });
    }
  }
  return findings;
}

export function scanAll(root = ROOT) {
  const findings = [];
  for (const dir of ROOTS) {
    for (const file of cssFiles(join(root, dir))) {
      findings.push(...scanCss(readFileSync(file, 'utf8'), file.slice(root.length)));
    }
  }
  findings.push(...scanDurationTokens(root));
  return findings;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''))) {
  const findings = scanAll();
  for (const f of findings) {
    const limit = f.kind === 'infinite' ? '상시 애니메이션 금지' : `${f.cap}ms`;
    process.stdout.write(`${f.file}: ${f.sel} — ${f.kind} ${f.ms}ms (상한 ${limit})\n`);
  }
  process.stdout.write(findings.length === 0
    ? '모션 상한: 위반 0건\n'
    : `모션 상한: 위반 ${findings.length}건\n`);
  process.exit(findings.length === 0 ? 0 : 1);
}
