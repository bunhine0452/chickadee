import { t } from '@chickadee/i18n';
import { FlatButton, RichText } from '@chickadee/ui';

import './AskRung.css';

export interface AskRungProps {
  /** 「막힌 지점」 입력값. */
  text: string;
  onText: (value: string) => void;
  /** 만들어진 프롬프트. 비어 있으면 「복사」가 잠긴다. */
  prompt?: string | undefined;
  onBuild: () => void;
  /**
   * 「복사」. 클립보드 쓰기는 여기서 하지 않는다 — 이 컴포넌트는 그릴 뿐이고,
   * 밖으로 나가는 일은 부르는 쪽이 한다 (정본 §3-1 ④ — 앱은 아무것도 스스로 전송하지 않는다).
   */
  onCopy: () => void;
}

/**
 * `.askbox` — 사다리 ④단, 자유 질문 (05 §5 · 정본 §3-1).
 *
 * 유일하게 선택 사항인 단이다. 키가 없어도 되고, 만드는 것은 프롬프트 글자뿐이다 —
 * 담는 것은 이 줄과 앞뒤 4줄, 그리고 파일 이름까지다.
 */
export function AskRung({ text, onText, prompt, onBuild, onCopy }: AskRungProps) {
  return (
    <>
      <h4>{t('ask.heading')}</h4>
      <RichText as="p" html={t('ask.note')} />

      <div className="askbox">
        <textarea
          aria-label={t('ask.field')}
          placeholder={t('ask.placeholder')}
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
        <div className="row">
          <FlatButton onClick={onBuild}>{t('ask.build')}</FlatButton>
          <FlatButton ghost disabled={prompt === undefined || prompt === ''} onClick={onCopy}>
            {t('ask.copy')}
          </FlatButton>
          <span className="note">{t('ask.noKey')}</span>
        </div>
        {prompt === undefined || prompt === '' ? null : <div className="prompt-out">{prompt}</div>}
      </div>
    </>
  );
}
