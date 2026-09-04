import { t, type MessageKey } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';

import './ResultGroups.css';

/**
 * 결과 묶음 넷. 이름은 채점기(`packages/grading` `T2Row.tier`)가 주는 그대로다 —
 * 지도 노드 쪽 `ok` 와 낱말이 다른 이유는 여기가 「맞게 고른 파일」 묶음이고
 * 저기는 상자 하나의 판정이라서다. CSS 클래스는 목업의 `.rg.ok` 를 지킨다.
 */
export type ResultTier = 'missed' | 'found' | 'wrong' | 'sec';

export interface ResultRow {
  path: string;
  tier: ResultTier;
  /** `+64 −0` 같은 변경량. 정답지에 없는 파일이면 `null` 이고 그 자리에 「변경 없음」이 앉는다. */
  stat: string | null;
  /** 왜 이 파일이 이 묶음에 있는지. 사전에서 온 서식 글이다. */
  note: string;
}

export interface ResultGroupsProps {
  /** 채점기가 주는 그대로. 묶음 나누기와 순서는 여기서 한다. */
  rows: readonly ResultRow[];
}

/** 묶음 머리말. 기호 · 제목 · 부제 전부 목업 `resultHTML()` 그대로. 문장은 부를 때 푼다. */
const GROUPS: readonly {
  tier: ResultTier; cls: string; sym: string; title: MessageKey; sub: MessageKey | null;
}[] = [
  { tier: 'missed', cls: 'missed', sym: '＋', title: 'map.groupMissed', sub: 'map.groupMissedSub' },
  { tier: 'found', cls: 'ok', sym: '✓', title: 'map.groupFound', sub: null },
  { tier: 'wrong', cls: 'wrong', sym: '✕', title: 'map.groupWrong', sub: 'map.groupWrongSub' },
  { tier: 'sec', cls: 'sec', sym: '◆', title: 'map.groupSec', sub: 'map.groupSecSub' },
];

/**
 * `.rgroups` — 채점 결과 네 묶음 (05 §5).
 *
 * 「놓친 파일」이 맨 위다. 점수를 먼저 보여 주고 오답을 밑에 숨기면 오답을 안 읽는다 —
 * 이 판의 목적은 점수가 아니라 놓친 자리다 (정본 §3-3).
 *
 * 빈 묶음은 머리말도 내지 않는다(목업 `if (!items.length) return ''`).
 */
export function ResultGroups({ rows }: ResultGroupsProps) {
  return (
    <div className="rgroups">
      {GROUPS.map(({ tier, cls, sym, title, sub }) => {
        const items = rows.filter((r) => r.tier === tier);
        if (items.length === 0) return null;
        return (
          <div className={`rg ${cls}`} key={tier}>
            <h5>
              <span className="sym" aria-hidden="true">
                {sym}
              </span>
              {t(title)}
              {sub === null ? null : <small>{t(sub)}</small>}
            </h5>
            <ul>
              {items.map((r) => (
                <li key={r.path}>
                  <code>{r.path}</code>
                  <span className="stat">{r.stat ?? t('map.noChange')}</span>
                  <RichText as="p" html={r.note} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
