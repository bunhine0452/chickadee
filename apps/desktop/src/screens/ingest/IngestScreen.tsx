import { FlatButton, LiveRegion } from '@chickadee/ui';

import { TimeQueue } from '../../components/shell/TimeQueue.js';
import { BOXES, DONE, positionOf, type Progress } from './phases.js';
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
const REASON: Record<string, string> = {
  oversize: '너무 커서',
  'parse-poor': '문법으로 읽히지 않아',
  timeout: '너무 오래 걸려',
  binary: '텍스트가 아니라',
  generated: '사람이 쓴 코드가 아니라',
  'long-line': '한 줄이 너무 길어',
};

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
  error?: string | undefined;
}

export function IngestScreen(props: IngestScreenProps) {
  const { pos, progress } = props.done ? DONE : positionOf(props.at);
  const box = BOXES[Math.min(pos, BOXES.length - 1)];
  const heading = props.done ? '다 읽었습니다' : `${props.repoName} 을 읽는 중`;

  return (
    <main className="ingest" tabIndex={-1}>
      <h1 className="ingest-h">{heading}</h1>
      <p className="ingest-sub">
        {props.error
          ? props.error
          : props.done
            ? '이제 홈에서 무엇이 있고 무엇이 없는지 볼 수 있습니다.'
            : '리포에는 아무것도 쓰지 않습니다. 읽기만 합니다.'}
      </p>

      <TimeQueue items={BOXES} pos={pos} progress={progress} labels />

      <p className="ingest-now">
        {props.done ? '' : box?.sub}
        {props.currentPath ? <code className="ingest-path">{props.currentPath}</code> : null}
      </p>

      {props.warnings.length > 0 ? (
        <section className="ingest-skips" aria-labelledby="skips-h">
          <h2 id="skips-h">건너뛴 파일 {props.warnings.length}개</h2>
          <ul>
            {props.warnings.slice(0, 5).map((w) => (
              <li key={`${w.relPath}-${w.reason}`}>
                <code>{w.relPath || '(파일 수 상한)'}</code>
                <span>{REASON[w.reason] ?? w.reason} 건너뜀</span>
              </li>
            ))}
          </ul>
          {props.warnings.length > 5 ? <p className="ingest-more">그 밖 {props.warnings.length - 5}개</p> : null}
        </section>
      ) : null}

      {props.done ? null : (
        <FlatButton onClick={props.onCancel} disabled={props.cancelling} ghost>
          {props.cancelling ? '멈추는 중…' : '그만 읽기'}
        </FlatButton>
      )}

      {/* 진행은 그림이 아니라 문장으로도 나가야 한다 (05 §9). */}
      <LiveRegion text={props.done ? '다 읽었습니다.' : `${box?.label ?? ''} 단계입니다.`} />
    </main>
  );
}
