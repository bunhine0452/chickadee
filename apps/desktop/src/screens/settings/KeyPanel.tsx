import { FlatButton } from '@chickadee/ui';
import { useEffect, useId, useRef, useState } from 'react';

import { dropKey, keyState, storeKey, type KeyState } from '../../data/llmKey.js';
import './KeyPanel.css';

/**
 * 설정의 「LLM 키」 칸 (06 §3.5 · D106).
 *
 * 하는 말은 세 가지뿐이다 — 키 없음 · 키 있음 · 이 컴퓨터에는 저장 불가. **「보내기」는
 * 없다**: D106 이 MVP 에서 전송을 뺐고, 01 §7 이 `llm_ask` 를 0.2 로 미뤘다. 그래서 키가
 * 있을 때 이 화면이 하는 말은 「보낼 수 있습니다」가 아니라 「0.2 에서 열립니다」다.
 *
 * 06 §3.6 의 프라이버시 노트와 어긋나는 말을 하지 않는다 — **지금의 사실은 「전송하지
 * 않는다」**이고, 프롬프트를 만들고 복사하는 것은 키가 없어도 그대로 된다(05 `AskRung`).
 *
 * 제목은 그리지 않는다. 이 패널을 담는 `SettingsScreen` 의 절이 이미 「LLM 키」라는
 * `h2` 를 갖고 있어 여기서 또 매기면 제목이 두 겹이 된다.
 */

const COPY = {
  loading: '키체인을 확인하는 중입니다.',
  noSend: '지금 이 앱은 아무것도 스스로 전송하지 않습니다. 「자유 질문」에서 프롬프트를 만들고 복사하는 것은 키가 없어도 그대로 됩니다.',
  none: '키를 넣어 두면 그 프롬프트를 앱에서 바로 보내는 문이 0.2 에서 열립니다. 지금은 저장만 합니다.',
  noneNote: '키는 이 컴퓨터의 키체인에만 들어갑니다. 넣고 나면 화면에도 로그에도 다시 나오지 않습니다.',
  stored: '이 컴퓨터의 키체인에 저장돼 있습니다.',
  storedSoon: '보내기는 0.2 에서 열립니다. 지금 할 수 있는 것은 프롬프트를 만들어 복사하는 것까지입니다.',
  storedNote: '값은 다시 보여 드리지 않습니다 — 되읽는 문 자체가 없습니다.',
  unavailable: '이 컴퓨터에는 안전하게 저장할 수 없습니다(Secret Service 없음). 프롬프트 복사는 그대로 됩니다.',
  unavailableNote: '평문 파일에는 두지 않습니다. gnome-keyring 이나 KWallet 을 설치한 뒤 이 화면을 다시 열어 주세요.',
  saved: '키를 저장했습니다.',
  dropped: '키를 지웠습니다.',
  cannotStore: '이 컴퓨터에는 키를 넣지 못했습니다.',
  failed: '저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
} as const;

export function KeyPanel() {
  const [state, setState] = useState<KeyState | 'loading'>('loading');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const inputId = useId();
  const noteId = useId();
  const saidRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let alive = true;
    void keyState()
      .then((s) => { if (alive) setState(s); })
      .catch(() => { if (alive) setState('unavailable'); });
    return () => { alive = false; };
  }, []);

  /**
   * 결과 한 줄로 포커스를 옮긴다. `aria-live` 를 새로 두지 않는 이유는 05 §7 이 앱에
   * 낭독 지점을 하나로 못박았고 그것은 화면(`SettingsScreen`)의 것이기 때문이다 —
   * 이 패널은 props 가 없어 그리로 보낼 수 없다. 저장하면 누르던 버튼 자체가 사라지므로
   * 포커스는 어차피 옮겨야 하고, 옮긴 자리에서 읽히는 편이 맞다.
   */
  useEffect(() => {
    if (said !== '') saidRef.current?.focus();
  }, [said]);

  async function save() {
    if (busy || value.trim() === '') return;
    setBusy(true);
    try {
      const next = await storeKey(value);
      setState(next);
      setSaid(next === 'stored' ? COPY.saved : COPY.cannotStore);
    } catch {
      // 오류에는 키가 실려 있지 않고, 실려 있어도 화면에 옮기지 않는다 (06 §3.5).
      setSaid(COPY.failed);
    } finally {
      // 성공이든 실패든 입력을 비운다 — 실패한 값을 다시 보여 주지 않는다.
      setValue('');
      setBusy(false);
    }
  }

  async function drop() {
    if (busy) return;
    setBusy(true);
    try {
      await dropKey();
      setState(await keyState());
      setSaid(COPY.dropped);
    } catch {
      setSaid(COPY.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="keypanel">
      {state === 'loading' ? <p className="key-note">{COPY.loading}</p> : null}

      {state === 'none' ? (
        <>
          <p>{COPY.noSend}</p>
          <p>{COPY.none}</p>
          <form
            className="key-form"
            onSubmit={(e) => { e.preventDefault(); void save(); }}
          >
            <label className="key-k" htmlFor={inputId}>API 키</label>
            <input
              id={inputId}
              className="key-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={noteId}
              value={value}
              disabled={busy}
              onChange={(e) => setValue(e.currentTarget.value)}
            />
            <FlatButton disabled={busy || value.trim() === ''} onClick={() => void save()}>
              저장
            </FlatButton>
          </form>
          <p className="key-note" id={noteId}>{COPY.noneNote}</p>
        </>
      ) : null}

      {state === 'stored' ? (
        <>
          <p>{COPY.stored}</p>
          <p>{COPY.storedSoon}</p>
          <div className="key-form">
            <FlatButton ghost disabled={busy} onClick={() => void drop()}>지우기</FlatButton>
          </div>
          <p className="key-note">{COPY.storedNote}</p>
        </>
      ) : null}

      {state === 'unavailable' ? (
        <>
          <p>{COPY.unavailable}</p>
          <p className="key-note">{COPY.unavailableNote}</p>
        </>
      ) : null}

      {said === '' ? null : (
        <p className="key-said" tabIndex={-1} ref={saidRef}>{said}</p>
      )}
    </div>
  );
}
