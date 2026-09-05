/**
 * 막힘 패널 — 단마다 처방이 다르다 (`mastery.md` §5 · D171 ⑦).
 *
 * 2단 **옆으로**(경로 접기) · 3단 **뒤로**(그 줄의 개념 판을 큐 앞에) · 4·5단 **밖으로**
 * (프롬프트를 만들어 사람이 들고 나간다) · 세 번째는 단과 무관하게 **오늘은 접는다**.
 * 클래스 `reprint` 를 다는 이유: `SessionOverlay` 의 Esc ② 가 그 클래스로 「사다리 안」을
 * 판정한다 — 포커스가 여기 있으면 Esc 한 번에 패널만 닫힌다.
 */
import { t } from '@chickadee/i18n';
import { FlatButton, PressButton, RichText } from '@chickadee/ui';
import { useEffect, useRef } from 'react';

export type StuckView =
  | { kind: 'fold' }
  | { kind: 'concept-front'; conceptId: string; name: string; line: string | null; queued: boolean }
  | { kind: 'prompt'; prompt: string; copied: boolean }
  | { kind: 'defer' };

export interface StuckPanelProps {
  view: StuckView;
  onQueueConcept: () => void;
  onCopyPrompt: () => void;
  onClose: () => void;
  /** 접힌 뒤 「닫기」 — 오버레이를 나간다. */
  onLeave: () => void;
}

export function StuckPanel(props: StuckPanelProps): React.JSX.Element {
  const { view } = props;
  const ref = useRef<HTMLElement | null>(null);

  // 열리면 패널로 포커스 — 그래야 Esc 가 이 겹을 벗긴다 (05 §2.3 ②).
  useEffect(() => {
    ref.current?.focus();
  }, [view.kind]);

  return (
    <aside ref={ref} className="reprint cc-stuck" tabIndex={-1} aria-label={t('chapter.stuckTitle')}>
      <h3>{t('chapter.stuckTitle')}</h3>
      {view.kind === 'fold' ? <p className="note">{t('chapter.stuckFold')}</p> : null}
      {view.kind === 'concept-front' ? (
        <>
          <p className="note"><RichText html={t('chapter.stuckConcept', { name: view.name })} /></p>
          {view.line === null ? null : <p className="note cc-oneliner"><RichText html={view.line} /></p>}
          <FlatButton onClick={props.onQueueConcept} on={view.queued}>
            {t('chapter.stuckConceptFront')}
          </FlatButton>
        </>
      ) : null}
      {view.kind === 'prompt' ? (
        <>
          <p className="note">{t('chapter.stuckPrompt')}</p>
          <textarea className="cc-prompt" readOnly rows={8} value={view.prompt} aria-label={t('chapter.handoffBuild')} />
          <FlatButton onClick={props.onCopyPrompt} on={view.copied}>{t('chapter.handoffCopy')}</FlatButton>
        </>
      ) : null}
      {view.kind === 'defer' ? (
        <>
          <p className="note">{t('chapter.stuckDefer')}</p>
          <PressButton tone="blue" onClick={props.onLeave}>{t('chapter.doneToc')}</PressButton>
        </>
      ) : null}
      {view.kind === 'defer' ? null : (
        <FlatButton ghost onClick={props.onClose}>{t('chapter.stuckClose')}</FlatButton>
      )}
    </aside>
  );
}
