/**
 * 정식 코스 3부 — 기능 챕터 **앞**에 서는 부분 (D177 · 정본 §4 · `docs/curriculum/java.md` §2).
 *
 * `buildCourse`(D162)는 리포의 기능을 챕터로 세운다. 그것만으로 코스가 되지 않는 이유가
 * 실측에 있다: 표본 `MonggleMonggle` 자바 99장에서 `for (;;)` **0곳** · for-each **1곳** ·
 * 배열 **1곳** · `abstract class` **0곳** · 제네릭 경계 **0곳** · `equals`/`hashCode` 재정의
 * **0곳**이다. 리포가 쓰는 문법만 가르치면 반복도 배열도 상속 계층도 못 가르치고, 순서를
 * 리포의 사용처가 정하니 「기초부터」라는 체감도 안 선다.
 *
 * 그래서 부가 셋이고 부마다 교재가 다르다.
 *
 * | 부 | 교재 | 이 파일이 하는 일 |
 * |---|---|---|
 * | 1 바닥 | 합성 예제 | 리포에 자리가 없어도 판을 세운다 |
 * | 2 객체 | 합성 + 내 코드 | 자리가 있으면 내 코드, 없으면 합성 + 「네 코드엔 없다」 |
 * | 3 프레임워크 | 내 코드 중심 | 자리가 먼저이고 합성은 그 모양이 없을 때만 |
 *
 * 규칙 셋이 이 코스가 일반 튜토리얼로 변질되는 것을 막는다.
 *
 * **① 개념마다 내 코드의 자리를 짚는다.** {@link CurriculumPlate.siteId} 가 그 자리이고,
 *   `null` 이면 {@link CurriculumPlate.absent} 가 왜 없는지를 말한다. 둘 다 없는 판은
 *   만들어지지 않는다 — `previewSiteId` 든 `absent` 든 열쇠 하나는 있어야 한다(D137 · D177).
 * **② 3부는 내 코드가 먼저다.** {@link partOrder} 가 3부에서만 「자리 있는 것 먼저」를 켠다.
 * **③ 순서는 개념 그래프의 위상 정렬**이고 부 안에서 선행이 먼저다 — `topoOrder` 그대로.
 *
 * **어휘 관문을 흡수한다** (`docs/program/course.md` §3.2). 관문 0(12판)이 하던 일은 1·2부가
 * 통째로 가져간다. 챕터마다 붙던 관문 1~n(챕터당 6판)만 남고, 그것도 **부가 이미 가르친
 * 개념은 안 센다** — {@link chapterGates} 가 그 뺄셈이다.
 */
import { coverOf, drillsAfterPart0, type AbsenceReason } from '@chickadee/cards';
// 문제 자체의 타입은 사전의 것이다 — `cards` 는 그것을 판으로 바꿀 뿐이다.
import type { Drill, DrillLang } from '@chickadee/dictionary';
import { topoOrder, type BestSite, type Chapter, type RootResult } from '@chickadee/concepts';
import type { StageNo } from '@chickadee/store-sql';

/**
 * 부 번호. **0 값과 식** · 1 흐름과 묶기 · 2 객체 · 3 프레임워크.
 *
 * 0 이 는 것은 `docs/curriculum/java.md` §1.5 다 — 1부가 `class-declaration` 으로 시작해
 * `arithmetic` 까지 가면서 **값이 무엇인지를 안 가르치고 값을 옮기는 문법부터** 가르쳤다.
 * 0부가 그 축을 가져가서 1부에는 흐름과 묶기 여덟만 남는다(§1.5.4).
 */
export type PartNo = 0 | 1 | 2 | 3;

/**
 * 한 챕터 앞에 붙는 어휘 관문의 상한. `course.md` §3.2 의 값 그대로다 — 관문 0 은
 * 1·2부가 흡수했고 이 값은 관문 1~n 의 것이다.
 */
export const GATE_PER_CHAPTER = 6;

/**
 * 챕터 관문 전체의 상한. D136·D147 의 「튜토리얼로의 변질」 방벽을 코스 규모로 옮긴 것이고
 * 시험으로 못박힌다. 부가 흡수한 뒤로 이 예산은 **부에 안 든 어휘**에만 쓰인다.
 */
