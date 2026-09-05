/**
 * 작은 문제 층 — 0부 끝과 1부 시작 **사이** (D186 ⑧ · D187 ①).
 *
 * ## 왜 이 자리인가
 *
 * 0부는 「`7 / 2` 뒤 `a` 는?」에 **값을 적게** 한다(`fundamentals.md`). 그것으로 재는 것은
 * 기계의 규칙을 아는가이고, **그 규칙을 써서 무엇을 만드는가**는 안 잰다. 이 층이 그 자리다 —
 * 표준 입력으로 글을 받아 표준 출력으로 답을 내는 다섯 줄짜리 프로그램이고, 케이스마다
 * 실제로 돌려서 판정한다.
 *
 * 1부 앞인 이유는 1부가 「흐름과 묶기」라서다. 반복과 배열을 배우기 전에 반복과 배열이
 * 필요한 문제를 내면 순서가 뒤집힌다 — 그래서 이 층의 주제 순서(`DRILL_TOPICS`)가
 * 입출력 → 사칙연산 → 조건 → 반복 → 배열 → 문자열이고, **뒤 넷은 1부와 겹쳐 든다.**
 * 어디에 꽂을지를 정하는 것은 {@link drillsAfterPart0} 한 함수이고, 부 배치 자체는
 * `packages/course/src/curriculum.ts` 의 몫이다.
 *
 * ## 트랙을 만들지 않는다
 *
 * 정본 §5 가 「알고리즘 트랙은 만들지 않는다」이고 D187 ⑧ 이 그것을 확정했다. 이 층은
 * 트랙도 새 `card.kind` 도 아니고, 0부의 `value` 형식과 **같은 자리에 사는 순수한 재료**다
 * (`fundamentals.ts` 의 `buildValueItems` 가 원장에 안 앉는 것과 같다 — 마이그레이션 `0010`
 * 이 서면 그때 함께 앉는다).
 *
 * 문제 자체는 `dictionary/drills/**` 에 있고 파싱은 `@chickadee/dictionary` 가 한다.
 * 여기가 하는 일은 셋뿐이다 — **언어를 입혀 판으로**, **순서**, **꽂을 자리**.
 */
import { loadDrills, type Drill, type DrillLang, type DrillTopic } from '@chickadee/dictionary';
import { getLocale, t } from '@chickadee/i18n';

export type { Drill, DrillLang, DrillTopic };

/** 판 하나. 문제 하나 × 언어 하나다 — 같은 문제를 파이썬과 자바로 두 번 풀 수 있다. */
export interface DrillItem {
  /** `<문제 id>:<언어>`. 판이 바뀌면 이 값이 바뀐다. */
  id: string;
  drillId: string;
  lang: DrillLang;
  topic: DrillTopic;
  /** 지문 — 로케일이 풀린 한 줄 (`ko` 가 정본, `en` 병기). */
  statement: string;
  /** 이 문제가 딛는 0부 개념들. 판 뒤에 「이건 그 개념이다」로 되비친다. */
  needs: readonly string[];
  cases: readonly { name: string; stdin: string; stdout: string }[];
  /** 코드 창의 첫 글자. **입력을 읽는 데까지만** 깔아 준다 — 나머지가 물음이다. */
  starter: string;
  /** Monaco 언어 id (`monacoOptions.MONACO_LANGUAGES` 안). */
  grammar: string;
  /** 화면에 뜨는 언어 이름. */
  langName: string;
}

/** 언어 셋의 껍데기. 값이 아니라 **읽는 자리**만 깔아 준다. */
const SHELL: Readonly<Record<DrillLang, { grammar: string; name: string; starter: (here: string) => string }>> = {
  py: {
    grammar: 'python',
    name: 'Python',
    starter: (here) => ['import sys', '', 'data = sys.stdin.read()', `# ${here}`, ''].join('\n'),
  },
  ts: {
    grammar: 'typescript',
    name: 'TypeScript',
    starter: (here) => [
      "import { readFileSync } from 'node:fs';",
      '',
      "const data: string = readFileSync(0, 'utf8');",
      `// ${here}`,
      '',
    ].join('\n'),
  },
  java: {
    grammar: 'java',
    name: 'Java',
    starter: (here) => [
      'import java.io.*;',
      '',
      'public class Main {',
      '    public static void main(String[] args) throws IOException {',
      '        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));',
      `        // ${here}`,
      '    }',
      '}',
      '',
    ].join('\n'),
  },
};

