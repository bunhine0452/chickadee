/**
 * 5단 재구현 — `reimpl-spec`(시그니처와 지킬 것만) · `reimpl-layer`(이웃 층이 사양) · `handoff`
 * (채점 없음, 프롬프트를 들고 나간다). 편집기는 T1 의 것(`ClonePad`, Monaco 지연 로드)이다 —
 * 시험 환경(jsdom)에서는 textarea 판으로 물러선다.
 *
 * **판정은 테스트 통과다** (D180) — 원본과 줄을 견주지 않는다. 러너가 있고 판정용 테스트가
 * 뽑혔으면 5단이 통과 게이트에 들고(정본 §2), 없으면 재구현을 해 보는 자리로 남는다.
 * 원문은 채점 뒤 접힌 채로 펼쳐 볼 수 있다 — 정답지가 아니라 견주어 볼 참고 자료다.
 */
import { needsRun, type StageAnswer, type StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import { ipc } from '@chickadee/ipc-client';
import type { InkLayer } from '@chickadee/ui';
import { FlatButton, Kbd, PressButton, RichText } from '@chickadee/ui';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { MONACO_LANGUAGES } from '../../components/t1/monacoOptions.js';
import { Ask } from '../../components/plate/Ask.js';
import { useUi } from '../../store.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import { RunStrip } from './RunStrip.js';
import type { RunPhase, StageCardView } from './run.js';

const ClonePad = lazy(async () => {
  const mod = await import('../../components/t1/ClonePad.js');
  return { default: mod.ClonePad };
});

/** 이 환경에 Monaco 를 내릴 수 없으면 textarea 판이다 (05 §8 마지막 문단). */
const FALLBACK = typeof window === 'undefined' || typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined';

const noop = (): void => undefined;

/** 경로 확장자 → Monaco 언어 id. `ClonePad` 가 싣는 일곱 밖이면 typescript 로 그린다. */
function grammarOf(file: string, grammar: string): string {
  void file;
  return (MONACO_LANGUAGES as readonly string[]).includes(grammar) ? grammar : 'typescript';
}

export interface ReimplPlateProps {
  card: StageCardView;
  no: number;
  unitName: string;
  conceptName: string;
  layer: InkLayer;
  verdict: StageVerdict | null;
  stuckOpen: boolean;
  theme: 'light' | 'dark';
  onGrade: (answer: StageAnswer) => void;
  onNext: () => void;
  onDunno: () => void;
  /** 실행 상태 (D180). 5단의 판정이 여기서 온다. */
  phase: RunPhase;
  after?: React.ReactNode;
}

export function ReimplPlate(props: ReimplPlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const reimpl = p.track === 't3' && p.kind === 'reimpl' ? p : null;
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reimpl === null) return;
    setDraft(reimpl.signature.join('\n'));
    setCopied(false);
  }, [card.id, reimpl]);

  const answered = verdict !== null;
  const isHandoff = reimpl?.type === 'handoff';
  const lines = draft.split('\n');

  const grade = useCallback(() => {
    if (reimpl === null || answered) return;
    if (reimpl.type === 'handoff') {
      props.onGrade({ kind: 'handoff', lines });
      return;
    }
    props.onGrade({ kind: 'lines', lines });
  }, [reimpl, answered, lines, props]);

  usePlateKeys({
    answered, canSubmit: draft.trim() !== '',
    onSubmit: grade, onGrade: grade, onNext: props.onNext, onDunno: props.onDunno,
  });

  const copy = useCallback(() => {
    if (verdict === null || verdict.detail.kind !== 'handoff') return;
    void ipc.clip.write(verdict.detail.prompt)
      .then(() => {
        setCopied(true);
        useUi.getState().say(t('chapter.handoffCopied'));
      })
      .catch(() => useUi.getState().say(t('session.copyFailed')));
  }, [verdict]);

  if (reimpl === null) return null;

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(reimpl.file, reimpl.from)}
      hint={answered ? t('session.hintNextPlate') : isHandoff ? t('chapter.hintHandoff') : t('chapter.hintEdit')}
      stuckOpen={props.stuckOpen}
      onDunno={props.onDunno}
      {...(props.after === undefined ? {} : { after: props.after })}
      right={answered ? (
        <PressButton tone="blue" onClick={props.onNext}>
          {t('session.next')} <Kbd keys="Space" />
        </PressButton>
      ) : (
        <PressButton tone="pink" disabled={draft.trim() === ''} onClick={grade}>
          {isHandoff ? t('chapter.handoffBuild') : t('chapter.grade')} <Kbd keys="⌘↵" />
        </PressButton>
      )}
    >
      <Ask q={reimpl.question} hint={t('chapter.reimplSig')} />
      {answered && !isHandoff ? <RunStrip phase={props.phase} needsRun={needsRun(p)} /> : null}
      <dl className="cc-spec">
        <dt>{t('chapter.reimplSig')}</dt>
        <dd><pre><code>{reimpl.signature.join('\n')}</code></pre></dd>
        {reimpl.mustHold.length === 0 ? null : (
          <>
            <dt>{t('chapter.reimplHold')}</dt>
            <dd>
              <ul>
                {reimpl.mustHold.map((h, i) => <li key={i}><RichText html={h.text} /></li>)}
              </ul>
            </dd>
          </>
        )}
        {reimpl.context.map((c) => (
          <details key={c.file} className="cc-files">
            <summary>{t('chapter.reimplContext', { file: c.file.slice(c.file.lastIndexOf('/') + 1) })}</summary>
            <pre><code>{c.lines.join('\n')}</code></pre>
          </details>
        ))}
      </dl>

      {answered ? (
        <>
          <pre className="cc-editor cc-mine"><code>{draft}</code></pre>
          {isHandoff ? null : (
            <details className="cc-files">
              <summary>{t('chapter.execOrigin')}</summary>
              <pre><code>{reimpl.original.join('\n')}</code></pre>
            </details>
          )}
        </>
      ) : (
        <Suspense fallback={<div className="editor" aria-busy="true" />}>
          <ClonePad
            fallback={FALLBACK}
            value={draft}
            stage={3}
            grammar={grammarOf(reimpl.file, reimpl.grammar)}
            theme={props.theme}
            ticks={{}}
            onChange={setDraft}
            onLeaveLine={noop}
            onPeek={noop}
            onGrade={grade}
            onDown={noop}
            editorAssist="off"
            ariaLabel={t('chapter.reimplEditor')}
            focusOnMount
          />
        </Suspense>
      )}

      {answered && verdict.detail.kind === 'handoff' ? (
        <div className="cc-handoff">
          <textarea className="cc-prompt" readOnly rows={8} value={verdict.detail.prompt} aria-label={t('chapter.handoffBuild')} />
          <FlatButton onClick={copy} on={copied}>{t('chapter.handoffCopy')}</FlatButton>
        </div>
      ) : null}
    </PlateFrame>
  );
}