export const COURSE_GATE_MAX = 40;

/** 코스 판 한 장. */
export interface CurriculumPlate {
  conceptId: string;
  part: PartNo;
  /** 내 코드의 자리. `null` 이면 합성이다. */
  siteId: number | null;
  /** 자리는 있는데 아직 미지가 많아 못 열 때의 예고 (D137). */
  previewSiteId: number | null;
  /** 자리가 **아예 없을 때**의 사유 (D177 · D158 ②). 자리가 있으면 `null`. */
  absent: AbsenceReason | null;
}

export interface CurriculumPart {
  part: PartNo;
  plates: CurriculumPlate[];
}

/** 부 배치 한 줄 — 어느 개념이 몇 부인가. 정본은 `docs/curriculum/java.md` §2 다. */
export interface PartAssignment {
  part: PartNo;
  /** 그 부의 개념. `_lang.yaml` 의 `essential` 순서를 그대로 쓴다. */
  concepts: readonly string[];
}

/**
 * 자바의 부 배치 (D177 · `docs/curriculum/java.md` §2).
 *
 * **사전에 필드를 늘리지 않은 이유**는 이것이 개념의 성질이 아니라 **코스의 결정**이기
 * 때문이다. 같은 `java/lambda` 가 자바를 처음 배우는 사람에게는 2부이고 코틀린을 아는
 * 사람에게는 건너뛸 것이다 — 사전은 그 판단을 모른다. 반면 최소 예제와 문항은 개념마다
 * 다르므로 사전(`examples[]`)에 남는다. 두 번 물어서 갈라 둔 자리다.
 *
 * **0부가 앞에 붙었다** (java.md §1.5). 목록은 `_lang.yaml` 의 `essential` 순서를 그대로
 * 옮긴 것이고, 0·1·2부를 이으면 `essential` 전량이 된다 — 시험이 그것을 대조한다.
 *
 * 3부는 비어 있지 않다 — `spring/` 15개(D176)가 그 자리이고, 목록은 그 사전이 로드된
 * 리포에서만 채워진다. 스프링이 아닌 자바 리포에서는 3부가 0판이고 코스는 2부에서
 * 기능 챕터로 넘어간다.
 */
export const JAVA_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — 축 A~H (java.md §1.5.1). 열아홉 판 중 열일곱이
    // `essential` 이고, `java/string-concat`·`java/autoboxing` 둘은 0부의 `essential`
    // 상한 열둘 때문에 밖에 있다. 둘은 이 목록에도 안 든다 — 이 상수는 `essential` 과
    // 한 글자도 어긋나면 안 되고, 그 대조를 시험이 한다.
    part: 0,
    concepts: [
      'java/value-bits', 'java/variable-declaration', 'java/integer-limit',
      'java/floating-type', 'java/float-inexact',
      'java/string-literal', 'java/text-length',
      'java/boolean-literal', 'java/boolean-only-condition',
      'java/arithmetic', 'java/operator-precedence',
      'java/implicit-conversion', 'java/explicit-conversion',
      'java/assignment', 'java/reference-binding',
      'java/comparison', 'java/reference-equality',
    ],
  },
  {
    part: 1,
    concepts: [
      'java/class-declaration', 'java/if-statement', 'java/method-declaration',
      'java/return-statement', 'java/array', 'java/for-loop', 'java/for-each', 'java/import',
    ],
  },
  {
    part: 2,
    concepts: [
      'java/access-modifier', 'java/field-declaration', 'java/new-expression', 'java/constructor',
      'java/static', 'java/null', 'java/collection-generic', 'java/interface',
      'java/inheritance-override', 'java/abstract-class', 'java/generic-bound',
      'java/equals-hashcode', 'java/lambda', 'java/stream-pipeline', 'java/try-catch',
      'java/annotation',
    ],
  },
  {
    part: 3,
    concepts: [
      'spring/component-scan', 'spring/bean-and-container', 'spring/dependency-injection',
      'spring/bean-lifecycle', 'spring/configuration-binding', 'spring/proxy-and-aop',
      'spring/transaction-propagation', 'spring/connection-and-tx-boundary',
      'spring/request-dispatch', 'spring/controller-mapping', 'spring/filter-vs-interceptor',
      'spring/bean-validation', 'spring/exception-handler', 'spring/repository-pattern',
      'spring/persistence-mapping',
    ],
  },
];