/** 문제 하나에 언어 하나를 입힌다. 그 언어를 안 받는 문제면 `null`. */
export function toDrillItem(drill: Drill, lang: DrillLang): DrillItem | null {
  if (!drill.langs.includes(lang)) return null;
  const shell = SHELL[lang];
  return {
    id: `${drill.id}:${lang}`,
    drillId: drill.id,
    lang,
    topic: drill.topic,
    // `ko` 가 정본이라 영어 쪽이 비면 한국어로 물러선다 (D117·D118 · `resolveConcept` 선례).
    statement: getLocale() === 'en' && drill.statement.en !== '' ? drill.statement.en : drill.statement.ko,
    needs: drill.needs,
    cases: drill.cases.map((c, i) => ({
      name: t('drill.caseNo', { n: String(i + 1) }),
      stdin: c.stdin,
      stdout: c.stdout,
    })),
    starter: shell.starter(t('drill.starterHere')),
    grammar: shell.grammar,
    langName: shell.name,
  };
}

/**
 * 0부가 덮은 것 전부를 이름 하나의 집합으로.
 *
 * 문제의 `needs` 는 **보편 개념**(`common/`·`cs/`)으로 적혀 있고 0부의 판은 **언어 개념**
 * (`java/arithmetic`)이라, 둘을 그냥 견주면 한 문제도 안 걸린다. 그래서 개념마다 셋을
 * 다 넣는다 — 자기 id · `universal` · `prereq`. `cs/integer-overflow` 같은 기계 개념이
 * 0부의 essential 이 아니라 그 **선행**이라는 사실이 이 함수가 있는 이유다.
 */
export function coverOf(
  concepts: Iterable<{ id: string; universal?: string | null; prereq?: readonly string[] }>,
): Set<string> {
  const out = new Set<string>();
  for (const c of concepts) {
    out.add(c.id);
    if (c.universal != null) out.add(c.universal);
    for (const p of c.prereq ?? []) out.add(p);
  }
  return out;
}

export interface DrillPlaceInput {
  lang: DrillLang;
  /** {@link coverOf} 가 낸 것 — 0부가 덮은 개념 id 전부. */
  covered: ReadonlySet<string>;
  /** 문제를 밖에서 넣고 싶을 때(시험). 생략하면 번들에 든 것 전부. */
  drills?: readonly Drill[];
}

export interface DrillPlacement {
  /** 0부 뒤에 이 순서대로 꽂는다. */
  items: DrillItem[];
  /** 안 낸 문제와 그 이유. 화면이 「굽지 못했다 — 이유」를 말할 근거다 (D186 ④). */
  drops: { drillId: string; reason: string }[];
}

/**
 * **0부 끝에 꽂을 판들** (D186 ⑧).
 *
 * 부 배치는 `packages/course/src/curriculum.ts` 의 소유라 여기서 안 건드린다 — 이 함수가
 * 내는 것은 「0부 뒤·1부 앞에 이 순서로 이만큼」 하나이고, 그것을 실제로 끼우는 것은 코스다.
 *
 * 규칙 둘. ① `needs` 가 **하나라도 안 덮이면 안 낸다** — 0부에서 안 배운 값을 물으면 그 판이
 * 재는 것이 학습이 아니라 눈치다. ② 안 낸 것은 조용히 사라지지 않고 `drops` 에 사유가 남는다.
 */
export function drillsAfterPart0(input: DrillPlaceInput): DrillPlacement {
  const all = input.drills ?? loadDrills().list;
  const items: DrillItem[] = [];
  const drops: { drillId: string; reason: string }[] = [];
  for (const drill of all) {
    if (!drill.langs.includes(input.lang)) {
      drops.push({ drillId: drill.id, reason: t('drill.dropLang', { lang: input.lang }) });
      continue;
    }
    const missing = drill.needs.filter((n) => !input.covered.has(n));
    if (missing.length > 0) {
      drops.push({ drillId: drill.id, reason: t('drill.dropNeeds', { ids: missing.join(', ') }) });
      continue;
    }
    const item = toDrillItem(drill, input.lang);
    if (item !== null) items.push(item);
  }
  return { items, drops };
}
