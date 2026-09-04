/**
 * 「모르겠어요」 사다리 4단 데이터 조립 (04 §2.4).
 *
 * 입력은 전부 인자로 받는다 — IPC 도 SQL 도 없다. 겹(`ly`)·「카드 생성 가능」·사용처의
 * `shape`·`unknownCount` 는 부르는 쪽(02·03)이 이미 안다.
 *
 * 4단 프롬프트에는 **파일 base name 만** 넣는다 (D8 · 06 §3.3). 디렉터리 경로·리포명·
 * 커밋 메시지·작성자는 인자로도 받지 않는다 — 받지 않으면 샐 수 없다.
 */
import { t } from '@chickadee/i18n';
import type { ConceptId, DictLayer, Layer } from '@chickadee/store-sql';

import type { T0Card } from './t0.js';

/** 프롬프트 코드 펜스 상한 (04 §1 `promptLines` = 초점 ±4, ≤ 9줄). */
export const MAX_PROMPT_LINES = 9;
/** 3단 「다른 자리」 개수 (04 §2.4 · 02 §7.3 `LIMIT 3`). */
export const MAX_USES = 3;
/** 이 겹부터는 「찍혀 있음」으로 본다 (04 §2.4 `known(ly ≥ 2)`). */
export const KNOWN_LAYER = 2;

export interface ConceptRef {
  /** 사람이 읽는 개념 이름 — 「옵셔널 체이닝」. */
  name: string;
  /** 코드에 보이는 토큰 — `?.`. */
  token: string;
}

/** 선행 개념 하나에 대해 부르는 쪽이 아는 사실. */
export interface PrereqFacts {
  layer: Layer;
  /** 즉석 `prereqOnly` 카드를 만들 수 있으면 그 카드 id, 못 만들면 `null`. */
  cardId: number | null;
  /** 리포에 사용처가 있나. 없으면 합성 예제 + 「곧 네 코드 어디에서」 예고. */
  inRepo: boolean;
}

export type PrereqStatus = 'known' | 'gap' | 'none';

export interface PrereqRung {
  conceptId: ConceptId;
  name: string;
  ly: Layer;
  status: PrereqStatus;
  cardId?: number;
  /** `status === 'none'` 일 때만. `no-plate` = 리포에 있으나 판을 못 만듦, `synthetic` = 리포에 없음. */
  none?: 'no-plate' | 'synthetic';
}

export interface PrereqRungs {
  items: PrereqRung[];
  gapCount: number;
  /**
   * 「내려갈 곳이 없다」 — 비어 있는 층이 0. 02 §6.4 의 초보 감지 조건 3이 이 값을 센다.
   * 선행이 아예 없을 때도 참이다(내려갈 자리가 없다는 뜻은 같다).
   */
  nowhereToGo: boolean;
  /** 복귀 후 「이어보기」 문단의 앞 절반. 뒤 절반(선행 개념의 `bridge`)은 `gradeT0` 가 준다. */
  payoff?: string;
}

/** `payload.uses` 원소 그대로 (02 §8.2). */
export type UseRef = T0Card['uses'][number];

export interface UseMeta {
  shape: string;
  unknownCount: number;
  /** 최근에 이미 보여 준 자리. 3단에서 뒤로 밀린다. */
  shownRecently?: boolean;
}

export interface LadderInput {
  card: T0Card;
  concept: ConceptRef;
  /** 지금 판의 사용처 — 3단에서 뺀다. */
  currentSiteId?: number | null;
  /** 지금 판 사용처의 `shape` — 3단 「`shape` 가 다른 것」의 비교 기준. */
  currentShape?: string;
  prereqFacts?: ReadonlyMap<ConceptId, PrereqFacts>;
  useMeta?: ReadonlyMap<number, UseMeta>;
  /** 4단 「제가 막힌 지점」에 들어갈 사용자 입력. */
  stuck?: string;
  /** 고른 보기(0-based). 아직 안 골랐으면 `null`. */
  sel?: number | null;
}

export interface Ladder {
  /** 1단 — 사전 3층. */
  dict: DictLayer[];
  /** 2단 — 아래층 진단. */
  prereq: PrereqRungs;
  /** 3단 — 같은 개념, 다른 자리 (≤ 3). */
  uses: UseRef[];
  /** 4단 — 클립보드용 프롬프트. 자동 전송은 없다. */
  prompt: string;
}

// ─── 1단 · 사전 3층 ──────────────────────────────────────────────────────────

/**
 * `payload.dict` 가 있으면 그대로 (D74: 이미 렌더된 최종 문자열).
 * 없으면 목업처럼 `rule / ok / result` 로 대체한다 (04 §2.4 「`trace` 없으면」).
 */
