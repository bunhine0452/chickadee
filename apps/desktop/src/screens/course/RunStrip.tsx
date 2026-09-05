/**
 * 4·5단의 실행 상태 한 줄 (D180 ⑤).
 *
 * 상태는 넷이다 — **실행 중 · 통과 · 실패 · 러너 없음**. 실패는 첫 실패의 테스트 이름과
 * 메시지를 그대로 싣는다(러너 출력이라 번역하지 않는다). 러너가 없거나 판정할 테스트가
 * 없으면 **그 사실을 말한다** — 정본 §2 의 「그때 그 사실을 화면이 말한다」가 이 줄이다.
 */
import { t } from '@chickadee/i18n';
import type { StageRun } from '@chickadee/grading';

import type { RunPhase } from './run.js';

/** 화면에 싣는 실패 수 상한. 나머지는 세어서 알린다. */
const MAX_SHOWN = 3;

function headline(run: StageRun): string {
  switch (run.status) {
    case 'passed': return t('chapter.execPassed', { n: String(run.passed) });
    case 'failed': return t('chapter.execFailed', { failed: String(run.failed), passed: String(run.passed) });
    case 'timeout': return t('chapter.execTimeout');
    case 'no-runner': return t('chapter.execNoRunner');
    default: return t('chapter.execError');
  }
}

export function RunStrip(props: { phase: RunPhase; needsRun: boolean }): React.JSX.Element | null {
  const { phase } = props;
  if (phase.kind === 'off') {
    if (props.needsRun) return null;
    return (
      <p className="note cc-exec" aria-live="polite">
        <b>{t('chapter.execTitle')}</b> {t('chapter.execNoTests')}
      </p>
    );
  }
  if (phase.kind === 'running') {
    return (
      <p className="note cc-exec" aria-live="polite" aria-busy="true">
        <b>{t('chapter.execTitle')}</b> {t('chapter.execRunning')}
      </p>
    );
  }
  const shown = phase.run.failures.slice(0, MAX_SHOWN);
  const rest = phase.run.failures.length - shown.length;
  return (
    <div className="note cc-exec" aria-live="polite">
      <p><b>{t('chapter.execTitle')}</b> {headline(phase.run)}</p>
      {shown.length === 0 ? null : (
        <ul>
          {shown.map((f) => <li key={f.test}><code>{f.test}</code> — {f.message}</li>)}
          {rest > 0 ? <li>{t('chapter.execMore', { n: String(rest) })}</li> : null}
        </ul>
      )}
    </div>
  );
}
