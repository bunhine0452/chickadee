/**
 * 언어 코스 — 목차 머리의 선택지와 부 넷 (D190).
 *
 * 사용자가 언어를 고르면 그 언어의 0·1·2·3부가 기능 챕터 **앞**에 선다(정본 §4 의 마지막
 * 문장 — 「3부가 끝나면 코스는 내 리포의 기능 챕터로 넘어간다」). 선택지에는 열 언어가 전부
 * 보인다 — 사전이 아직 없는 언어도 **숨기지 않고** 「저작 전」이라고 적는다(D186 ④).
 *
 * 부의 선택값은 챕터 id 와 같은 칸(`selected`)에 음수로 든다 — `GRAD_ID` 와 같은 규약이다.
 */
import type { CourseLang, PartNo } from '@chickadee/course';
import { partsOf } from '@chickadee/course';
import { t, type MessageKey } from '@chickadee/i18n';
import { cx } from '@chickadee/ui';

import type { LangCourseData } from './lang-data.js';

/** 부 `n` 의 선택값. 챕터 id 는 양수, 졸업은 -1 이라 겹치지 않는다. */
export const partId = (part: PartNo): number => -100 - part;

/** 선택값이 부면 그 번호, 아니면 `null`. */
export function partOfId(id: number | null): PartNo | null {
  if (id === null || id > -100 || id < -103) return null;
  return (-100 - id) as PartNo;
}

export const PART_KEY: Readonly<Record<PartNo, MessageKey>> = {
  0: 'chapter.part0', 1: 'chapter.part1', 2: 'chapter.part2', 3: 'chapter.part3',
};

const LANG_KEY: Readonly<Record<CourseLang, MessageKey>> = {
  py: 'chapter.langName.py', c: 'chapter.langName.c', cpp: 'chapter.langName.cpp',
  java: 'chapter.langName.java', csharp: 'chapter.langName.csharp', ts: 'chapter.langName.ts',
  sql: 'chapter.langName.sql', rs: 'chapter.langName.rs', go: 'chapter.langName.go',
  swift: 'chapter.langName.swift',
};

/** 언어의 표시 이름. 목록 밖의 글자는 그대로 낸다 — 거짓 이름을 짓지 않는다. */
export function langName(lang: string): string {
  const key = (LANG_KEY as Record<string, MessageKey | undefined>)[lang];
  return key === undefined ? lang : t(key);
}

export interface LangCourseProps {
  data: LangCourseData | null;
  selected: number | null;
  busy: boolean;
  /** `null` 은 「리포의 주 언어를 따른다」로 되돌리는 것이다. */
  onPickLang: (lang: string | null) => void;
  onSelect: (id: number) => void;
}

export function LangCourse(props: LangCourseProps): React.JSX.Element {
  const { data } = props;
  if (data === null) return <div className="cc-lang" aria-busy="true" />;

  const name = data.lang === null ? null : langName(data.lang);
  const authored = data.lang !== null && data.options.some((o) => o.lang === data.lang && o.authored);
  // 개념이 실린 부만 줄이 선다 — 3부는 프레임워크 사전이 있는 언어에만 있다.
  const assigned = new Set((data.lang === null ? [] : partsOf(data.lang) ?? [])
    .filter((p) => p.concepts.length > 0).map((p) => p.part));

  return (
    <div className="cc-lang">
      <h3>{t('chapter.langSec')}</h3>
      <label className="cc-lang-pick">
        <span className="cc-lang-k">{t('chapter.langPick')}</span>
        <select
          value={data.auto ? '' : data.lang ?? ''}
          disabled={props.busy}
          onChange={(e) => props.onPickLang(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">
            {name === null ? t('chapter.langAutoNone') : t('chapter.langAuto', { lang: name })}
          </option>
          {data.options.map((o) => (
            <option key={o.lang} value={o.lang}>
              {o.authored
                ? t('chapter.langOpt', { name: langName(o.lang), n: String(o.concepts), files: String(o.files) })
                : t('chapter.langOptUnauthored', { name: langName(o.lang) })}
            </option>
          ))}
        </select>
      </label>

      {data.lang === null ? (
        <p className="note">{t('chapter.langNone')}</p>
      ) : !authored ? (
        <p className="note">{t('chapter.langUnauthored', { name: name ?? data.lang })}</p>
      ) : !data.hasFiles ? (
        <p className="note">{t('chapter.langNoFiles', { name: name ?? data.lang })}</p>
      ) : null}

      {data.parts.length === 0 ? null : (
        <ol className="cc-rows">
          {data.parts.filter((p) => assigned.has(p.part)).map((p) => {
            const id = partId(p.part);
            const here = props.selected === id;
            return (
              <li key={p.part} className={cx('cc-row', here && 'cur')}>
                <button
                  type="button"
                  className="cc-rowbtn"
                  aria-current={here ? 'true' : undefined}
                  onClick={() => props.onSelect(id)}
                >
                  <span className="cc-no">{t('chapter.partNo', { n: String(p.part) })}</span>
                  <span className="cc-name u-truncate">{t(PART_KEY[p.part])}</span>
                  <span className="cc-st">
                    {p.plates.length === 0
                      ? t('chapter.partEmpty')
                      : p.folded ? t('chapter.partFolded') : t('chapter.partCount', { n: String(p.plates.length) })}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