export interface CurriculumInput {
  parts: readonly PartAssignment[];
  prereqOf: (conceptId: string) => readonly string[];
  difficultyOf: (conceptId: string) => number;
  /** 개념 → 내 코드의 첫 노출. 리포에 사용처가 없으면 `null`. */
  bestSiteOf: (conceptId: string) => BestSite | null;
  /** 자리가 없을 때 댈 사유. 못 대면 `null` 이고, 그 개념은 판이 안 선다. */
  absenceOf: (conceptId: string) => AbsenceReason | null;
  /** 미지가 이 수를 넘으면 자리가 있어도 합성으로 먼저 연다 (D137 · `MAX_UNKNOWN_FOR_NEW`). */
  maxUnknown: number;
}

/**
 * 부 안의 순서. **③ 위상 정렬**이 정본이고, 3부에서만 **② 내 코드 먼저**가 그 앞에 선다.
 *
 * 3부를 가르는 이유는 교재가 다르기 때문이다 — 프레임워크는 「이 표시가 런타임에 무엇을
 * 하나」이고 그 답은 내 코드에 실물로 있다. 합성 예제로 먼저 보여 주면 학습자가 남의 코드에서
 * 본 것을 자기 코드에서 다시 찾아야 한다. 1·2부는 반대다 — 바닥 문법은 리포에 없거나
 * 한 줄뿐이라 합성이 정본이고 내 코드가 확인이다.
 */
function partOrder(
  assignment: PartAssignment,
  input: CurriculumInput,
  hasSite: (id: string) => boolean,
): string[] {
  const nodes = assignment.concepts.map((id) => ({
    id,
    prereq: input.prereqOf(id),
    difficulty: input.difficultyOf(id),
  }));
  const topo = topoOrder(nodes, assignment.concepts);
  if (assignment.part !== 3) return topo;
  // 안정 분할 — 위상 순서를 흩지 않고 「자리 있는 것」을 앞으로만 당긴다.
  return [...topo.filter(hasSite), ...topo.filter((id) => !hasSite(id))];
}

/**
 * 부 셋을 세운다. 판이 안 서는 개념은 **말없이 빠진다** — 자리도 없고 사유도 못 대면
 * 「네 코드엔 없다」를 말할 수 없고, 말할 수 없으면 만들지 않는 것이 맞다(D137 의 규칙을
 * 부재 쪽으로 그대로 옮긴 자리).
 */
export function buildCurriculum(input: CurriculumInput): CurriculumPart[] {
  const site = new Map<string, BestSite | null>();
  const bestOf = (id: string): BestSite | null => {
    if (!site.has(id)) site.set(id, input.bestSiteOf(id));
    return site.get(id) ?? null;
  };
  const hasSite = (id: string): boolean => bestOf(id) !== null;

  return input.parts.map((assignment) => ({
    part: assignment.part,
    plates: partOrder(assignment, input, hasSite).flatMap((conceptId): CurriculumPlate[] => {
      const best = bestOf(conceptId);
      if (best === null) {
        const absent = input.absenceOf(conceptId);
        if (absent === null) return [];
        return [{ conceptId, part: assignment.part, siteId: null, previewSiteId: null, absent }];
      }
      const synthetic = best.unknown > input.maxUnknown;
      return [{
        conceptId,
        part: assignment.part,
        siteId: synthetic ? null : best.siteId,
        previewSiteId: synthetic ? best.siteId : null,
        absent: null,
      }];
    }),
  }));
}

export interface FoldInput {
  /** 1부의 개념. */
  part1: readonly string[];
  /** 그 개념의 잉크 겹 0~4. 전이(D4)로 받은 겹도 여기 들어 있다. */
  layerOf: (conceptId: string) => number;
  /**
   * 첫 실행에서 「프로그래밍이 처음」이라고 답했는가 (D147). 참이면 **접지 않는다** —
   * 전이로 받은 겹이 1부를 통째로 닫아 버리는 것을 막는다.
   */
  declaredNewcomer: boolean;
}

