/**
 * 코스 목차 — 대지 → 파일 → 조각 (D120 · `clone-screen-toc`).
 *
 * **읽는 것만 한다.** 조각을 눌러 건너뛰는 문을 두지 않는 이유: 코스의 값은 순서에 있고
 * (`courseOrder` 가 정한 차례로 읽는 것이 코스다), 끝난 조각으로 되돌아가면 그 조각을
 * 다시 채점해 원장에 두 번 남길지를 화면이 정해야 한다. 그 결정은 여기 없다.
 *
 * 조각은 **지연 생성**이라 아직 안 연 파일에는 조각이 없다. 그 자리를 「0/0」으로 비워
 * 두면 조각이 없는 파일처럼 보이므로 「열면 조각으로 나뉩니다」라고 적는다.
 */
import { t } from '@chickadee/i18n';
import { cx } from '@chickadee/ui';
import { useEffect, useRef } from 'react';

import type { TocPart, TocUnit } from './data.js';
import './CourseToc.css';

/** 좁은 목차에서는 파일 이름이 먼저다 — `src/ses…` 둘은 구별이 안 됐다 (D170 ⑧). */
const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1);
const dirName = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

const STATUS_KEY = {
  pending: 'course.statusPending',
  active: 'course.statusActive',
  skipped: 'course.statusSkipped',
  stale: 'course.statusStale',
} as const;

/** 조각 한 줄의 상태 낱말. 끝난 조각만 점수를 같이 적는다. */
function statusText(part: TocPart): string {
  if (part.status === 'done') {
    return t('course.statusDone', { pct: String(Math.round(part.pct ?? 0)) });
  }
  return t(STATUS_KEY[part.status as keyof typeof STATUS_KEY] ?? 'course.statusPending');
}

export interface CourseTocProps {
  units: readonly TocUnit[];
  /** 목차의 파일 수와 조각이 다 끝난 파일 수. 진행 막대의 분모·분자다. */
  files: number;
  filesDone: number;
  /** 지금까지 잘린 조각과 그중 끝난 것. 지연 생성이라 분모가 자란다. */
  cut: number;
  cutDone: number;
  /** 지금 치고 있는 조각의 `clone_step.id`. 없으면 `null`. */
  curId: number | null;
  curSeq: number | null;
}

export function CourseToc(props: CourseTocProps) {
  const cur = useRef<HTMLLIElement | null>(null);

  // 목차가 길면(2,000 파일) 지금 자리가 화면 밖이다. 파일이 바뀔 때만 옮긴다 —
  // 매 렌더마다 부르면 사용자가 목차를 훑는 동안 스크롤을 빼앗는다.
  useEffect(() => {
    // `scrollIntoView` 는 jsdom 에 없다. 있는 곳에서만 부른다 — 목차가 안 따라오는 것은
    // 화면이 죽는 것보다 훨씬 작은 손실이다.
    cur.current?.scrollIntoView?.({ block: 'nearest' });
  }, [props.curSeq]);

  const pct = props.files === 0 ? 0 : Math.round((props.filesDone / props.files) * 100);

  return (
    <aside className="ctoc" aria-label={t('course.tocLabel')}>
      <div className="ctoc-head">
        <b className="ctoc-count">
          {t('course.tocCount', { done: String(props.filesDone), total: String(props.files) })}
        </b>
        <div
          className="ctoc-bar"
          role="img"
          aria-label={t('course.tocPct', { n: String(pct) })}
          // 찬 자리의 끝을 선으로 끊는다 (D127). 0·100 에서는 끊을 자리가 없다 —
          // 0 에서 선이 남으면 「조금 찼다」로, 100 에서는 테두리가 두 겹으로 읽힌다.
          data-fill={pct === 0 ? 'empty' : pct === 100 ? 'full' : 'part'}
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
        >
          <i aria-hidden="true" />
        </div>
        <small className="ctoc-cut">
          {t('course.tocCut', { done: String(props.cutDone), total: String(props.cut) })}
        </small>
      </div>

      <ol className="ctoc-units">
        {props.units.map((unit, i) => (
          <li key={`${String(unit.unitId)}-${String(i)}`} className="ctoc-unit">
            <h3>{unit.name === '' ? t('course.noUnit') : unit.name}</h3>
            <ol className="ctoc-files">
              {unit.files.map((file) => {
                const here = file.seq === props.curSeq;
                return (
                  <li
                    key={file.seq}
                    className={cx('ctoc-file', here && 'cur')}
                    ref={here ? cur : null}
                  >
                    <div className="ctoc-file-top">
                      <span className="ctoc-no">
                        {t('course.fileAt', { n: String(file.seq + 1) })}
                      </span>
                      <code className="ctoc-path" title={file.path}>
                        {baseName(file.path)}
                        {dirName(file.path) === '' ? null : (
                          <span className="ctoc-dir"> · {dirName(file.path)}</span>
                        )}
                      </code>
                      <span className="ctoc-tally">
                        {file.total === 0
                          ? t('course.fileUncut')
                          : t('course.fileCount', {
                            done: String(file.done), total: String(file.total),
                          })}
                      </span>
                    </div>
                    {file.parts.length === 0 ? null : (
                      <ol className="ctoc-parts">
                        {file.parts.map((part) => (
                          <li
                            key={part.id}
                            className="ctoc-part"
                            data-status={part.status}
                            {...(part.id === props.curId ? { 'aria-current': 'step' as const } : {})}
                          >
                            <b>{t('course.part', { n: String(part.part + 1) })}</b>
                            <small>
                              {t('course.partLines', {
                                from: String(part.lineStart), to: String(part.lineEnd),
                              })}
                            </small>
                            <span className="ctoc-st">{statusText(part)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </aside>
  );
}
