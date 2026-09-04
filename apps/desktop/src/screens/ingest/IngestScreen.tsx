import { t, type MessageKey } from '@chickadee/i18n';
import { FlatButton, LiveRegion } from '@chickadee/ui';

import { TimeQueue } from '../../components/shell/TimeQueue.js';
import { BOX_COUNT, boxes, DONE, positionOf, type Progress } from './phases.js';
import './IngestScreen.css';

/**
 * 판 짜기 = 리포 읽는 중 (05 §2.1).
 *
 * 스피너가 없다. 진행은 **시간 비례 큐** 하나로 말하고, 지금 읽는 파일 이름과
 * 건너뛴 파일의 사유만 곁들인다. 취소할 수 있고, 취소해도 읽은 부분은 남는다(03 §1.8).
 */

export interface IngestWarningRow {
  relPath: string;
  reason: string;
}

/** 경고 사유를 사람이 읽는 말로. 목록은 01 §3.1 `IngestWarning.reason` 그대로다. */
const REASON_KEY: Record<string, MessageKey> = {
  oversize: 'ingest.reasonOversize',
  'parse-poor': 'ingest.reasonParsePoor',
  timeout: 'ingest.reasonTimeout',
  binary: 'ingest.reasonBinary',
  generated: 'ingest.reasonGenerated',
  'long-line': 'ingest.reasonLongLine',
};

/** 모르는 사유는 코드를 그대로 낸다 — 빈 자리를 내지 않는다 (02 §8.1). */
function reasonText(reason: string): string {
  const key = REASON_KEY[reason];
  return key === undefined ? reason : t(key);
}

export interface IngestScreenProps {
  repoName: string;
  at: Progress | null;
  /** 지금 읽는 파일 — 리포 상대 경로다. */
  currentPath?: string | undefined;
  warnings: readonly IngestWarningRow[];
  done: boolean;
  /** 취소를 눌렀는지. 누른 뒤에는 버튼이 잠긴다. */
  cancelling?: boolean | undefined;
  onCancel: () => void;
  /** 끝났거나 실패했을 때 홈으로. 성공하면 화면이 알아서 넘어가지만, 실패하면 여기가 유일한 출구다. */
  onDone: () => void;
  error?: string | undefined;
}

export function IngestScreen(props: IngestScreenProps) {
  const { pos, progress } = props.done ? DONE : positionOf(props.at);
  const items = boxes();
  const box = items[Math.min(pos, BOX_COUNT - 1)];
  const heading = props.done ? t('ingest.done') : t('ingest.reading', { repo: props.repoName });

  return (
    <main className="ingest" tabIndex={-1}>
      <h1 className="ingest-h">{heading}</h1>
      <p className="ingest-sub">
        {props.error
          ? props.error
          : props.done
            ? t('ingest.doneNote')
            : t('ingest.readOnly')}
      </p>

      <TimeQueue items={items} pos={pos} progress={progress} labels />

      <p className="ingest-now">
        {props.done ? '' : box?.sub}
        {props.currentPath ? <code className="ingest-path">{props.currentPath}</code> : null}
      </p>

      {props.warnings.length > 0 ? (
        <section className="ingest-skips" aria-labelledby="skips-h">
          <h2 id="skips-h">{t('ingest.skips', { n: String(props.warnings.length) })}</h2>
          <ul>
            {props.warnings.slice(0, 5).map((w) => (
              <li key={`${w.relPath}-${w.reason}`}>
                <code>{w.relPath || t('ingest.fileCap')}</code>
                <span>{t('ingest.skipped', { reason: reasonText(w.reason) })}</span>
              </li>
            ))}
          </ul>
          {props.warnings.length > 5 ? (
            <p className="ingest-more">{t('ingest.more', { n: String(props.warnings.length - 5) })}</p>
          ) : null}
        </section>
      ) : null}

      {props.done ? (
        <FlatButton onClick={props.onDone}>{t('home.back')}</FlatButton>
      ) : (
        <FlatButton onClick={props.onCancel} disabled={props.cancelling} ghost>
          {props.cancelling ? t('ingest.cancelling') : t('ingest.cancel')}
        </FlatButton>
      )}

      {/* 진행은 그림이 아니라 문장으로도 나가야 한다 (05 §9). */}
      <LiveRegion
        text={props.done ? t('ingest.saidDone') : t('ingest.saidStep', { label: box?.label ?? '' })}
      />
    </main>
  );
}
