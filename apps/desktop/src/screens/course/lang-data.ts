/**
 * 언어 코스 — 사용자가 고른 언어의 부 넷 (D190 · D177).
 *
 * 규칙은 여기 없다. 부 배치는 `@chickadee/course` 의 `partsOf`, 판의 성립은 `buildCurriculum`,
 * 1부 접기는 `foldsPart1` 이다. 이 파일은 원장(파일 목록 · 첫 노출 · 겹 · 설정)을 그 함수들의
 * 입력으로 옮기고, 화면이 그릴 모양으로 되돌린다.
 *
 * 「없다」는 사유 없이 사라지지 않는다 (D186 ④): 리포에 그 언어의 파일이 없으면 판은 전부
 * 사전 예제이고 사유는 `no-files` 다 — 코스를 막는 것이 아니라 화면이 그 사실을 말한다.
 */
import { absenceReason, type AbsenceReason } from '@chickadee/cards';
import { MAX_UNKNOWN_FOR_NEW } from '@chickadee/concepts';
import {
  COURSE_LANGS, buildCurriculum, foldsPart1, hasParts, isCourseLang, partsOf,
  type CurriculumPlate, type PartNo,
} from '@chickadee/course';
import { textOf, type Dict } from '@chickadee/dictionary';
import { ipc } from '@chickadee/ipc-client';
import type { ConceptId } from '@chickadee/store-sql';

import { loadMastery } from '../../data/session.js';
import { loadSettings } from '../../data/settings.js';

/** 선택지 한 줄 — 언어 열 전부가 선다. 사전이 없는 언어도 **보인다**, 다만 열리지 않는다. */
export interface LangOption {
  lang: string;
  /** 번들 사전의 개념 수. 0 이면 저작 전이다. */
  concepts: number;
  /** 부 배치가 채워졌나 (`hasParts`). 거짓이면 코스를 못 연다. */
  authored: boolean;
  /** 이 리포에서 그 언어로 읽힌 파일 수. */
  files: number;
}

export interface LangPlateView extends CurriculumPlate {
  name: string;
  layer: number;
}

export interface LangPartView {
  part: PartNo;
  plates: LangPlateView[];
  /** 1부가 「아는 것은 건너뛴다」로 접혔나 (`foldsPart1`). 접혀도 판은 남는다. */
  folded: boolean;
}

export interface LangCourseData {
  /** 지금 코스의 언어. 설정이 비면 리포의 주 언어다. */
  lang: string | null;
  /** 설정이 비어 리포에서 고른 것인가. */
  auto: boolean;
  options: LangOption[];
  parts: LangPartView[];
  /** 리포에 이 언어의 파일이 있나. 없으면 판은 전부 `no-files` 다. */
  hasFiles: boolean;
}

/**
 * 확장자 → 사전 네임스페이스. `_lang.yaml` 의 `extensions` 표를 뒤집은 것이다.
 *
 * 프레임워크 사전(`spring/`)도 같은 확장자(`.java`)를 걸므로 **코스 언어가 이긴다** — 세는 것은
 * 「이 리포에 그 언어의 파일이 몇 장인가」이고, 프레임워크는 언어 위에 얹히는 것이지 언어가 아니다.
 */
export function extToLang(dict: Dict): Map<string, string> {
  const out = new Map<string, string>();
  for (const [lang, meta] of dict.langs) {
    for (const exts of Object.values(meta.extensions)) {
      for (const ext of exts ?? []) {
        const at = out.get(ext);
        if (at === undefined || (isCourseLang(lang) && !isCourseLang(at))) out.set(ext, lang);
      }
    }
  }
  return out;
}

/** 리포의 파일을 언어별로 센다. 표에 없는 확장자는 안 센다. */
export function repoLangCounts(dict: Dict, paths: readonly string[]): Map<string, number> {
  const ext = extToLang(dict);
  const out = new Map<string, number>();
  for (const path of paths) {
    const dot = path.lastIndexOf('.');
    if (dot < 0) continue;
    const lang = ext.get(path.slice(dot));
    if (lang === undefined) continue;
    out.set(lang, (out.get(lang) ?? 0) + 1);
  }
  return out;
}

