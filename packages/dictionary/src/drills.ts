/**
 * 작은 문제 층의 원문 → 검증된 문제 (D186 ⑧ · `dictionary/drills/README.md`).
 *
 * 사전 로더(`load.ts`)와 **같은 자리, 다른 스키마**다. 사전은 개념 한 장이고 이쪽은 문제
 * 한 장이라 필드가 하나도 안 겹친다 — 그래서 `bundledLangs()` 가 `drills/` 를 아예 안 보고
 * (`bundle.ts` 의 `NOT_CONCEPTS`) 여기가 따로 읽는다.
 *
 * 사전과 같은 것도 둘 있다. **번들에 구워진다**(D66 — 파일 읽기가 Rust 예산에서 안 나간다)와
 * **어긴 파일은 건너뛰고 기록한다**(06 §4.2 — 파일 하나가 앱을 못 열게 하지 않는다).
 */
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import { bundledDrills } from './bundle.js';
import { conceptIdSchema, SUPPORTED_SCHEMA } from './schema.js';

/**
 * 주제 여섯. **이 배열의 순서가 곧 배치 순서다** — 대회 사이트의 첫 단계가 밟는 순서와 같고,
 * 그 순서만 가져왔다 (지문도 케이스도 우리가 쓴다 · `README.md`).
 */
export const DRILL_TOPICS = ['io', 'arithmetic', 'branch', 'loop', 'list', 'text'] as const;
export type DrillTopic = (typeof DRILL_TOPICS)[number];

/** 표준 입력 러너가 아는 언어 셋 (D186 ⑧). */
export const DRILL_LANGS = ['py', 'ts', 'java'] as const;
export type DrillLang = (typeof DRILL_LANGS)[number];

/** 케이스는 셋에서 다섯. 둘이면 우연히 맞고, 여섯이면 한 판이 30초를 넘는다. */
export const CASES_MIN = 3;
export const CASES_MAX = 5;

export const drillSchema = z
  .object({
    schema: z.number().refine((n) => (SUPPORTED_SCHEMA as readonly number[]).includes(n)),
    /** 디렉터리 이름과 같아야 한다 — 어긋나면 건너뛰고 기록한다. */
    id: z.string().regex(/^[a-z][a-z0-9-]*$/u),
    topic: z.enum(DRILL_TOPICS),
    /** 세 문장 이내. **한국어가 정본**이고 영어를 병기한다 (D117·D118). */
    statement: z.object({ ko: z.string().min(1).max(400), en: z.string().min(1).max(400) }),
    /** 0부 개념 id 들. 이 문제가 나오려면 먼저 서야 하는 것. */
    needs: z.array(conceptIdSchema).min(1),
    langs: z.array(z.enum(DRILL_LANGS)).min(1),
    cases: z
      .array(z.object({ stdin: z.string(), stdout: z.string() }))
      .min(CASES_MIN)
      .max(CASES_MAX),
  })
  .strict();

export type Drill = z.infer<typeof drillSchema>;

export interface DrillProblem {
  relPath: string;
  reason: 'yaml' | 'schema' | 'id-mismatch' | 'duplicate';
  detail: string;
}

export interface Drills {
  /** `topic` 순서, 그 안은 파일 순서. 배치가 이 순서를 그대로 쓴다. */
  list: readonly Drill[];
  byId: ReadonlyMap<string, Drill>;
  problems: readonly DrillProblem[];
}

/** `drills/floor-divide/drill.yaml` → `floor-divide`. */
function dirOf(relPath: string): string | null {
  const parts = relPath.split('/');
  return parts.length === 3 && parts[2] === 'drill.yaml' ? (parts[1] ?? null) : null;
}

const rank = (t: DrillTopic): number => DRILL_TOPICS.indexOf(t);

export function loadDrills(): Drills {
  const list: Drill[] = [];
  const byId = new Map<string, Drill>();
  const problems: DrillProblem[] = [];

  for (const { relPath, text } of bundledDrills()) {
    const dir = dirOf(relPath);
    if (dir === null) continue;
    let raw: unknown;
    try {
      raw = parseYaml(text);
    } catch (e) {
      problems.push({ relPath, reason: 'yaml', detail: e instanceof Error ? e.message : String(e) });
      continue;
    }
    const parsed = drillSchema.safeParse(raw);
    if (!parsed.success) {
      problems.push({ relPath, reason: 'schema', detail: parsed.error.issues[0]?.message ?? '' });
      continue;
    }
    if (parsed.data.id !== dir) {
      problems.push({ relPath, reason: 'id-mismatch', detail: `${parsed.data.id} ≠ ${dir}` });
      continue;
    }
    if (byId.has(parsed.data.id)) {
      problems.push({ relPath, reason: 'duplicate', detail: parsed.data.id });
      continue;
    }
    byId.set(parsed.data.id, parsed.data);
    list.push(parsed.data);
  }

  list.sort((a, b) => rank(a.topic) - rank(b.topic) || a.id.localeCompare(b.id));
  return { list, byId, problems };
}