/**
 * 1부를 접는가 — **아는 것은 건너뛴다** (정본 §4).
 *
 * 보는 것은 둘뿐이다: 첫 실행의 한 문항과 원장. **배치고사는 만들지 않는다**(D147 · 정본 §9).
 * 레벨을 재는 시험과 대상 경계를 묻는 한 문항은 다르고, 여기서 쓰는 것은 뒤엣것이다.
 *
 * 다른 언어를 아는 사람에게 이것이 실제로 걸리는 길은 **개념 전이**다(D4). `universal` 이
 * 같은 개념은 겹을 물려받으므로, 파이썬을 아는 사람의 `java/if-statement` 는 배우기 전에
 * 이미 1겹이다. 그래서 이 함수는 「맞혔나」가 아니라 **겹**을 본다 — 전이가 채운 겹과
 * 풀어서 얻은 겹을 구별하지 않는 것이 요점이다.
 */
export function foldsPart1(input: FoldInput): boolean {
  if (input.declaredNewcomer) return false;
  if (input.part1.length === 0) return false;
  return input.part1.every((id) => input.layerOf(id) >= 1);
}

/** 챕터 하나 앞에 붙는 관문. */
export interface ChapterGate {
  order: number;
  chapter: string;
  plates: string[];
}

export interface GateInput {
  chapters: readonly Chapter[];
  /** 그 챕터의 파일이 실제로 쓰는 개념 — 순위는 부르는 쪽이 이미 매겨 넘긴다. */
  conceptsOf: (chapter: Chapter) => readonly string[];
  /** 이미 부가 가르친 개념. 관문은 이것을 다시 세지 않는다. */
  taught: ReadonlySet<string>;
}

/**
 * 챕터 관문 — 부가 안 가르친 어휘만, 챕터당 {@link GATE_PER_CHAPTER} 판, 코스 전체
 * {@link COURSE_GATE_MAX} 판까지.
 *
 * 관문 0 은 없다. `course.md` §3.2 가 「자바 바닥 8 + 애너테이션·제네릭·import·접근
 * 제어자」로 12판을 채우려 했던 자리를 1·2부가 통째로 가져갔다 — 같은 개념을 두 번 세지
 * 않으려고 `taught` 를 뺀다.
 *
 * 앞 챕터가 연 어휘도 다시 안 센다. 상한에 닿으면 뒤 챕터의 관문이 **빈다** — 그것이
 * 예산이 있다는 뜻이고, 빈 관문은 그 챕터에 새 어휘가 없다는 뜻이 아니다.
 */
export function chapterGates(input: GateInput): ChapterGate[] {
  const opened = new Set(input.taught);
  let budget = COURSE_GATE_MAX;
  return input.chapters.map((chapter) => {
    const plates: string[] = [];
    for (const conceptId of input.conceptsOf(chapter)) {
      if (budget <= 0 || plates.length >= GATE_PER_CHAPTER) break;
      if (opened.has(conceptId)) continue;
      opened.add(conceptId);
      plates.push(conceptId);
      budget -= 1;
    }
    return { order: chapter.order, chapter: chapter.name, plates };
  });
}

/** 코스 목차 한 줄. 부가 먼저 서고 그다음이 기능 챕터다. */
export type OutlineEntry =
  | {
    kind: 'part'; part: PartNo; plates: number;
    /** 그중 내 코드의 자리로 서는 판. */
    mine: number;
    /** 그중 「네 코드엔 없다」로 서는 판. */
    absent: number;
  }
  | DrillsEntry
  | { kind: 'chapter'; order: number; chapter: string; gate: number; files: number };

