/**
 * 사용처 하나 → 템플릿 변수 묶음 (03 §4.3 표). 허용 이름은 `dictionary/lint.ts` 의
 * `PLAIN_VARS` + 쿼리가 잡은 `@pick.N`·`@ctx.*` 와 같아야 한다 — 어긋나면 린트를
 * 통과한 사전이 렌더에서 죽는다.
 *
 * 04 §0 은 「엔진은 템플릿 + 변수 묶음만 넘긴다」고 적지만 D74 가 그것을 **생성기 안의
 * 단계 구분**으로 읽는다. 그래서 이 파일이 만든 묶음은 밖으로 나가지 않고 여기서 소비된다.
 */
import { isMissing, render, type TemplateVars } from '@chickadee/text';
import type { Concept } from '@chickadee/dictionary';

import type { FocusLine, OtherUse, SiteInput } from './types.js';

/** posix 경로의 파일명. 사다리 4단 프롬프트는 디렉터리를 넣지 않는다 (04 §2.4 · 06 §3.3). */
export const baseName = (path: string): string => path.slice(path.lastIndexOf('/') + 1);

/** `pick.N` 이 실제로 보이는 행. 못 찾으면 사용처 첫 행이다. */
function lineOfText(lines: readonly FocusLine[], text: string, from: number, to: number): number {
  for (const line of lines) {
    if (line.n < from || line.n > to) continue;
    if (line.t.includes(text)) return line.n;
  }
  return from;
}

export interface VarsOptions {
  /** 진단 폴백(`diag_default`)이 쓰는 이름들 — `pick`·`role`·`answer` (04 §2.1). */
  extra?: Readonly<Record<string, string>>;
}

export function buildVars(
  input: SiteInput,
  concept: Concept,
  options: VarsOptions = {},
): TemplateVars {
  const { site, path, lines } = input;
  const vars: Record<string, string> = {
    'site.line': String(site.lineStart),
    'site.text': site.excerpt,
    file: path,
    'file.base': baseName(path),
    concept: concept.name.ko,
  };
  if (site.form !== null) vars['site.form'] = site.form;
  if (site.hole !== null) vars['hole'] = site.hole;
  if (concept.token !== null) vars['token'] = concept.token;

  for (const [n, text] of Object.entries(site.picks)) {
    vars[`pick.${n}`] = text;
    vars[`pick.${n}.line`] = String(lineOfText(lines, text, site.lineStart, site.lineEnd));
  }
  for (const [name, text] of Object.entries(site.ctx)) vars[`ctx.${name}`] = text;

  const other: OtherUse | undefined = input.others?.[0];
  if (other) {
    vars['other.file'] = other.file;
    vars['other.file.base'] = baseName(other.file);
    vars['other.line'] = String(other.line);
    vars['other.text'] = other.text;
  }
  return { ...vars, ...options.extra };
}

/** 렌더 실패를 모으는 자리. 하나라도 실패하면 그 유형은 이 Site 에 쓸 수 없다 (04 §1.3). */
export class Renderer {
  readonly missing: string[] = [];

  constructor(private readonly vars: TemplateVars) {}

  /** 반드시 있어야 하는 문장. 실패하면 `missing` 에 쌓고 빈 문자열을 돌려준다. */
  need(tpl: string): string {
    const out = render(tpl, this.vars);
    if (isMissing(out)) {
      this.missing.push(...out.missing);
      return '';
    }
    return out.text;
  }

  /** 없어도 카드가 성립하는 문장(`result`·`payoff`·`trace`). 실패하면 그 조각만 빠진다. */
  maybe(tpl: string | undefined): string | undefined {
    if (tpl === undefined) return undefined;
    const out = render(tpl, this.vars);
    return isMissing(out) ? undefined : out.text;
  }

  get ok(): boolean {
    return this.missing.length === 0;
  }

  /** 실패 사유 한 줄. 홈의 「판이 없는 문법」에 그대로 뜬다. */
  get reason(): string {
    return `템플릿이 이 사용처에 없는 변수를 쓴다: ${[...new Set(this.missing)].join(', ')}`;
  }
}