/** 리포의 주 언어 — 코스가 열리는 언어 중 파일이 가장 많은 것. 동점은 채택 순서(README §1). */
export function mainLang(counts: ReadonlyMap<string, number>): string | null {
  let best: string | null = null;
  let n = 0;
  for (const lang of COURSE_LANGS) {
    const c = counts.get(lang) ?? 0;
    if (c > n) {
      best = lang;
      n = c;
    }
  }
  return best;
}

export interface PartsInput {
  dict: Dict;
  lang: string;
  hasFiles: boolean;
  bestSiteOf: (conceptId: string) => { siteId: number; unknown: number } | null;
  layerOf: (conceptId: string) => number;
  declaredNewcomer: boolean;
}

/** 부 넷을 화면 모양으로. 순수 함수다 — 시험이 원장 없이 부른다. */
export function partViews(input: PartsInput): LangPartView[] {
  const parts = partsOf(input.lang);
  if (parts === null || !hasParts(input.lang)) return [];
  const built = buildCurriculum({
    parts,
    prereqOf: (id) => input.dict.concepts.get(id)?.prereq ?? [],
    difficultyOf: (id) => input.dict.concepts.get(id)?.difficulty ?? 3,
    bestSiteOf: (id) => {
      const hit = input.bestSiteOf(id);
      return hit === null ? null : { siteId: hit.siteId, unknown: hit.unknown, lineStart: 0, lineEnd: 0 };
    },
    // 파일이 없으면 사유는 리포가 정한다 — 개념의 사유 표보다 앞선다 (D190).
    absenceOf: (id): AbsenceReason | null => (input.hasFiles ? absenceReason(id) : 'no-files'),
    maxUnknown: MAX_UNKNOWN_FOR_NEW,
  });
  const part1 = parts.find((p) => p.part === 1)?.concepts ?? [];
  const folded = foldsPart1({ part1, layerOf: input.layerOf, declaredNewcomer: input.declaredNewcomer });
  return built.map((p) => ({
    part: p.part,
    folded: p.part === 1 && folded,
    plates: p.plates.map((plate) => ({
      ...plate,
      name: nameOf(input.dict, plate.conceptId),
      layer: input.layerOf(plate.conceptId),
    })),
  }));
}

function nameOf(dict: Dict, conceptId: string): string {
  const c = dict.concepts.get(conceptId);
  return c === undefined ? conceptId : textOf(c.name, dict.locale).text;
}

/**
 * 언어 코스 한 벌. 첫 노출은 개념마다 한 문장(`queue.best_site`)이라 개념 수만큼 돈다 —
 * 언어 하나에 마흔 안팎이고, 목차를 열 때 한 번이다.
 */
export async function loadLangCourse(repoId: number, dict: Dict): Promise<LangCourseData> {
  const [settings, files] = await Promise.all([
    loadSettings(),
    ipc.store.query('derive.files', { repoId }),
  ]);
  const counts = repoLangCounts(dict, files.map((f) => f.path));
  const options: LangOption[] = COURSE_LANGS.map((lang) => ({
    lang,
    concepts: [...dict.concepts.keys()].filter((id) => id.startsWith(`${lang}/`)).length,
    authored: hasParts(lang),
    files: counts.get(lang) ?? 0,
  }));

  const auto = settings.courseLang === null;
  const lang = settings.courseLang ?? mainLang(counts);
  if (lang === null || !hasParts(lang)) {
    return { lang, auto, options, parts: [], hasFiles: lang !== null && (counts.get(lang) ?? 0) > 0 };
  }

  const ids = (partsOf(lang) ?? []).flatMap((p) => p.concepts) as ConceptId[];
  const [mastery, sites] = await Promise.all([
    loadMastery(ids),
    Promise.all(ids.map(async (conceptId) => {
      const rows = await ipc.store.query('queue.best_site', { repoId, conceptId });
      const row = rows[0];
      return [conceptId, row === undefined ? null : { siteId: row.id, unknown: row.unknown_count }] as const;
    })),
  ]);
  const best = new Map(sites);
  const hasFiles = (counts.get(lang) ?? 0) > 0;
  const parts = partViews({
    dict,
    lang,
    hasFiles,
    bestSiteOf: (id) => best.get(id as ConceptId) ?? null,
    layerOf: (id) => mastery.get(id as ConceptId)?.layer ?? 0,
    declaredNewcomer: settings.declaredNewcomer,
  });
  return { lang, auto, options, parts, hasFiles };
}