export interface OutlineInput {
  parts: readonly CurriculumPart[];
  gates: readonly ChapterGate[];
  chapters: readonly Chapter[];
  /**
   * {@link drillEntry} 가 낸 줄. 0부 **뒤**·1부 **앞**에 끼운다. `null` 이면 안 끼운다 —
   * 러너가 아는 언어 셋(`DRILL_LANGS`) 밖이면 이 층 자체가 없다.
   */
  drills?: DrillsEntry | null;
  /**
   * {@link foldsPart1} 의 값. 참이면 1부가 목차에서 빠진다.
   *
   * **0부는 안 접는다.** 0부는 「그 언어를 아는가」가 아니라 「값이 무엇인지 아는가」를
   * 묻고, 그 답은 다른 언어의 겹으로 채워지지 않는다 — 오히려 반대다(java.md §1.5.2:
   * 파이썬을 아는 사람이 `7 / 2` 를 `3.5` 로 예상한다). 접을지를 다시 재려면 그것은
   * 코스 화면의 결정이다.
   */
  foldPart1: boolean;
}

/**
 * 「0부 → 1부 → 2부 → 3부 → 로그인 챕터」 목차. 이 순서가 정본 §4 의 마지막 문장이다 —
 * 3부가 끝나면 코스는 **내 리포의 기능 챕터**로 넘어간다.
 */
export function courseOutline(input: OutlineInput): OutlineEntry[] {
  const gateOf = new Map(input.gates.map((g) => [g.order, g.plates.length]));
  const parts: OutlineEntry[] = input.parts
    .filter((p) => !(input.foldPart1 && p.part === 1))
    .map((p) => ({
      kind: 'part',
      part: p.part,
      plates: p.plates.length,
      mine: p.plates.filter((x) => x.siteId !== null).length,
      absent: p.plates.filter((x) => x.absent !== null).length,
    }));
  const chapters: OutlineEntry[] = input.chapters.map((c) => ({
    kind: 'chapter',
    order: c.order,
    chapter: c.name,
    gate: gateOf.get(c.order) ?? 0,
    files: c.files.length,
  }));
  // 작은 문제 층은 **0부 뒤·1부 앞**이다 (D186 ⑧). 1부가 접혀도(`foldPart1`) 자리는
  // 0부 뒤 그대로다 — 이 층이 딛는 것은 1부가 아니라 0부이기 때문이다.
  const drills = input.drills ?? null;
  if (drills !== null) {
    const after = parts.findLastIndex((e) => e.kind === 'part' && e.part === 0);
    parts.splice(after + 1, 0, drills);
  }
  return [...parts, ...chapters];
}

// ───────── 단별 탈출 (D187 ⑭) ─────────

/**
 * 그 단의 **첫 몇 판**을 본다. 0장의 `rootCleared` 가 뿌리 넉 장을 보는 것과 같은 자리이고,
 * 수를 둘로 줄인 것은 단 하나가 넉 장보다 짧기 때문이다 — `course.md` §5.1 에서 3단(예측)은
 * 요청 하나에 2분이다.
 */
export const STAGE_ESCAPE_OPENERS = 2;

/**
 * 그 챕터의 어휘 관문이 이 겹 이상이어야 단을 접는다. **1 이 아니라 2 인 것이 요점**이다 —
 * 전이(D4)는 첫 노출을 1겹에서 시작시키므로(`TRANSFER_LAYER`), 1 로 두면 다른 언어를 아는
 * 것만으로 이 챕터의 단이 열리기 전에 접힌다. 2겹은 「전이로 받은 뒤 한 번은 스스로 맞혔다」다.
 */
export const STAGE_ESCAPE_GATE_LAYER = 2;

/**
 * 접지 않는 단. **5단(재구현)** 이다 — `course.md` §5.2 가 「챕터가 끝났다」를 「다섯 단을
 * 통과하고 5단에서 컨트롤러 한 장을 도움 없이 다시 쓴다」로 정의하므로, 5단이 접히면
 * 끝남의 유일한 증거가 사라진다.
 */
export const STAGE_NEVER_FOLDED: StageNo = 5;

export interface StageFoldInput {
  /** 몇째 단인가 (1 읽기 · 2 추적 · 3 예측 · 4 수정 · 5 재구현 — `course.md` §5.1). */
  stage: StageNo;
  /** 그 단에서 이미 채점된 판 — **낸 순서대로**. 아직 안 푼 단은 빈 배열이다. */
  results: readonly RootResult[];
  /** 그 챕터의 어휘 관문에 담긴 개념의 잉크 겹. 관문이 비면 빈 배열. */
  gateLayers: readonly number[];
  /** 첫 실행의 한 문항 (D147). 참이면 **안 접는다** — `foldsPart1`·`zeroChapterDone` 과 같다. */
  declaredNewcomer: boolean;
}

