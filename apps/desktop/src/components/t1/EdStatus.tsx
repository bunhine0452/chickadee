import { t } from '@chickadee/i18n';
import { Kbd } from '@chickadee/ui';

import './EdStatus.css';

export interface EdStatusProps {
  /** 비어 있지 않은 줄 수. 세는 것은 부모(에디터)의 몫이다. */
  lines: number;
  /** 마지막 저장 시각(epoch ms). 아직 저장 전이면 `null` → 「자동 저장」. */
  savedAt: number | null;
  /** 원본 본 횟수. 감점이 아니라 이 판을 더 자주 보여줄 신호다 (정본 §3-1). */
  peeks: number;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** `HH:MM`. 받은 값만 조판한다 — 지금 몇 시인지는 묻지 않는다 (표현 컴포넌트). */
export function hhmm(at: number): string {
  const d = new Date(at);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * `.ed-status` — 에디터 아래 범례와 안내 (05 §5).
 *
 * 판정 틱 3색은 **글자를 같이 적는다**(05 §9 색맹) — 색면 `<i>` 는 `aria-hidden` 이고
 * 「정합 · 동등 · 어긋남」이라는 낱말이 정보를 나른다. 색을 못 보는 눈에도 거터의 틱이
 * 무엇인지는 이 줄이 말해 준다.
 */
export function EdStatus({ lines, savedAt, peeks }: EdStatusProps) {
  return (
    <div className="ed-status">
      <span className="legend">
        <i className="e" aria-hidden="true" />
        {t('session.exact')}{' '}
        <i className="q" aria-hidden="true" />
        {t('session.equiv')}{' '}
        <i className="d" aria-hidden="true" />
        {t('session.differ')}
      </span>
      <span>
        {t('clone.lines', { n: String(lines) })} ·{' '}
        {savedAt === null ? t('clone.autoSave') : t('clone.savedAt', { time: hhmm(savedAt) })}
      </span>
      <span>
        <Kbd keys="Tab" /> {t('clone.indent')}
      </span>
      <span>
        <Kbd keys="`" /> {t('clone.peekHold')}
      </span>
      <span>
        <Kbd keys="⌘↵" /> {t('clone.grade')}
      </span>
      <span>
        {t('clone.peekCount')} <b>{peeks}</b>
      </span>
    </div>
  );
}
