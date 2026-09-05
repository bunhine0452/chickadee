import { useEffect, useState } from 'react';
import { t } from '@chickadee/i18n';
import { cx, RichText } from '@chickadee/ui';
import type { InkLayer } from '@chickadee/ui';

import { CodePlate } from './CodePlate';
import { LiferNote, type LiferNoteProps } from './LiferNote';
import './FeedbackSlot.css';

/**
 * 판정란이 미리 잡아 두는 높이(px).
 *
 * **정본 §3-3 의 게이트다** — 답해도 위 글이 0px 도 밀리지 않아야 한다. 이 값은 CSS
 * `.slot { min-height }` 에 있고, 그 선언이 살아 있는지는 `FeedbackSlot.test.tsx` 가 지킨다.
 */
export const FEEDBACK_SLOT_MIN_HEIGHT_PX = 118;

/** 비어 있는 판정란에 적히는 안내. 「왜 비어 있나」를 그 자리에서 답한다. */
export const idleNoteText = (): string => t('plate.idleNote');

export type FeedbackState = 'idle' | 'right' | 'wrong';

export interface FeedbackGain {
  from: InkLayer;
  to: InkLayer;
  /** 「숙련도 <b>3단계</b> · 다음 복습 <b>11일 뒤</b>」. 서식 글이다. */
  text: string;
}

export interface FeedbackSlotProps {
  state: FeedbackState;
  /** 판정 제목 — 「맞았습니다」 / 「틀렸습니다 — <code>…</code> 를 골랐습니다」. */
  title?: string | undefined;
  /** 진단 본문. 「틀렸다」가 아니라 「고른 그것이 참이 되는 조건」이다 (정본 §3-2). */
  body?: string | undefined;
  /** 가장 날카로운 자리 — 실제로 터지는 최소 코드. */
  edge?: { h: string; code: readonly string[] } | undefined;
  /** 「규칙 — …」 한 줄. */
  rule?: string | undefined;
  /** 「이 줄이 끝난 뒤」의 값. */
  result?: { label: string; value: string; note: string } | undefined;
  /** 아래층에서 올라올 때 이어 붙는 다리 문장. */
  bridge?: string | undefined;
  gain?: FeedbackGain | undefined;
  /** 이 개념을 처음 기록한 문제면 그 기록이 여기 남는다 (정본 §3-6 · D131). */
  lifer?: LiferNoteProps | undefined;
  /** 비어 있을 때의 안내를 갈아 끼운다. */
  idleNote?: string | undefined;
}

/**
 * `.slot` / `.slot-idle` / `.fb` — 판정란 (정본 §3-2·§3-3 · D182).
 *
 * **도장을 버렸다.** 전에는 판정이 143px 짜리 회전한 리소 도장이었고, 그것이 판정란에서
 * 가장 큰 요소였다 — 학습자가 배우는 것은 도장이 아니라 **왜 그런가**인데.
 *
 * 지금 순서가 곧 값의 순서다: ① 맞았나 틀렸나(한 낱말 + 왼쪽 선 하나) → ② **왜 그런가**
 * (가장 크고 진한 본문) → ③ 실제로 터지는 최소 코드 → ④ 규칙 → ⑤ 숙련도. 오답이면 ②가
 * 「틀렸다」가 아니라 **「당신이 고른 그것이 참이 되는 조건」**이라 그 문장이 가장 잘 읽혀야
 * 한다 (정본 §3-2) — `.fb-why` 가 화면에서 이 판의 두 번째로 큰 글이다.
 *
 * **자리를 미리 비워 둔다.** 빈 안내와 판정이 같은 격자 칸(`grid-area: 1 / 1`)에 겹쳐 놓이고
 * `.slot` 이 `min-height` 로 높이를 잡고 있어, 답해도 위쪽 글이 0px 도 밀리지 않는다.
 */
export function FeedbackSlot({
  state,
  title,
  body,
  edge,
  rule,
  result,
  bridge,
  gain,
  lifer,
  idleNote,
}: FeedbackSlotProps) {
  const answered = state !== 'idle';
  const [on, setOn] = useState(false);

  // 마운트 다음 프레임에 `.on` 을 켜야 전환이 재생된다.
  // 감축 모드에서는 CSS 가 전환 시간을 지우고 최종 포즈만 남긴다 (05 §6).
  useEffect(() => {
    if (!answered) {
      setOn(false);
      return;
    }
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [answered, title, body]);

  return (
    <div className="slot">
      <div className="slot-idle" hidden={answered}>
        {idleNote ?? idleNoteText()}
      </div>
      {/*
        `aria-live` 를 들지 않는다 (D114). 이 칸을 통째로 읽으면 나가는 것이 규칙·코드판까지
        포함한 판정란 전문이라 05 §7 의 「[상태]. [수치]. [다음 행동]」 60자 규약을 넘는다.
        판정은 `SessionOverlay` 의 `.vh#live` 가 한 줄로 읽는다.
      */}
      <div className={cx('fb', state === 'right' ? 'right' : answered && 'wrong', on && 'on')}>
        {!answered ? null : (
          <>
            <p className="fb-head">
              <span className="fb-tag">{state === 'right' ? t('plate.tagRight') : t('plate.tagWrong')}</span>
              {title === undefined ? null : <RichText html={title} />}
            </p>

            {/* 정본 §3-2 — 오답에서 이 문단이 「당신이 고른 그것이 참이 되는 조건」이다. */}
            {body === undefined ? null : <RichText as="p" className="fb-why" html={body} />}

            {edge === undefined ? null : (
              <div className="edge">
                <b><RichText html={edge.h} /></b>
                <CodePlate lines={edge.code.map((line, i) => ({ n: i + 1, t: line }))} />
              </div>
            )}

            {rule === undefined ? null : (
              <p className="fb-rule">
                <b>{t('plate.rule')}</b> — <RichText html={rule} />
              </p>
            )}

            {result === undefined ? null : (
              <p className="fb-rule">
                <b>{t('plate.afterLine')}</b> · <code><RichText html={result.label} /></code>
                {' = '}
                <code><RichText html={result.value} /></code> — <RichText html={result.note} />
              </p>
            )}

            {bridge === undefined ? null : (
              <div className="edge">
                <RichText html={bridge} />
              </div>
            )}

            {/* 숙련도가 오른 것은 숫자와 말로만 말한다 — 막대도 마스코트도 두지 않는다 (D182). */}
            {gain === undefined ? null : (
              <p className="gain">
                <span className="gain-step">
                  {t('plate.layerN', { n: String(gain.from) })}
                  <span className="arr" aria-hidden="true">→</span>
                  {t('plate.layerN', { n: String(gain.to) })}
                </span>
                <RichText html={gain.text} />
              </p>
            )}

            {lifer === undefined ? null : <LiferNote {...lifer} />}
          </>
        )}
      </div>
    </div>
  );
}
