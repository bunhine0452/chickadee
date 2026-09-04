import { t } from '@chickadee/i18n';
import { FlatButton } from '@chickadee/ui';
import { useId, useState } from 'react';

import { cloneFromUrl } from './data.js';
import './CloneField.css';

export interface CloneFieldProps {
  /** 받아서 등록까지 끝난 뒤. 목록을 든 화면이 그것을 다시 읽는다. */
  onDone?: (() => void) | undefined;
}

/**
 * git clone 주소 한 줄 (D129 · 05 §2.4). 첫 실행과 서가가 **같은 것**을 쓴다 — 리포가
 * 들어오는 문은 폴더 고르기와 이것 둘뿐이고 둘 다 `addRepo` 로 모이므로, 문구도 흐름도
 * 한 자리에만 둔다.
 *
 * 받는 동안은 입력과 단추가 잠긴다. 진행률은 없다 — libgit2 의 진행을 화면까지 나르려면
 * 이벤트 통로가 하나 더 필요하고, 그것은 이 문이 나르는 정보(끝났나·실패했나)보다 크다.
 * 받은 뒤에는 인제스트 화면이 열려 시간 비례 큐가 그 자리를 대신한다.
 */
export function CloneField({ onDone }: CloneFieldProps) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const noteId = useId();

  const go = (): void => {
    const at = url.trim();
    if (busy || at === '') return;
    setBusy(true);
    void cloneFromUrl(at).then((ok) => {
      setBusy(false);
      if (!ok) return;
      setUrl('');
      onDone?.();
    });
  };

  return (
    <div className="clone-url">
      <form
        className="clone-form"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <label className="clone-k" htmlFor={inputId}>{t('repos.cloneLabel')}</label>
        <input
          id={inputId}
          className="clone-in"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('repos.clonePlaceholder')}
          aria-describedby={noteId}
          value={url}
          disabled={busy}
          onChange={(e) => setUrl(e.currentTarget.value)}
        />
        <FlatButton onClick={go} disabled={busy || url.trim() === ''}>
          {t(busy ? 'repos.cloneBusy' : 'repos.cloneGo')}
        </FlatButton>
      </form>
      <p className="clone-note" id={noteId}>{t('repos.cloneNote')}</p>
    </div>
  );
}
