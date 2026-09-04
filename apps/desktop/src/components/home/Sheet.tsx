import { useRef, useState } from 'react';
import { t } from '@chickadee/i18n';
import { FlatButton, Misreg, Reg, Stamp } from '@chickadee/ui';

import type { HomeSheet } from '../../screens/home/data';
import { Guide } from './Guide';
import { InkRail } from './InkRail';
import { Node } from './Node';
import { NodeDetail } from './NodeDetail';
import { railLabel, sheetTilt } from './labels';
import './Sheet.css';

/** 완료 도장이 얹히는 각도(도). 목업 `.stamp-done{transform:rotate(-8deg)}`. */
const STAMP_ROTATE = -8;

export interface SheetProps {
  sheet: HomeSheet;
  /** 대지 번호 (1부터). 목업의 `1대`. */
  no: number;
  /** 길잡이 말풍선. 현재 대지에만 준다. */
  guide?: string | undefined;
  /** 상세의 「이 판 찍기」. */
  onPick?: ((conceptId: string) => void) | undefined;
  /** 「이 대지 통째로 필사」 — 이 대지를 범위로 코스를 연다 (D120). */
  onCourse?: ((unitId: number) => void) | undefined;
  /** 만기 문구의 기준 시각. 테스트는 고정값을 넣는다. */
  now?: number | undefined;
}

function metaOf(sheet: HomeSheet): string {
  // 0장은 리포 경로도 파일도 없다 — 「경로 없음 · 파일 0개」는 참이지만 아무것도 알려주지
  // 않는다. 대신 이 대지가 몇 장이고 끝이 있다는 것을 적는다 (D136).
  if (sheet.zero) return t('home.zeroChapterMeta', { n: String(sheet.nodes.length) });
  return t('home.sheetMeta', {
    where: sheet.rootPath === null ? t('home.sheetNoPath') : sheet.rootPath,
    files: String(sheet.files),
    concepts: String(sheet.nodes.length),
  });
}

function statusOf(sheet: HomeSheet, no: number): string {
  const done = String(sheet.nodes.filter((n) => n.state === 'done').length);
  const all = String(sheet.nodes.length);
  // 다 찍은 대지는 숫자만 낸다 — 「인쇄 중」이 붙으면 끝난 것이 안 끝난 것처럼 읽힌다.
  if (sheet.state === 'done') return `${done} / ${all}`;
  if (sheet.state === 'locked') return t('home.sheetStatusLocked', { n: String(no - 1) });
  return t('home.sheetStatusPrinting', { done, all });
}

/**
 * `.sheet` — 대지 한 장(= 내 리포의 기능 하나)과 그 위의 스티커들.
 * 상세는 대지마다 하나만 열린다. 닫으면 포커스가 열었던 스티커로 돌아간다 (05 §5).
 */
export function Sheet({ sheet, no, guide, onPick, onCourse, now }: SheetProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const nodesRef = useRef<HTMLDivElement | null>(null);
  const headId = `sheet-${sheet.unitId}`;

  const open = sheet.nodes.find((n) => n.conceptId === openId) ?? null;

  const close = () => {
    const id = openId;
    setOpenId(null);
    if (id === null) return;
    const buttons = nodesRef.current?.querySelectorAll<HTMLButtonElement>('button.node');
    for (const button of buttons ?? []) {
      if (button.dataset.concept === id) {
        button.focus();
        return;
      }
    }
  };

  return (
    <article
      className="sheet u-tilt"
      data-state={sheet.state}
      style={sheetTilt(no - 1)}
      aria-labelledby={headId}
    >
      <Reg hit={sheet.state === 'done'} />
      {sheet.state === 'done' ? <Stamp text={t('home.sheetStamp')} rotate={STAMP_ROTATE} /> : null}
      {guide === undefined ? null : <Guide msg={guide} />}
      <InkRail ly={sheet.avgLayer} label={railLabel(no, sheet.avgLayer)} />

      <div className="sheet-in">
        <div className="sheet-head">
          <Misreg
            className="sig"
            text={sheet.zero ? t('home.zeroChapterSig') : t('home.sheetSig', { n: String(no) })}
          />
          <div>
            <h2 className="sheet-h2" id={headId}>
              {sheet.name}
              {sheet.zero ? null : (
                <span className="pl">{t('home.sheetFeature', { n: String(no) })}</span>
              )}
            </h2>
            <div className="sheet-meta">{metaOf(sheet)}</div>
          </div>
          <span className="sheet-status">{statusOf(sheet, no)}</span>
        </div>

        {/* 0장의 도입 한 문단 — 몇 장이고 언제 끝나는지를 먼저 말한다 (D136). */}
        {sheet.zero ? (
          <p className="note sheet-lead">
            {sheet.state === 'done'
              ? t('home.zeroChapterDone')
              : t('home.zeroChapterLead', { n: String(sheet.nodes.length) })}
          </p>
        ) : null}

        {onCourse === undefined ? null : (
          <div className="sheet-course">
            <FlatButton onClick={() => onCourse(sheet.unitId)} ghost>
              {t('home.sheetCourse')}
            </FlatButton>
          </div>
        )}

        <div className="nodes" ref={nodesRef}>
          {sheet.nodes.map((node, i) => (
            <Node
              key={node.conceptId}
              node={node}
              index={i}
              expanded={node.conceptId === openId}
              onOpen={setOpenId}
            />
          ))}
        </div>

        {open === null ? null : (
          <NodeDetail node={open} onGo={onPick} onClose={close} now={now} />
        )}
      </div>
    </article>
  );
}
