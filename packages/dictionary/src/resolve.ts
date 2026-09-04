/**
 * 원문(양쪽 언어) → 한 언어로 푼 값 (D118).
 *
 * 카드·채점은 `{ ko, en }` 을 모른다 — 문자열 하나를 받는다. 그 경계가 여기다. `en` 이 없는
 * 자리는 `ko` 를 내고(빈 칸을 그리지 않는다) **어디가 폴백이었는지**를 개념에 남긴다.
 * 화면이 그 목록으로 「이 개념은 아직 한국어입니다」 한 줄을 낸다.
 *
 * 폴백을 세는 기준은 「ko 에 한글이 있는가」다. `?.` · `map` · `[a, b] =` 처럼 한글이 한
 * 글자도 없는 값은 코드 토큰이라 번역할 것이 없고, 그것까지 세면 다 번역된 개념도 미번역으로
 * 보인다.
 */
import { mapProse } from './prose.js';
import {
  conceptSchema, langMetaSchema, textOf,
  type Concept, type LangMeta, type Locale, type SourceConcept, type SourceLangMeta,
} from './schema.js';

const HANGUL = /[가-힣]/;

export function resolveConcept(source: SourceConcept, locale: Locale): Concept {
  const missing: string[] = [];
  const mapped = mapProse(source, (path, value) => {
    const { text, fellBack } = textOf(value, locale);
    if (fellBack && HANGUL.test(text)) missing.push(path);
    return text;
  });
  // 다시 파싱하는 값은 스키마가 보증한다 — 목록에서 빠진 문자열이 있으면 여기서 터진다.
  const resolved = conceptSchema.parse(mapped);
  return missing.length === 0 ? resolved : { ...resolved, untranslated: missing };
}

export function resolveLangMeta(source: SourceLangMeta, locale: Locale): LangMeta {
  const pick = (value: SourceLangMeta['diag_default']['point']): string => textOf(value, locale).text;
  return langMetaSchema.parse({
    ...source,
    alternatives: source.alternatives.map((a) => (
      a.note === undefined ? a : { ...a, note: pick(a.note) }
    )),
    diag_default: { point: pick(source.diag_default.point), blank: pick(source.diag_default.blank) },
  });
}
