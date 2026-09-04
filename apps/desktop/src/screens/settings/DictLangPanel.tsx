/**
 * 문법 사전 언어 고르기 (05 §2.1 · D122).
 *
 * 목록은 **이 DB 에 물질화된 언어**다(`derive.dict_langs`) — 번들 사전이 아는 것이 아니라
 * 실제로 카드를 만들 수 있는 것이라야 체크박스가 거짓말을 하지 않는다.
 *
 * 저장 값의 규약: **빈 목록 = 전부 켜짐**. 그래서 마지막 하나를 끄려 하면 「전부 켜짐」과
 * 구별되지 않는다 — 그 자리는 막는다(끄고 싶으면 다른 것을 먼저 켜라).
 */
import { t } from '@chickadee/i18n';

export interface DictLang {
  lang: string;
  conceptCount: number;
}

export interface DictLangPanelProps {
  langs: readonly DictLang[];
  /** 켠 언어. 비면 전부 켜진 것이다. */
  value: readonly string[];
  onChange: (next: string[]) => void;
}

export function DictLangPanel({ langs, value, onChange }: DictLangPanelProps) {
  if (langs.length === 0) return <p className="set-note">{t('settings.dictLangs.empty')}</p>;

  const all = langs.map((l) => l.lang);
  const on = (lang: string): boolean => value.length === 0 || value.includes(lang);

  const toggle = (lang: string): void => {
    const current = value.length === 0 ? all : value;
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    // 하나도 안 남으면 「전부 켜짐」과 같은 값이 된다. 그 뜻이 아니므로 되돌린다.
    if (next.length === 0) return;
    onChange(next.length === all.length ? [] : next.sort());
  };

  return (
    <ul className="dictlangs">
      {langs.map((l) => (
        <li key={l.lang}>
          <label className="dictlang">
            <input type="checkbox" checked={on(l.lang)} onChange={() => toggle(l.lang)} />
            <span className="dictlang-k">{l.lang}</span>
            <span className="set-note">
              {t('settings.dictLangs.count', { n: String(l.conceptCount) })}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
