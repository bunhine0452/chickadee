/**
 * 원문 → 검증된 사전 (01 §2 · 03 §5). Rust 는 YAML 을 읽지 않는다 (D40).
 *
 * 스키마를 어긴 개념은 **건너뛰고 기록한다** — 사전 파일 하나가 앱 전체를 못 열게 하면
 * 커뮤니티 기여가 곧 장애가 된다(06 §4.2). 무엇을 건너뛰었는지는 `problems` 에 남는다.
 */
import type { LangSpec } from '@chickadee/ipc-client';
import { parse as parseYaml } from 'yaml';

import { bundledFiles, bundledLangs } from './bundle.js';
import { resolveConcept, resolveLangMeta } from './resolve.js';
import {
  conceptSourceSchema, langMetaSourceSchema, SUPPORTED_SCHEMA,
  type Concept, type Grammar, type LangMeta, type Locale,
  type SourceConcept, type SourceLangMeta,
} from './schema.js';

/** 건너뛴 파일 하나. 로그와 개발자 패널이 읽는다. */
export interface DictProblem {
  relPath: string;
  reason: 'yaml' | 'schema' | 'unsupported-schema' | 'id-mismatch' | 'missing-query';
  detail: string;
}

export interface Dict {
  /** 이 사전을 어느 언어로 풀었는가 (D118). `concepts` 의 문자열은 전부 이 언어다. */
  locale: Locale;
  langs: ReadonlyMap<string, LangMeta>;
  concepts: ReadonlyMap<string, Concept>;
  /**
   * 로케일을 풀기 전의 원문. 린트와 번역 도구가 두 언어를 다 봐야 하므로 남긴다 —
   * 화면·카드·채점은 `concepts` 만 본다.
   */
  sources: ReadonlyMap<string, SourceConcept>;
  /** `<conceptId>::<grammar>` → `.scm` 원문. */
  queries: ReadonlyMap<string, string>;
  problems: readonly DictProblem[];
}

export interface LoadOptions {
  /** 리포 `package.json` 의 의존성 이름들. 프레임워크 사전의 게이트다 (D59). */
  dependencies?: readonly string[];
  /**
   * 리포 루트의 빌드 매니페스트 — 파일명 → 원문 (D176). `build.gradle`·`pom.xml` 처럼
   * 의존성이 이름 목록이 아니라 글 안에 있는 스택의 게이트다. 넘기지 않으면 그 신호를
   * 쓰는 사전(`spring/`)은 로드되지 않는다 — `react/` 가 `dependencies` 없이 안 뜨는 것과 같다.
   */
  manifests?: Readonly<Record<string, string>>;
  /** 이 언어만. 생략하면 번들에 든 전부. */
  langs?: readonly string[];
  /** 사람이 읽는 문자열을 어느 언어로 풀 것인가. 기본은 정본인 `ko` 다 (D117 · D118). */
  locale?: Locale;
}

const systemIds = ['_imports', '_blocks'] as const;

/**
 * 같은 옵션이면 같은 사전이다 — 번들은 빌드 산출물이라 실행 중에 바뀌지 않는다.
 * YAML 60여 파일 파싱을 인제스트마다 되풀이하지 않기 위한 것이고, 결과는 읽기 전용이다.
 */
const CACHE = new Map<string, Dict>();

