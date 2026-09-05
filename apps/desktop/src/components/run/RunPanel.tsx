import { t } from '@chickadee/i18n';

import { reasonKey, type RunView } from '../../data/runner';
import './RunPanel.css';

export interface RunnerVersions {
  jdk?: string | undefined;
  gradle?: string | undefined;
}

export interface RunPanelProps {
  view: RunView;
  /** 없으면 단추를 그리지 않는다 — 읽기 전용으로 결과만 보여 주는 자리가 있다. */
  onRun?: (() => void) | undefined;
  /** 탐지가 읽은 버전. 러너가 없는 컴퓨터에서는 넘어오지 않는다. */
  found?: RunnerVersions | undefined;
  /** 배포본을 받아도 되는지의 답. 없으면 물음을 글로만 낸다. */
  onDownload?: ((yes: boolean) => void) | undefined;
}

const seconds = (ms: number) => String(Math.max(1, Math.round(ms / 1000)));

/**
 * `.run-panel` — 4·5단 실행 결과 (D175).
 *
 * 문구는 평문이다 (정본 §6). 색을 쓰는 자리는 상태 넷뿐이고(D179) 여기서 쓰는 것은
 * 통과·오답·진행·잠김 그대로다 — 러너가 없는 상태는 실패가 아니라 **잠김**이다.
 *
 * `aria-live="polite"` 는 이 패널 하나에만 건다. 실행은 분 단위로 걸릴 수 있어서
 * 끝났다는 사실이 화면 밖에 있는 사람에게도 닿아야 한다.
 */
export function RunPanel({ view, onRun, found, onDownload }: RunPanelProps) {
  const running = view.kind === 'running';
  const ran = 'log' in view;
  return (
    <section className="run-panel" data-state={view.kind}>
      <div className="run-head">
        <b>{t('run.title')}</b>
        {onRun && (
          <button type="button" className="run-go" onClick={onRun} disabled={running}>
            {view.kind === 'idle' ? t('run.start') : t('run.again')}
          </button>
        )}
      </div>

      <div className="run-say" aria-live="polite">
        {view.kind === 'running' && (
          <>
            <p className="run-line">{t(view.first ? 'run.runningFirst' : 'run.running')}</p>
            <p className="run-hint">{t(view.first ? 'run.runningFirstHint' : 'run.runningHint')}</p>
          </>
        )}

        {view.kind === 'ask-download' && (
          <>
            <p className="run-line">{t('run.askDownload', { name: view.name })}</p>
            <p className="run-hint">{t('run.askDownloadWhy')}</p>
            {onDownload && (
              <p className="run-ask">
                <button type="button" className="run-go" onClick={() => onDownload(true)}>
                  {t('run.askYes')}
                </button>
                <button type="button" className="run-go" onClick={() => onDownload(false)}>
                  {t('run.askNo')}
                </button>
              </p>
            )}
          </>
        )}

        {view.kind === 'passed' && (
          <>
            <p className="run-line">{t('run.passed', { n: String(view.passed) })}</p>
            <p className="run-hint">{t('run.took', { sec: seconds(view.durationMs) })}</p>
          </>
        )}

        {view.kind === 'failed' && (
          <>
            <p className="run-line">{t('run.failed', { failed: String(view.failed), passed: String(view.passed) })}</p>
            <p className="run-hint">{t('run.failures')}</p>
            <ul className="run-fails">
              {view.failures.map((f) => (
                <li key={f.test}>
                  <code>{f.test}</code>
                  {f.message && <span>{f.message}</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {view.kind === 'timeout' && (
          <>
            <p className="run-line">{t('run.timeout', { sec: seconds(view.durationMs) })}</p>
            <p className="run-hint">{t('run.timeoutHint')}</p>
          </>
        )}

        {view.kind === 'error' && (
          <>
            <p className="run-line">{t('run.error')}</p>
            <p className="run-hint">{t('run.errorHint')}</p>
          </>
        )}

        {view.kind === 'no-runner' && (
          <>
            <p className="run-line">{t('run.none')}</p>
            <p className="run-hint">
              {view.reason === 'not-detected' ? t('run.askNoResult') : t(reasonKey(view.reason))}{' '}
              {t('run.noneHint')}
            </p>
          </>
        )}
      </div>

      {ran && (
        <p className="run-foot">
          {view.downloaded ? t('run.downloaded') : t('run.offline')}
        </p>
      )}

      {found && (found.jdk ?? found.gradle) !== undefined && (
        <p className="run-foot">
          {found.gradle === undefined
            ? t('run.detectedJdk', { jdk: found.jdk ?? '' })
            : t('run.detected', { jdk: found.jdk ?? '', gradle: found.gradle })}
        </p>
      )}

      {ran && view.log !== '' && (
        <details className="run-log">
          <summary>{t('run.logShow')}</summary>
          <pre aria-label={t('run.logLabel')}>{view.log}</pre>
        </details>
      )}
    </section>
  );
}
