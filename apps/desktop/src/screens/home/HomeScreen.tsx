import { DeeSprite, LiveRegion } from '@chickadee/ui';

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
import { TodayPanel, type TodayPreview } from '../../components/home/TodayPanel';
import { layerLabel } from '../../components/home/labels';
import { WINDOW_SHEETS, type HomeData, type HomeSheet } from './data';
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
  /** 「판 만들기」. */
  onMake: (conceptId: string) => void;
  /** 노드 상세의 「이 판 찍기」. */
  onPick?: ((conceptId: string) => void) | undefined;
  /** 만기 문구의 기준 시각. 테스트는 고정값을 넣는다. */
  now?: number | undefined;
}

/** 길잡이 한 줄 — 지금 여기인 스티커를 가리킨다. 조사가 흔들리지 않게 「」로 묶는다. */
function guideMsg(sheets: readonly HomeSheet[]): string | null {
  for (const sheet of sheets) {
    const current = sheet.nodes.find((n) => n.state === 'current');
    if (current === undefined) continue;
    return `다음은 「${current.nameKo}」입니다. ${layerLabel(current.shownLayer)}.`;
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
  data, repoName, today, streak, today_, onStart, onMake, onPick, now,
}: HomeScreenProps) {
  const guide = guideMsg(data.sheets);
  const currentUnitId = data.sheets.find((s) => s.state === 'current')?.unitId ?? null;
  const printed = data.masthead.printed;
  const concepts = data.masthead.concepts;

  return (
    <div className="press">
      {/* 스프라이트는 앱 루트에 한 번만 박는 것이 정본이다 (05 §6). AppShell 이 생기기 전까지는
          화면이 스스로 들고 있어야 새가 그려진다 — 셸이 들어오면 이 줄이 그리로 옮겨 간다. */}
      <DeeSprite />
      <Masthead repoName={repoName} today={today} streak={streak} masthead={data.masthead} />
      {/* 초보 안내는 대지보다 위다 — 아래에 두면 스크롤해야 보이고, 그러면 안내가 아니다. */}
      <Newcomer flag={data.newcomerFlag} />

      <Board
        title={
          <>
            <em>{repoName}</em> 대지
          </>
        }
        plain="= 내 리포의 기능 지도"
        note={
          <>
            유닛 하나가 내 리포의 실제 기능 하나입니다. 커밋과 파일에서 뽑은 개념 {concepts}개 중{' '}
            <b>{printed}개</b>를 찍었습니다.
          </>
        }
      >
        <div className="cols">
          <aside>
            {today_ === undefined || onStart === undefined ? null : (
              <TodayPanel today={today_} onStart={onStart} date={today} />
            )}

            <Panel title="잉크 겹" plain="= 얼마나 익혔나" tag="4겹 = 완성">
              <InkScale counts={data.inkScale} />
              <p className="note">
                개념을 익힐수록 새가 선명해집니다. 겹은 <b>맞힌 횟수</b>가 아니라{' '}
                <b>시간을 두고 다시 맞힌 횟수</b>로 쌓입니다. 「모르겠어요」를 누르면 한 겹
                내려가고 그만큼 빨리 다시 찍습니다.
              </p>
              <ConceptList rows={data.retake} now={now} />
            </Panel>

            <Panel title="판이 없는 문법" plain="= 내 코드엔 있는데 아직 안 찍은 문법">
              <GapsPanel gaps={data.gaps} onMake={onMake} />
              <p className="note gaps-note">
                AI가 써준 자리라도 판을 만들면 그날 인쇄 목록에 들어갑니다. 등장 횟수가 많은
                것부터 잡으면 한 번에 여러 파일이 읽힙니다.
              </p>
              {/* 「아직 못 하는 것」을 한 자리에 모은다 — 구멍 지도 바로 아래다 (D96). */}
              <LockedPanel openable={data.openableBlocks} files={data.files} />
            </Panel>
          </aside>

          {/* 12장을 넘으면 화면 밖 대지를 그리지 않는다 (D81 · 05 §10). 문턱 아래에서는
              걸지 않는다 — 가시성 판정 비용만 남는다. */}
          <div className="sheets" data-windowed={data.sheets.length > WINDOW_SHEETS ? 'on' : 'off'}>
            {data.sheets.length === 0 ? (
              <>
                <p className="note">
                  아직 대지가 없습니다. 리포를 읽으면 기능마다 대지가 한 장씩 깔립니다.
                </p>
                <Forecast pending={data.lastRun?.commits ?? 0} variant="cannot" />
              </>
            ) : (
              <>
                {data.sheets.map((sheet, i) => (
                  <Sheet
                    key={sheet.unitId}
                    sheet={sheet}
                    no={i + 1}
                    guide={sheet.unitId === currentUnitId && guide !== null ? guide : undefined}
                    onPick={onPick}
                    now={now}
                  />
                ))}
                <Forecast pending={data.files} variant="later" nextNo={data.sheets.length + 1} />
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
