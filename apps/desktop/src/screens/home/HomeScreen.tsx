import { useState } from 'react';
import { t } from '@chickadee/i18n';
import { DeeSprite, LiveRegion, RichText } from '@chickadee/ui';

import { Board } from '../../components/home/Board';
import { ColorBar } from '../../components/home/ColorBar';
import { ConceptList } from '../../components/home/ConceptList';
import { Forecast } from '../../components/home/Forecast';
import { GapsPanel } from '../../components/home/GapsPanel';
import { InkScale } from '../../components/home/InkScale';
import { LockedPanel } from '../../components/home/LockedPanel';
import { Masthead } from '../../components/home/Masthead';
import { Newcomer } from '../../components/home/Newcomer';
import { Panel } from '../../components/home/Panel';
import { Sheet } from '../../components/home/Sheet';
import { SheetIndex } from '../../components/home/SheetIndex';
import { TodayPanel, type TodayPreview } from '../../components/home/TodayPanel';
import { layerLabel } from '../../components/home/labels';
import { nextSheetNo, sheetNo, type HomeData, type HomeSheet } from './data';
import './HomeScreen.css';

export interface HomeScreenProps {
  /** 홈 한 화면치. 화면은 이것 말고 아무것도 읽지 않는다 — IPC 는 부르는 쪽이 한다. */
  data: HomeData;
  repoName: string;
  /** `YYYY-MM-DD`. */
  today: string;
  streak: number;
  /** 오늘의 인쇄 미리보기. 없으면 패널을 내지 않는다(첫 실행 직후). */
  today_?: TodayPreview | undefined;
  /** 「인쇄 시작」 / 「이어 찍기」. */
  onStart?: (() => void) | undefined;
  /** 마스트헤드의 「설정」 (05 §2.1 `settings`). */
  onSettings: () => void;
  /**
   * 06 §6.3 — `ingest_run.fingerprint` 가 현재 빌드 값과 다르면 참. 판정은
   * `data/maintenance.ts` 의 `needsReingest` 가 하고 여기서는 그리기만 한다.
   * **리포 동일성 해시(`repo.fingerprint`)와는 다른 것이다.**
   */
  reingest?: boolean | undefined;
  /** 「판 만들기」. */
  onMake: (conceptId: string) => void;
  /** 노드 상세의 「이 판 찍기」. */
  onPick?: ((conceptId: string) => void) | undefined;
  /** 코스 열기 (D120). 대지 카드는 그 대지를, 마스트헤드는 리포 전체를 범위로 준다. */
  onCourse?: ((unitId: number | null) => void) | undefined;
  /** 만기 문구의 기준 시각. 테스트는 고정값을 넣는다. */
  now?: number | undefined;
}

/** 길잡이 한 줄 — 지금 여기인 스티커를 가리킨다. 조사가 흔들리지 않게 「」로 묶는다. */
function guideMsg(sheets: readonly HomeSheet[]): string | null {
  for (const sheet of sheets) {
    const current = sheet.nodes.find((n) => n.state === 'current');
    if (current === undefined) continue;
    return t('home.guide', {
      name: current.nameKo,
      layer: layerLabel(current.shownLayer),
    });
  }
  return null;
}

/**
 * 경로 홈 = 내 리포의 기능 지도 (05 §2.1).
 *
 * **순수 컴포넌트다.** `HomeData` 를 통째로 받아 그리기만 한다 — 데이터를 스스로 불러오지
 * 않으므로 테스트가 픽스처 하나로 끝난다.
 */
