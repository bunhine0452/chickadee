import { useEffect, useState } from 'react';
import { t } from '@chickadee/i18n';
import { cx, Dee, RichText, Stamp } from '@chickadee/ui';
import type { InkLayer, StampTone } from '@chickadee/ui';

import { CodePlate } from './CodePlate';
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

export interface FeedbackStamp {
  text: string;
  sub?: string | undefined;
  tone?: StampTone | undefined;
  rotate?: number | undefined;
}

export interface FeedbackGain {
  from: InkLayer;
  to: InkLayer;
  /** 「잉크 <b>3겹</b> · 다음 인쇄 <b>11일 뒤</b>」. 서식 글이다. */
  text: string;
}

export interface FeedbackSlotProps {
  state: FeedbackState;
  stamp?: FeedbackStamp | undefined;
  /** 판정 제목 — 「맞았습니다」 / 「어긋났습니다 — <code>…</code> 를 골랐습니다」. */
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
  /** 비어 있을 때의 안내를 갈아 끼운다. */
  idleNote?: string | undefined;
}

/**
 * `.slot` / `.slot-idle` / `.fb` — 판정란 (05 §5 · 정본 §3-3).
 *
 * **자리를 미리 비워 둔다.** 빈 안내와 판정이 같은 격자 칸(`grid-area: 1 / 1`)에 겹쳐 놓이고
 * `.slot` 이 `min-height` 로 높이를 잡고 있어, 답해도 위쪽 글이 0px 도 밀리지 않는다.
 * 빈 안내는 지우지 않고 `hidden` 으로만 덮는다 — 지우면 격자 칸이 무너진다.
 */
export function FeedbackSlot({
  state,
  stamp,
  title,
  body,
  edge,
  rule,
  result,
  bridge,
  gain,
  idleNote,
}: FeedbackSlotProps) {
  const answered = state !== 'idle';
  const [on, setOn] = useState(false);

  // 마운트 다음 프레임에 `.on` 을 켜야 전환이 재생된다 (목업의 requestAnimationFrame).
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
        `aria-live` 를 들지 않는다 (D114). 이 칸을 통째로 읽으면 나가는 것이 도장·규칙·코드판까지
        포함한 판정란 전문이라 05 §7 의 「[상태]. [수치]. [다음 행동]」 60자 규약을 넘는다.
        판정은 `SessionOverlay` 의 `.vh#live` 가 한 줄로 읽는다.
      */}
      <div className={cx('fb', state === 'right' && 'right', on && 'on')}>
        {!answered ? null : (
          <>
            <div className="stampbox">
              {stamp === undefined ? null : (
                <Stamp text={stamp.text} sub={stamp.sub} tone={stamp.tone} rotate={stamp.rotate} hit />
              )}
            </div>
            <div>
              {title === undefined ? null : (
                <h4>
                  <RichText html={title} />
                </h4>
              )}
              {body === undefined ? null : <RichText as="p" html={body} />}
              {edge === undefined ? null : (
                <div className="edge">
                  <b>{edge.h}</b>
                  <CodePlate lines={edge.code.map((t, i) => ({ n: i + 1, t }))} />
                </div>
              )}
              {rule === undefined ? null : (
                <p>
                  <b>{t('plate.rule')}</b> — <RichText html={rule} />
                </p>
              )}
              {result === undefined ? null : (
                <p>
                  <b>{t('plate.afterLine')}</b> · <code>{result.label}</code> = <code>{result.value}</code> — {result.note}
                </p>
              )}
              {bridge === undefined ? null : (
                <div className="edge">
                  <RichText html={bridge} />
                </div>
              )}
              {gain === undefined ? null : (
                <div className="gain">
                  <Dee ly={gain.from} sticker />
                  <span className="arr">→</span>
                  <Dee ly={gain.to} sticker />
                  <RichText html={gain.text} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
