/**
 * 내 커밋 identity 편집 (05 §2.1 「내 커밋 identity」 · 03 §1.2 · D121).
 *
 * 여기서 정한 목록이 `isMine()` 의 입력이고, 그 판정이 T2 정답지(`isAnswerKey`)와
 * 「선택의 왜」의 재료를 고른다. **비어 있으면 모든 커밋이 남의 것**이라 그 두 개가 통째로
 * 빈다 — 그래서 빈 상태를 조용히 두지 않고 화면이 말한다.
 *
 * IPC 는 모른다. 제안 목록은 부모가 읽어 넣고, 저장과 재분류도 부모가 한다 (05 §2.1 의
 * 「저장 버튼 없음」 규약 — 바꾸면 그 자리에서 내려간다).
 */
import type { Identity } from '@chickadee/concepts';
import { t } from '@chickadee/i18n';
import { FlatButton } from '@chickadee/ui';
import { useState } from 'react';

export interface IdentityPanelProps {
  value: readonly Identity[];
  /** 커밋 author 에서 뽑은 후보. 이미 목록에 있는 것은 부모가 걸러 넣지 않아도 된다. */
  suggestions: readonly Identity[];
  onChange: (next: Identity[]) => void;
  onSuggest: () => void;
}

/** 완전한 검사는 아니다 — `a@b` 를 통과시키고 공백과 `@` 없음만 막는다. */
const looksLikeEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+$/.test(v);

export function IdentityPanel({ value, suggestions, onChange, onSuggest }: IdentityPanelProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const has = (v: string): boolean =>
    value.some((i) => i.email.toLowerCase() === v.toLowerCase());

  const add = (next: Identity): void => {
    if (!looksLikeEmail(next.email)) return setError(t('settings.identity.invalid'));
    if (has(next.email)) return setError(t('settings.identity.duplicate'));
    setError('');
    onChange([...value, { email: next.email.trim(), name: next.name.trim() }]);
  };

  const addTyped = (): void => {
    add({ email, name });
    if (looksLikeEmail(email) && !has(email)) {
      setEmail('');
      setName('');
    }
  };

  const unlisted = suggestions.filter((s) => !has(s.email));

  return (
    <div className="ident">
      <ul className="ident-list">
        {value.map((i) => (
          <li key={i.email} className="ident-row">
            <span className="ident-mail">{i.email}</span>
            <span className="ident-name">{i.name}</span>
            <FlatButton
              ghost
              onClick={() => onChange(value.filter((v) => v.email !== i.email))}
            >
              {t('settings.identity.remove', { email: i.email })}
            </FlatButton>
          </li>
        ))}
      </ul>

      <div className="ident-add">
        <label className="ident-f">
          <span className="set-k">{t('settings.identity.email')}</span>
          <input
            type="text"
            className="set-text"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </label>
        <label className="ident-f">
          <span className="set-k">{t('settings.identity.name')}</span>
          <input
            type="text"
            className="set-text"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
        </label>
        <FlatButton onClick={addTyped}>{t('settings.identity.add')}</FlatButton>
      </div>

      {error !== '' && <p className="set-note ident-err">{error}</p>}

      <div className="ident-sug">
        <span className="set-k">{t('settings.identity.suggestions')}</span>
        {unlisted.map((s) => (
          <FlatButton key={s.email} ghost onClick={() => add(s)}>
            {s.name === '' ? s.email : `${s.name} · ${s.email}`}
          </FlatButton>
        ))}
        <FlatButton ghost onClick={onSuggest}>{t('settings.identity.suggest')}</FlatButton>
      </div>
      {suggestions.length === 0 && (
        <p className="set-note">{t('settings.identity.suggestNone')}</p>
      )}
    </div>
  );
}
