import { t } from '@chickadee/i18n';
import { cx, Passes, Pill, PressButton, RichText } from '@chickadee/ui';
import type { InkLayer } from '@chickadee/ui';

import './PrereqRung.css';

/**
 * 아래층 한 칸의 상태 (D137).
 * `gap` 내려갈 판이 있다 · `preview` 사용처는 있는데 판이 없다(사전 예제 + 예고) ·
 * `none` 사용처가 없다(만들지 않는다) · `ok` 이미 찍혔다.
 */
export type PrereqState = 'gap' | 'preview' | 'none' | 'ok';

/**
 * 아래층 한 줄.
 *
 * `CardPayload`(t0) 의 `prereq` 는 `{ conceptId, n }` 뿐이라 상태·겹·발췌가 없다.
 * 그 세 가지는 진단 문장을 쓰는 데 반드시 필요하므로 화면용 모형을 따로 둔다 —
 * 스키마를 넓히지 않고 화면이 필요한 것만 여기서 요구한다.
 */
export interface PrereqRow {
  conceptId: string;
  /** 개념 이름. */
  n: string;
  ly: InkLayer;
  state: PrereqState;
  /** 「3일 전 · 2겹」 같은 곁말. */
  note: string;
  /**
   * `state === 'preview'` 일 때 「곧 여기서 봅니다」로 가리킬 사용처 (D137 · 방안 E-4).
   * 이 값이 없으면 합성 판을 내지 않는다 — 예고 없는 합성이 앱을 일반 튜토리얼로 만든다.
   */
  previewSiteId?: number | null;
}

export interface PrereqRungProps {
  rows: readonly PrereqRow[];
  /** 이번 사다리에서 이미 보고 온 개념 id. */
  done: readonly string[];
  onJump?: ((row: PrereqRow) => void) | undefined;
}

/** 개념 이름은 `속성 접근 <code>.</code>` 처럼 서식이 섞여 있다 — 평문 문장에 넣을 때 벗긴다. */
const stripTags = (html: string): string => html.replace(/<[^>]*>/g, '');

/** 「모르겠어요」의 대부분은 이 개념이 어려워서가 아니라 아래층이 비어서다 (정본 §3-1). */
function diagnosis(rows: readonly PrereqRow[], gaps: number): string {
  if (rows.length === 0) return t('prereq.allPrinted');
  if (gaps > 0) return t('prereq.someEmpty', { n: String(rows.length), gaps: String(gaps) });
  return t('prereq.justFilled');
}

/**
 * `.prereq` — 사다리 ②단, 아래층 진단 (05 §5 · 정본 §3-1).
 *
 * 내려가도 지금 판은 사라지지 않는다. 아래층을 마치면 이 자리로 자동으로 돌아오고,
 * 돌아오면 `LinkPara` 문단이 새로 열린다.
 */
export function PrereqRung({ rows, done, onJump }: PrereqRungProps) {
  const isDone = (row: PrereqRow) => done.includes(row.conceptId);
  const gaps = rows.filter((r) => r.state === 'gap' && !isDone(r));
  // 예고할 자리가 실제로 있는 것만. `previewSiteId` 가 없으면 합성을 내지 않는다.
  const previews = rows.filter(
    (r) => r.state === 'preview' && !isDone(r)
      && r.previewSiteId !== null && r.previewSiteId !== undefined,
  );

  return (
    <>
      <h4>{t('prereq.heading')}</h4>
      <p>{diagnosis(rows, gaps.length)}</p>

      <div className="prereq">
        {rows.map((row) => {
          const seen = isDone(row);
          const ly = (seen ? Math.min(4, Math.max(1, row.ly + 1)) : row.ly) as InkLayer;
          return (
            <div key={row.conceptId} className={cx('pq', row.state === 'gap' && !seen && 'gap')}>
              <Passes n={ly} label={t('plate.layerN', { n: String(ly) })} />
              <span className="nm">
                {row.n}
                <small>{seen ? t('prereq.justSeen', { n: String(ly) }) : row.note}</small>
              </span>
              {/*
                내려갈 수 있다는 뜻은 `state === 'gap'` 하나가 이미 담고 있다
                (`stateOf` 가 `hasCard && hasSite` 일 때만 그 값을 준다). 앞서 여기에
                `row.cardId !== undefined` 가 하나 더 걸려 있었는데 그 필드를 **아무도
                채우지 않아** 점프 단추가 한 번도 뜨지 않았다 — 02 §4 의 아래층 점프가
                화면에서 도달 불가였다 (D111). 판 만들기는 `jumpPrereq` 가 점프 시점에 한다.
              */}
              {row.state === 'gap' ? (
                seen ? (
                  <Pill ghost>{t('prereq.beenThere')}</Pill>
                ) : (
                  <PressButton tone="blue" onClick={() => onJump?.(row)}>
                    {t('prereq.goDown')}
                  </PressButton>
                )
              ) : row.state === 'preview' ? (
                seen ? (
                  <Pill ghost>{t('prereq.beenThere')}</Pill>
                ) : (
                  <PressButton tone="blue" onClick={() => onJump?.(row)}>
                    {t('prereq.goSimplest')}
                  </PressButton>
                )
              ) : row.state === 'none' ? (
                <Pill ghost>{t('prereq.noPlate')}</Pill>
              ) : (
                <Pill ghost>{t('prereq.printed')}</Pill>
              )}
            </div>
          );
        })}
      </div>

      {/* 합성 판이 서는 자리마다 「곧 네 코드 어디에서 본다」를 적는다 — 방안 E-4 의
          조건이고, 이 문장이 없으면 합성 예제는 남의 예제일 뿐이다 (D137). */}
      {previews.map((row) => (
        <p key={row.conceptId} className="note prereq-preview">
          {t('prereq.previewNote', { name: stripTags(row.n) })}
        </p>
      ))}

      {gaps.length === 0 ? null : (
        <RichText as="p" className="prereq-note" html={t('prereq.note')} />
      )}
    </>
  );
}