export function HomeScreen({
  data, repoName, today, streak, today_, onSettings, reingest, onStart, onMake, onPick,
  onCourse, now,
}: HomeScreenProps) {
  const guide = guideMsg(data.sheets);
  const currentUnitId = data.sheets.find((s) => s.state === 'current')?.unitId
    ?? data.sheets[0]?.unitId ?? null;
  // 색인에서 고른 대지. 아직 안 골랐으면 지금 인쇄 중인 대지가 걸린다 (D133).
  const [picked, setPicked] = useState<number | null>(null);
  const shownId = data.sheets.some((s) => s.unitId === picked) ? picked : currentUnitId;
  const shownAt = data.sheets.findIndex((s) => s.unitId === shownId);
  const shown = shownAt < 0 ? null : (data.sheets[shownAt] as HomeSheet);
  const printed = data.masthead.printed;
  const concepts = data.masthead.concepts;

  return (
    // 세션 오버레이가 닫히면 포커스가 `<body>` 로 떨어진다 — 05 §9 의 「포커스 유실」이다.
    // 05 §7 의 `returnFocusId` 는 아직 없으므로, 홈이 스스로 받을 수 있게 해 두고
    // `App` 이 세션이 닫힐 때 여기로 옮긴다 (D111).
    <div className="press" tabIndex={-1}>
      {/* 스프라이트는 앱 루트에 한 번만 박는 것이 정본이다 (05 §6). AppShell 이 생기기 전까지는
          화면이 스스로 들고 있어야 새가 그려진다 — 셸이 들어오면 이 줄이 그리로 옮겨 간다. */}
      <DeeSprite />
      <Masthead
        repoName={repoName}
        today={today}
        streak={streak}
        masthead={data.masthead}
        onSettings={onSettings}
        onCourse={() => onCourse?.(null)}
      />
      {/* 초보 안내는 대지보다 위다 — 아래에 두면 스크롤해야 보이고, 그러면 안내가 아니다. */}
      <Newcomer flag={data.newcomerFlag} />

      {/* 06 §6.3 재인제스트 배너. 경고가 아니라 안내다 — 겹은 개념에 붙어 있어 살아남는다. */}
      {reingest === true ? (
        <Panel title={t('home.reingestTitle')} plain={t('home.reingestPlain')}>
          <RichText as="p" className="note" html={t('home.reingestNote')} />
        </Panel>
      ) : null}

      <Board
        title={<RichText html={t('home.boardTitle', { repo: repoName })} />}
        plain={t('home.boardPlain')}
        note={
          <RichText
            html={data.sheets.length === 0
              ? t('home.boardNoteNoSheets')
              : t('home.boardNote', { concepts: String(concepts), printed: String(printed) })}
          />
        }
      >
        <div className="cols">
          <aside>
            {today_ === undefined || onStart === undefined ? null : (
              <TodayPanel today={today_} onStart={onStart} date={today} />
            )}

            {/* 잉크 겹 척도는 매일 보는 것이 아니다 — 605px 을 제목 줄 하나로 접는다 (D133). */}
            <Panel
              title={t('home.inkTitle')}
              plain={t('home.inkPlain')}
              tag={t('home.inkTag')}
              collapsible
              defaultOpen={false}
            >
              <InkScale counts={data.inkScale} />
              <RichText as="p" className="note" html={t('home.inkNote')} />
              <ConceptList rows={data.retake} now={now} />
            </Panel>

            {/* 구멍 지도는 접지 않는다 — 「판 만들기」가 홈의 동작이고, 다른 화면의 문구가
                (`prereq.noPlate`) 그 버튼을 가리킨다. */}
            <Panel title={t('home.gapsTitle')} plain={t('home.gapsPlain')}>
              <GapsPanel gaps={data.gaps} onMake={onMake} />
              <p className="note gaps-note">{t('home.gapsNote')}</p>
              {/* 「아직 못 하는 것」을 한 자리에 모은다 — 구멍 지도 바로 아래다 (D96). */}
              <LockedPanel openable={data.openableBlocks} files={data.files} />
            </Panel>
          </aside>

          {/* 대지 더미를 세로로 쌓지 않는다 — 색인 띠 한 줄과 걸린 한 장이다 (D133).
              화면 밖 대지를 안 그리려고 걸었던 윈도잉(D81·D105)은 그릴 것 자체가
              없어져 함께 걷었다. */}
          <div className="sheets">
            <SheetIndex sheets={data.sheets} selected={shownId} onSelect={setPicked} />

            {shown === null ? (
              <>
                {/* 읽은 리포에는 왜 없는지를 말한다 — 「읽으면 깔립니다」는 읽으라는 말이 된다 (D170 ⑥). */}
                <p className="note">
                  {data.files > 0
                    ? t('home.noSheetsRead', { n: String(data.files) })
                    : t('home.noSheets')}
                </p>
                <Forecast pending={data.lastRun?.commits ?? 0} variant="cannot" />
              </>
            ) : (
              <>
                <div id={`sheet-panel-${shown.unitId}`} role="tabpanel" aria-labelledby={`sx-${shown.unitId}`}>
                  <Sheet
                    key={shown.unitId}
                    sheet={shown}
                    no={sheetNo(data.sheets, shownAt)}
                    guide={shown.unitId === currentUnitId && guide !== null ? guide : undefined}
                    onPick={onPick}
                    {...(onCourse ? { onCourse: (unitId: number) => onCourse(unitId) } : {})}
                    now={now}
                  />
                </div>
                <Forecast pending={data.files} variant="later" nextNo={nextSheetNo(data.sheets)} />
              </>
            )}

            <ColorBar days={data.days} />
          </div>
        </div>
      </Board>

      <LiveRegion text={guide ?? ''} />
    </div>
  );
}