export function buildDict(card: T0Card): DictLayer[] {
  if (card.dict && card.dict.length > 0) return [...card.dict];
  const layers: DictLayer[] = [
    { k: t('card.dictOneLiner'), t: card.rule },
    { k: t('card.dictWhy'), t: card.ok },
  ];
  if (card.result) {
    // `label`·`value` 는 코드 조각이라 그대로 두면 `<Item[]>` 같은 것이 마크업으로 먹힌다 —
    // 목업 `t0.js` 의 `esc()` 와 같은 자리다. `rule`·`ok` 는 사전이 쓴 문장이라 그대로 통과.
    layers.push({
      k: t('grading.dictResult', { focus: String(card.focus) }),
      t: `<code>${escapeCode(card.result.label)}</code> = <code>${escapeCode(card.result.value)}</code> — ${card.result.note}`,
    });
  }
  return layers;
}

// ─── 2단 · 아래층 진단 ───────────────────────────────────────────────────────

/**
 * 선행 개념마다 상태 하나 (04 §2.4).
 * `known`(ly ≥ 2) · `gap`(ly ≤ 1 이고 카드 생성 가능) · `none`(그 밖).
 * `none` 은 다시 둘로 갈린다 — 리포에 있으나 판을 못 만들면 「판 없음」, 리포에 없으면 합성 예제 예고.
 */
export function buildPrereq(
  card: T0Card,
  facts: ReadonlyMap<ConceptId, PrereqFacts> = new Map(),
): PrereqRungs {
  const items = card.prereq.map<PrereqRung>((p) => {
    const fact = facts.get(p.conceptId);
    const ly = fact?.layer ?? 0;
    const cardId = fact?.cardId ?? null;
    if (ly >= KNOWN_LAYER) return { conceptId: p.conceptId, name: p.n, ly, status: 'known' };
    if (cardId !== null) return { conceptId: p.conceptId, name: p.n, ly, status: 'gap', cardId };
    return {
      conceptId: p.conceptId,
      name: p.n,
      ly,
      status: 'none',
      none: fact?.inRepo ? 'no-plate' : 'synthetic',
    };
  });
  const gapCount = items.filter((i) => i.status === 'gap').length;
  return {
    items,
    gapCount,
    nowhereToGo: gapCount === 0,
    ...(card.payoff ? { payoff: card.payoff } : {}),
  };
}

// ─── 3단 · 다른 자리 ─────────────────────────────────────────────────────────

/**
 * 다른 파일 우선 → `shape` 가 다른 것 → `unknownCount` 오름차순 → 최근 노출은 뒤로 (04 §2.4).
 *
 * 「최근 노출 제외」를 글자대로 지우지 않고 마지막으로 미룬 이유: 사용처가 셋뿐인 개념에서
 * 셋 다 최근에 나왔으면 3단이 통째로 빈다. 앞의 3개를 채우고 남으면 어차피 빠진다.
 */
export function buildUses(
  card: T0Card,
  opts: { currentSiteId?: number | null; currentShape?: string; meta?: ReadonlyMap<number, UseMeta> } = {},
): UseRef[] {
  const { currentSiteId = null, currentShape, meta = new Map<number, UseMeta>() } = opts;
  const candidates = card.uses.filter((u) => u.siteId !== currentSiteId);
  const ranked = [...candidates].sort(
    (a, b) =>
      Number(a.f === card.file) - Number(b.f === card.file)
      || Number(meta.get(a.siteId)?.shape === currentShape) - Number(meta.get(b.siteId)?.shape === currentShape)
      || (meta.get(a.siteId)?.unknownCount ?? 0) - (meta.get(b.siteId)?.unknownCount ?? 0)
      || a.siteId - b.siteId,
  );
  const fresh = ranked.filter((u) => !meta.get(u.siteId)?.shownRecently);
  const recent = ranked.filter((u) => meta.get(u.siteId)?.shownRecently);
  return [...fresh, ...recent].slice(0, MAX_USES);
}

// ─── 4단 · 자유 질문 프롬프트 ────────────────────────────────────────────────

/**
 * 코드 펜스에 들어갈 줄 (04 §2.4 「`payload.promptLines`(≤ 9줄), 빈칸은 정답으로 채움」).
 *
 * `promptLines` 는 01 `file_read_lines` 가 읽은 **파일 원문**이라 빈칸 자리에 정답이 이미
 * 들어 있다. 비어 있을 때만 카드의 `lines` 로 되돌아가 빈칸을 정답 보기로 채운다.
 *
 * 상한은 원소 수가 아니라 **찍히는 줄 수**에 건다 — 06 §3.3-1 이 세는 것이 줄이다.
 * 원소 하나가 줄바꿈을 품고 있으면 원소 9개가 펜스 안에서 10줄이 된다.
 */