/** 번들 사전을 읽어 검증한다. 감지에 실패한 프레임워크 사전은 아예 로드하지 않는다. */
export function loadDict(options: LoadOptions = {}): Dict {
  // 매니페스트는 원문째로 키에 든다 — 무엇을 찾을지는 사전이 정하므로(`contains`) 여기서
  // 줄여 담을 수 없다. `build.gradle` 한두 장이라 값이 작다.
  const key = JSON.stringify([
    [...(options.dependencies ?? [])].sort(), options.langs ?? null, options.locale ?? 'ko',
    Object.entries(options.manifests ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  ]);
  const hit = CACHE.get(key);
  if (hit) return hit;
  const built = build(options);
  CACHE.set(key, built);
  return built;
}

function build(options: LoadOptions): Dict {
  const locale = options.locale ?? 'ko';
  const langs = new Map<string, LangMeta>();
  const concepts = new Map<string, Concept>();
  const sources = new Map<string, SourceConcept>();
  const queries = new Map<string, string>();
  const problems: DictProblem[] = [];
  const deps = new Set(options.dependencies ?? []);
  const manifests = options.manifests ?? {};
  const wanted = options.langs ? new Set(options.langs) : null;

  for (const lang of bundledLangs()) {
    if (wanted && !wanted.has(lang)) continue;
    const files = bundledFiles(lang);
    // `_lang.yaml` 이 없는 네임스페이스(`COMPUTED_NAMESPACES`)는 개념만 싣는다 —
    // 문법에 매이지 않아 `grammars`·`extensions`·`essential` 을 댈 것이 없다 (D157 §7).
    const meta = readMeta(lang, files, problems);
    // 감지 신호가 선언돼 있으면 그 신호가 있는 리포에서만 쓴다 (D59 · D176).
    if (meta?.detect && !detected(meta.detect, deps, manifests)) continue;
    if (meta) langs.set(lang, resolveLangMeta(meta, locale));

    const text = new Map(files.map((f) => [f.relPath, f.text]));
    for (const { relPath } of files) {
      if (!relPath.endsWith('.yaml') || relPath.endsWith('/_lang.yaml')) continue;
      const concept = readConcept(relPath, text.get(relPath) ?? '', problems);
      if (!concept) continue;
      sources.set(concept.id, concept);
      concepts.set(concept.id, resolveConcept(concept, locale));
      collectQueries(concept, relPath, text, queries, problems);
    }
    // 시스템 쿼리는 **문법**의 것이지 네임스페이스의 것이 아니다. 두 사전이 같은 문법을
    // 걸면 먼저 온 쪽이 이긴다 — `bundledLangs()` 가 정렬돼 있어 순서가 정해져 있다.
    for (const id of systemIds) {
      const scm = text.get(`${lang}/${id}.scm`);
      if (scm === undefined || !meta) continue;
      for (const grammar of meta.grammars) {
        if (!queries.has(keyOf(id, grammar))) queries.set(keyOf(id, grammar), scm);
      }
    }
  }
  pruneDanglingRefs(concepts);
  return { locale, langs, concepts, sources, queries, problems };
}

export const keyOf = (conceptId: string, grammar: string): string => `${conceptId}::${grammar}`;

/**
 * 로드되지 않은 사전을 가리키는 `prereq`·`confusions` 를 떨군다 (D176 · D177).
 *
 * `cs/` 는 언제나 로드되지만 **프레임워크 사전은 감지 게이트 뒤에 있다**(D59). 스프링이 아닌
 * 자바 리포에서 `java/annotation.prereq` 의 `spring/proxy-and-aop` 는 **존재하지 않는 id** 가
 * 된다. 미지 개념 수는 계산 네임스페이스를 빼므로 안 틀리지만(D173), 사다리 2단의 아래층
 * 목록(`packages/cards/src/payload.ts` 의 `prereqOf`)은 못 찾은 id 를 **그 id 그대로 한 줄로
 * 그린다** — 학습자에게 `spring/proxy-and-aop` 라는 글자가 개념 이름 자리에 뜬다. 원장의
 * `concept_prereq` 에도 없는 개념을 가리키는 행이 들어간다.
 *
 * **`sources` 는 안 건드린다.** 린트의 `reference-exists` 가 오타를 잡는 자리가 거기다
 * (`dict.test.ts` 는 프레임워크 둘을 켜고 로드하므로 조건부 참조는 거기서 전부 보인다).
 * 두 곳에서 다 지우면 「오타라서 없다」와 「이 리포엔 그 사전이 없다」가 구별되지 않는다.
 *
 * 선행을 **지우는 것이 아니라 로드 시점에 거른다** — 스프링 리포에서는 그대로 걸린다.
 */
function pruneDanglingRefs(concepts: Map<string, Concept>): void {
  for (const [id, concept] of concepts) {
    const prereq = concept.prereq.filter((ref) => concepts.has(ref));
    const confusions = concept.confusions.filter((ref) => concepts.has(ref));
    if (prereq.length === concept.prereq.length && confusions.length === concept.confusions.length) {
      continue;
    }
    concepts.set(id, { ...concept, prereq, confusions });
  }
}

/**
 * 이 리포에 그 프레임워크가 있나 (D59 · D176). 두 신호를 한 자리에서 판정한다 —
 * 갈라 두면 새 신호를 더할 때 한쪽만 고치게 된다.
 *
 * 매니페스트 쪽은 **글자가 보이는가**만 본다. `build.gradle` 의 의존성 표기가
 * `implementation 'org.springframework.boot:spring-boot-starter-web'` 이라 이름만 떼어
 * 목록으로 만들려면 Groovy·Kotlin·XML 세 문법을 읽어야 하고, 그것은 감지가 할 일이 아니다.
 */
function detected(
  detect: NonNullable<SourceLangMeta['detect']>,
  deps: ReadonlySet<string>,
  manifests: Readonly<Record<string, string>>,
): boolean {
  if ('dependency' in detect) return deps.has(detect.dependency);
  return detect.manifest.some((name) => manifests[name]?.includes(detect.contains) === true);
}

function readMeta(
  lang: string,
  files: readonly { relPath: string; text: string }[],
  problems: DictProblem[],
): SourceLangMeta | null {
  const relPath = `${lang}/_lang.yaml`;
  const raw = files.find((f) => f.relPath === relPath)?.text;
  if (raw === undefined) return null;
  const parsed = tryYaml(raw, relPath, problems);
  if (parsed === undefined) return null;
  const checked = langMetaSourceSchema.safeParse(parsed);
  if (!checked.success) {
    problems.push({ relPath, reason: 'schema', detail: checked.error.issues[0]?.message ?? '' });
    return null;
  }
  if (checked.data.lang !== lang) {
    problems.push({ relPath, reason: 'id-mismatch', detail: `${checked.data.lang} ≠ ${lang}` });
    return null;
  }
  return checked.data;
}

function readConcept(relPath: string, raw: string, problems: DictProblem[]): SourceConcept | null {
  const parsed = tryYaml(raw, relPath, problems);
  if (parsed === undefined) return null;
  const version = (parsed as { schema?: unknown }).schema;
  if (typeof version === 'number' && !SUPPORTED_SCHEMA.includes(version as 1)) {
    problems.push({ relPath, reason: 'unsupported-schema', detail: String(version) });
    return null;
  }
  const checked = conceptSourceSchema.safeParse(parsed);
  if (!checked.success) {
    const issue = checked.error.issues[0];
    const where = issue?.path.join('.') ?? '';
    problems.push({ relPath, reason: 'schema', detail: `${where}: ${issue?.message ?? ''}` });
    return null;
  }
  // 파일 경로가 곧 id 다 — 어긋나면 사전이 스스로를 못 가리킨다 (03 §5.1).
  const expected = relPath.replace(/\.yaml$/, '');
  if (checked.data.id !== expected) {
    problems.push({ relPath, reason: 'id-mismatch', detail: `${checked.data.id} ≠ ${expected}` });
    return null;
  }
  return checked.data;
}

function collectQueries(
  concept: SourceConcept,
  relPath: string,
  text: ReadonlyMap<string, string>,
  queries: Map<string, string>,
  problems: DictProblem[],
): void {
  const dir = relPath.slice(0, relPath.lastIndexOf('/'));
  for (const entry of concept.queries) {
    const file = `${dir}/${entry.file.replace(/^\.\//, '')}`;
    const scm = text.get(file);
    if (scm === undefined) {
      problems.push({ relPath, reason: 'missing-query', detail: entry.file });
      continue;
    }
    for (const grammar of entry.grammars) queries.set(keyOf(concept.id, grammar), scm);
  }
}

function tryYaml(raw: string, relPath: string, problems: DictProblem[]): unknown {
  try {
    return parseYaml(raw) as unknown;
  } catch (e) {
    problems.push({ relPath, reason: 'yaml', detail: e instanceof Error ? e.message : String(e) });
    return undefined;
  }
}

/**
 * 인제스트에 넘길 문법별 명세 (03 §2.1). 확장자 → grammar 는 사전이 정하고,
 * Rust 는 이 표를 그대로 적용하기만 한다.
 */
export function langSpecs(dict: Dict, maxFileBytes: number): LangSpec[] {
  const byGrammar = new Map<Grammar, { extensions: Set<string>; queries: Map<string, string> }>();
  for (const meta of dict.langs.values()) {
    for (const [grammar, extensions] of Object.entries(meta.extensions)) {
      const slot = byGrammar.get(grammar as Grammar)
        ?? { extensions: new Set<string>(), queries: new Map<string, string>() };
      for (const ext of extensions ?? []) slot.extensions.add(ext);
      byGrammar.set(grammar as Grammar, slot);
    }
  }
  for (const [key, scm] of dict.queries) {
    const at = key.lastIndexOf('::');
    const id = key.slice(0, at);
    const grammar = key.slice(at + 2) as Grammar;
    byGrammar.get(grammar)?.queries.set(id, scm);
  }
  return [...byGrammar.entries()]
    .filter(([, v]) => v.extensions.size > 0 && v.queries.size > 0)
    .map(([grammar, v]) => ({
      grammar,
      extensions: [...v.extensions].sort(),
      maxFileBytes,
      queries: [...v.queries.entries()].map(([id, scm]) => ({ id, scm })).sort(byId),
    }))
    .sort((a, b) => a.grammar.localeCompare(b.grammar));
}

const byId = (a: { id: string }, b: { id: string }): number => a.id.localeCompare(b.id);

/**
 * 선행 개념을 `depth` 단까지 펼친 집합 (03 §3.6 의 `prereqClosure`).
 * 사이클이 있어도 멈춘다 — 사전 오류는 린트가 잡지만 런타임이 걸려서는 안 된다.
 */
export function prereqClosure(dict: Dict, id: string, depth: number): Set<string> {
  const out = new Set<string>();
  let front = [id];
  for (let step = 0; step < depth && front.length > 0; step += 1) {
    const next: string[] = [];
    for (const at of front) {
      for (const prereq of dict.concepts.get(at)?.prereq ?? []) {
        if (out.has(prereq)) continue;
        out.add(prereq);
        next.push(prereq);
      }
    }
    front = next;
  }
  out.delete(id);
  return out;
}