/**
 * 이 단을 접는가 — **74일은 상한이지 길이가 아니다** (D187 ⑭ · `course.md` §5.3).
 *
 * `foldsPart1` 과 보는 것이 다르다. 저쪽은 **겹만** 본다(1부 전체가 1겹 이상) — 전이가
 * 채운 겹으로도 접히고, 그래서 첫 실행의 한 문항이 그 앞을 막는다. 이쪽은 **이 챕터에서
 * 방금 낸 답**을 본다:
 *
 *   ① 그 단의 첫 {@link STAGE_ESCAPE_OPENERS} 판을 **연속으로** 맞혔다 (「모르겠어요」는 오답 취급).
 *   ② 그 챕터의 어휘 관문이 전부 {@link STAGE_ESCAPE_GATE_LAYER} 겹 이상이다.
 *   ③ 5단이 아니다.
 *
 * ①이 증거이고 ②는 그 증거를 챕터 어휘로 받친다. 둘을 함께 요구하는 이유는 한쪽만으로는
 * 각각 새는 자리가 있기 때문이다 — ①만이면 운으로 두 판을 맞힌 사람이 챕터를 건너뛰고,
 * ②만이면 어휘는 아는데 이 리포의 배선은 처음인 사람이 읽기 단을 못 본다.
 *
 * 접힌 단은 **사라지지 않고 완료로 남는다** — 0장의 칩이 완료 도장과 함께 남는 것과 같다
 * (D136). 잠그는 것은 없고, 다시 열면 남은 판이 그대로 있다.
 */
export function foldsStage(input: StageFoldInput): boolean {
  if (input.declaredNewcomer) return false;
  if (input.stage === STAGE_NEVER_FOLDED) return false;
  const openers = input.results.slice(0, STAGE_ESCAPE_OPENERS);
  if (openers.length < STAGE_ESCAPE_OPENERS) return false;
  if (!openers.every((r) => r.ok && !r.dunno)) return false;
  return input.gateLayers.every((l) => l >= STAGE_ESCAPE_GATE_LAYER);
}

/** 챕터 하나가 실제로 밟는 단 — 접힌 것을 뺀 나머지. */
export interface ChapterEscape {
  chapter: string;
  /** 밟는 단. */
  stages: StageNo[];
  /** 접힌 단. */
  folded: StageNo[];
}

export interface ChapterEscapeInput {
  chapter: string;
  /** 1~5 단 순서대로의 판정 입력. `stage` 는 이 배열이 정한다. */
  stages: readonly Omit<StageFoldInput, 'stage' | 'declaredNewcomer'>[];
  declaredNewcomer: boolean;
}

/** 다섯 단 중 무엇이 접히나. 순서는 1 → 5 그대로다. */
export function chapterEscape(input: ChapterEscapeInput): ChapterEscape {
  const stages: StageNo[] = [];
  const folded: StageNo[] = [];
  input.stages.forEach((s, i) => {
    const stage = (i + 1) as StageNo;
    const fold = foldsStage({ ...s, stage, declaredNewcomer: input.declaredNewcomer });
    (fold ? folded : stages).push(stage);
  });
  return { chapter: input.chapter, stages, folded };
}

// ───────── 0부 뒤의 작은 문제 층 (D186 ⑧ · D187 ⑧) ─────────

/**
 * 알고리즘은 트랙을 새로 만들지 않고 **stdin 러너 + 우리가 쓴 작은 문제 층**으로만 낸다
 * (D187 ⑧). 문제는 `dictionary/drills/**` 에 있고, 언어를 입혀 판으로 바꾸는 것과 순서는
 * `packages/cards/src/drill.ts` 가 한다. **여기가 하는 일은 하나뿐이다 — 꽂을 자리.**
 *
 * 자리는 **0부 끝과 1부 시작 사이**다. 0부는 「`7 / 2` 뒤 `a` 는?」에 값을 적게 해서 규칙을
 * 아는지 재고, **그 규칙을 써서 무엇을 만드는가**는 안 잰다. 이 층이 그 자리다. 1부 앞인
 * 이유는 1부가 「흐름과 묶기」라서다 — 반복과 배열을 배우기 전에 그것이 필요한 문제를 내면
 * 순서가 뒤집힌다.
 */

