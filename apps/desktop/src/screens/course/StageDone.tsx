/**
 * 단 판정 카드 — 단의 마지막 판을 마치면 이것이 판 자리에 놓인다 (D171 ④).
 *
 * 말하는 것 넷: 몇 문항 중 몇 맞음 · 통과/아직 · 챕터가 방금 통과했으면 다음 챕터가 열렸다는
 * 것 · 재검이면 등급과 다음 재검. 진도가 내려가는 유일한 자리(재검 Again)도 여기서 평문으로.
 */
import type { Advance, RecheckGrade } from '@chickadee/concepts';
import { t } from '@chickadee/i18n';
import type { StageNo } from '@chickadee/store-sql';
import { FlatButton, PressButton } from '@chickadee/ui';
import { useEffect, useRef } from 'react';

import { stageKey } from './run.js';

export interface StageDoneProps {
  stage: StageNo;
  kind: 'first' | 'recheck';
  asked: number;
  correct: number;
  advance: Advance;
  grade: RecheckGrade | null;
  /** 다음 재검 날짜 문구. 재검이 아니면 `null`. */
  nextDue: string | null;
  /** 다음 단을 바로 열 수 있나 — 통과했고 다음 단에 판이 있다. */
  canNext: boolean;
  onNext: () => void;
  onToc: () => void;
}

const GRADE_KEY = { 1: 'chapter.gradeAgain', 2: 'chapter.gradeHard', 3: 'chapter.gradeGood' } as const;

export function StageDone(props: StageDoneProps): React.JSX.Element {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <article ref={ref} className="ps cc-done" tabIndex={-1} aria-label={t('chapter.doneTitle', { stage: t(stageKey(props.stage)) })}>
      <h2>{t('chapter.doneTitle', { stage: t(stageKey(props.stage)) })}</h2>
      <p className="cc-tally">
        <b>{t('chapter.doneTally', { asked: String(props.asked), correct: String(props.correct) })}</b>
        {' · '}
        <span className={props.advance.passed ? 'pass' : 'fail'}>
          {props.advance.passed ? t('chapter.donePass') : t('chapter.doneFail')}
        </span>
      </p>
      {props.kind === 'recheck' && props.grade !== null ? (
        <p className="note">{t(GRADE_KEY[props.grade])}{props.nextDue === null ? '' : ` ${t('chapter.nextRecheck', { date: props.nextDue })}`}</p>
      ) : null}
      {props.advance.justPassed ? <p className="note cc-justpassed">{t('chapter.doneJustPassed')}</p> : null}
      {props.kind === 'first' && props.advance.passed && !props.canNext && props.stage < 5 ? (
        <p className="note">{t('chapter.noCards')}</p>
      ) : null}
      <div className="cc-done-acts">
        <FlatButton ghost onClick={props.onToc}>{t('chapter.doneToc')}</FlatButton>
        {props.canNext ? (
          <PressButton tone="blue" onClick={props.onNext}>{t('chapter.doneNext')}</PressButton>
        ) : null}
      </div>
    </article>
  );
}