export function promptCodeLines(card: T0Card): string[] {
  const baked = card.promptLines.length > 0 ? card.promptLines : filledCardLines(card);
  return baked.flatMap((line) => line.split('\n')).slice(0, MAX_PROMPT_LINES);
}

/** 고른 보기를 사람 말로. 지목형은 짚은 토큰, 나머지는 보기 문구(마크업 제거). */
export function selectionLabel(card: T0Card, sel: number): string {
  if (card.kind === 'point') return pickText(card, sel);
  return plainText(card.options?.[sel]?.t ?? '');
}

export interface PromptInput {
  card: T0Card;
  concept: ConceptRef;
  /** 고른 보기(0-based). 아직 안 골랐으면 `null`. */
  sel?: number | null;
  stuck?: string;
}

/**
 * 목업 `t0.js` 의 `askBuild` 규약 그대로, 단 파일은 **base name 만** (D8).
 * 자동 전송은 없다 — 이 문자열은 클립보드로만 나간다.
 */
export function buildPrompt(input: PromptInput): string {
  const { card, concept, sel = null, stuck = '' } = input;
  const fence = promptCodeLines(card).join('\n');
  const stuckAt = stuck.trim() === '' ? t('grading.promptStuckEmpty') : stuck.trim();
  return [
    t('grading.promptHeader', { file: fileBaseName(card.file), focus: String(card.focus) }),
    '',
    '```',
    fence,
    '```',
    '',
    t('grading.promptConcept', { name: concept.name, token: concept.token }),
    t('grading.promptStuck', { stuck: stuckAt }),
    statusLine(card, sel),
    '',
    t('grading.promptAsk'),
  ].join('\n');
}

function statusLine(card: T0Card, sel: number | null): string {
  if (sel === null) return t('grading.promptNoAnswer');
  if (sel === card.answer) return t('grading.promptCorrectButWhy');
  return t('grading.promptWrongPick', { label: selectionLabel(card, sel) });
}

// ─── 조립 ───────────────────────────────────────────────────────────────────

export function buildLadder(input: LadderInput): Ladder {
  const { card, concept, currentSiteId = null, currentShape, prereqFacts, useMeta, stuck = '', sel = null } = input;
  return {
    dict: buildDict(card),
    prereq: buildPrereq(card, prereqFacts),
    uses: buildUses(card, {
      currentSiteId,
      ...(currentShape === undefined ? {} : { currentShape }),
      ...(useMeta ? { meta: useMeta } : {}),
    }),
    prompt: buildPrompt({ card, concept, sel, stuck }),
  };
}

// ─── 잔손질 ─────────────────────────────────────────────────────────────────

/**
 * 파일 이름만 남긴다 — D8 의 유일한 문. `/` 와 `\` 를 둘 다 자르므로 절대 경로를 넣어도
 * 디렉터리가 새지 않는다. 자를 것이 없으면(경로가 구분자로 끝나면) 자리표를 쓴다.
 */
export function fileBaseName(path: string): string {
  const trimmed = path.replace(/[/\\]+$/, '');
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  const base = cut >= 0 ? trimmed.slice(cut + 1) : trimmed;
  return base === '' ? t('grading.noFileName') : base;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
};

/**
 * 카드 문구에서 마크업을 걷어 평문으로. 프롬프트는 클립보드로 나가는 **평문**이라
 * 목업 `plain()` 과 달리 엔티티까지 되돌린다 — `&lt;` 가 그대로 붙어 나가면 물어보는 쪽이 헷갈린다.
 */
export function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

function escapeCode(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 지목형에서 짚은 토큰. `pick` 번호는 1-based 이고 `sel` 은 0-based 다(목업과 같은 대응). */
function pickText(card: T0Card, sel: number): string {
  for (const line of card.lines) {
    if (!('seg' in line)) continue;
    for (const seg of line.seg) {
      if (!('hole' in seg) && seg.pick === sel + 1) return seg.t;
    }
  }
  return '';
}

/** 카드의 `lines` 를 한 줄 텍스트로. 빈칸은 정답 보기로 채운다 (목업 `askBuild`). */
function filledCardLines(card: T0Card): string[] {
  const answerText = plainText(card.options?.[card.answer]?.t ?? '');
  return card.lines.map((line) =>
    'seg' in line ? line.seg.map((s) => ('hole' in s ? answerText : s.t)).join('') : line.t,
  );
}
