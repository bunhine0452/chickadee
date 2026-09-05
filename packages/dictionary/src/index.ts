export { bundledDrills, bundledFile, bundledFiles, bundledLangs } from './bundle.js';
export { keyOf, langSpecs, loadDict, prereqClosure } from './load.js';
export type { Dict, DictProblem, LoadOptions } from './load.js';
export { ALLOWED_TAGS, authoringDebt, debtTable, lintDict, revealsToken } from './lint.js';
export type { DebtCheck, LintIssue } from './lint.js';
export { resolveConcept, resolveLangMeta } from './resolve.js';
export {
  GRAMMARS, SUPPORTED_SCHEMA, UNLINKED_GRAMMARS, blankSchema, conceptIdSchema, conceptSchema,
  conceptSourceSchema, grammarSchema, isLinkedGrammar, isLocalized, kindOf, koOf, langMetaSchema,
  langMetaSourceSchema, langOf, localizedSchema, meaningSchema, pointSchema, textOf, whyGateSchema,
} from './schema.js';
export type {
  Concept, Grammar, LangMeta, Locale, Localized, SourceConcept, SourceLangMeta,
} from './schema.js';

/** 쿼리 없이 사는 네임스페이스 (D157 §7) — 접두어 목록이 여기 하나다. */
export { COMPUTED_NAMESPACES, isComputed } from './schema.js';

/** 작은 문제 층 — 사전과 같은 자리, 다른 스키마 (D186 ⑧). */
export {
  CASES_MAX, CASES_MIN, DRILL_LANGS, DRILL_TOPICS, drillSchema, loadDrills,
} from './drills.js';
export type { Drill, DrillLang, DrillProblem, Drills, DrillTopic } from './drills.js';