/** {@link coverOf} 에 넘길 0부 개념 한 줄. 사전 행에서 세 필드만 뽑은 것이다. */
export interface DrillConcept {
  id: string;
  universal?: string | null;
  prereq?: readonly string[];
}

/**
 * 러너가 이 언어를 못 켰을 때 화면이 읽을 문구 키 (D186 ④).
 *
 * **언어마다 다른 문장이어야 한다** — 「러너가 없다」로 뭉치면 무엇이 없는지가 사라진다.
 * 값은 `packages/i18n/src/{ko,en}/run.ts` 의 것이고 `RunnerReason` 의
 * `toolchain-missing:<lang>` 과 짝이다(`apps/desktop/src/data/runner.ts` 가 그 짝을 든다).
 * 키만 나르고 푸는 것은 화면이 한다 — 이 패키지는 `@chickadee/i18n` 을 안 물고 있다.
 */
export const DRILL_TOOLCHAIN_KEY: Readonly<Record<DrillLang, string>> = {
  py: 'run.reason.toolchainMissingPy',
  ts: 'run.reason.toolchainMissingTs',
  java: 'run.reason.toolchainMissingJava',
};

/** 목차의 작은 문제 층 한 줄. */
export interface DrillsEntry {
  kind: 'drills';
  lang: DrillLang;
  /** 낼 판 수 — 문제 하나 × 이 언어 하나. */
  plates: number;
  /** 안 낸 문제와 사유. **조용히 사라지지 않는다** (D186 ④). */
  drops: readonly { drillId: string; reason: string }[];
  /**
   * 러너가 이 언어를 못 켜서 **채점이 안 되나.** 참이어도 줄은 **그대로 선다** — 숨기면
   * 학습자는 그 층이 있었다는 것조차 모른다(D186 ④). 빠지는 것은 채점뿐이다.
   */
  ungraded: boolean;
  /** `ungraded` 일 때 화면이 읽을 문구 키. 아니면 `null`. */
  reasonKey: string | null;
}

export interface DrillsInput {
  /** 이 코스의 언어. 러너가 아는 셋(`DRILL_LANGS`) 안이어야 한다. */
  lang: DrillLang;
  /** 0부 개념 전부. `coverOf` 가 id·`universal`·`prereq` 를 한 집합으로 접는다. */
  part0: Iterable<DrillConcept>;
  /**
   * 러너가 이 언어를 켰나. `detectStdin`(`@chickadee/grading`)이 답을 안다 —
   * 이 패키지는 프로세스를 안 띄우므로 **판정을 받아만 쓴다.**
   */
  runnerReady: boolean;
  /** 문제를 밖에서 넣고 싶을 때(시험). 생략하면 번들에 든 것 전부. */
  drills?: readonly Drill[];
}

/**
 * 0부 뒤에 설 한 줄을 낸다.
 *
 * `coverOf` 가 있는 이유가 여기서 보인다 — 문제의 `needs` 는 **보편 개념**
 * (`common/arithmetic` · `cs/integer-overflow`)으로 적혀 있고 0부의 판은 **언어 개념**
 * (`java/arithmetic`)이라, 둘을 그냥 견주면 한 문제도 안 걸린다. 개념마다 자기 id 와
 * `universal` 과 `prereq` 를 다 넣어야 `cs/integer-overflow` 가 0부의 `essential` 이
 * 아니라 그 **선행**이라는 사실을 넘어설 수 있다.
 */
export function drillEntry(input: DrillsInput): DrillsEntry {
  const { items, drops } = drillsAfterPart0({
    lang: input.lang,
    covered: coverOf(input.part0),
    ...(input.drills === undefined ? {} : { drills: input.drills }),
  });
  return {
    kind: 'drills',
    lang: input.lang,
    plates: items.length,
    drops,
    ungraded: !input.runnerReady,
    reasonKey: input.runnerReady ? null : DRILL_TOOLCHAIN_KEY[input.lang],
  };
}
