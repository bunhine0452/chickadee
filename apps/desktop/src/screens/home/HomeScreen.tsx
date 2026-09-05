import { t, type MessageKey } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';

import { Page } from '../../components/shell/Page';
import { GapList } from '../../components/home/GapList';
import { Notice } from '../../components/home/Notice';
import { TodayCard, type TodayPreview } from '../../components/home/TodayCard';
import { Topbar } from '../../components/home/Topbar';
import { UnitList } from '../../components/home/UnitList';
import type { HomeData } from './data';
import './HomeScreen.css';

export interface HomeScreenProps {
  /** 홈 한 화면치. 화면은 이것 말고 아무것도 읽지 않는다 — IPC 는 부르는 쪽이 한다. */
  data: HomeData;
  repoName: string;
  /** `YYYY-MM-DD`. 큐를 계산한 날이고 화면에는 안 적는다 — 날짜는 OS 가 말한다. */
  today: string;
  streak: number;
  /** 오늘 할 것 미리보기. 없으면 카드를 내지 않는다(첫 실행 직후). */
  today_?: TodayPreview | undefined;
  /** 「학습 시작」 / 「이어 풀기」. */
  onStart?: (() => void) | undefined;
  onSettings: () => void;
  /** 서가 열기 (D119). */
  onRepos: () => void;
  /**
   * 06 §6.3 — `ingest_run.fingerprint` 가 현재 빌드 값과 다르면 참. 판정은
   * `data/maintenance.ts` 의 `needsReingest` 가 하고 여기서는 그리기만 한다.
   */
  reingest?: boolean | undefined;
  /** 「문제 만들기」. */
  onMake: (conceptId: string) => void;
  /** 개념 줄의 「이 문제 풀기」. */
  onPick?: ((conceptId: string) => void) | undefined;
  /** 코스 열기 (D120). 단원 줄은 그 단원을, 맨 윗줄은 리포 전체를 범위로 준다. */
  onCourse?: ((unitId: number | null) => void) | undefined;
  /** 만기 문구의 기준 시각. 시험은 고정값을 넣는다. */
  now?: number | undefined;
}

/** 초보 안내가 왜 떴는지 (02 §6.4). 규칙의 상수가 바뀌어도 거짓이 되지 않는 문장이다. */
const NEWCOMER_WHY: Record<'suspect' | 'confirmed', MessageKey> = {
  suspect: 'home.newcomerSuspect',
  confirmed: 'home.newcomerConfirmed',
};

/**
 * 홈 (05 §2.1 · 정본 §6).
 *
 * **홈에서 학습자가 할 일은 하나다 — 오늘 학습을 시작한다.** 그래서 화면은 위에서 아래로
 * 셋이다: 오늘 할 것(가장 큼) · 단원 · 아직 안 배운 문법. 나머지는 뺐다.
 *
 * 뺀 것과 이유 (정본 §6 「하나의 초점」·「장식 0」):
 * - **오늘 요약 넉 칸**(리포·날짜·연속·평균 숙련도) — 읽어도 할 일이 안 바뀐다. 리포는
 *   스위처가, 연속은 오늘 카드 한 줄이 말하고 나머지 둘은 지웠다.
 * - **도장 카드 · 지난 14일 막대** — 이력이지 오늘 할 일이 아니다. 그림 두 덩이가
 *   화면 위쪽을 먹었다.
 * - **숙련도 사다리**(0~4단계 히스토그램과 설명 두 문단) — 집계라 무엇을 할지 안 바꾼다.
 * - **다시 풀 개념 목록** — 만기 개념이 곧 오늘 큐라 「오늘 할 것」과 같은 말을 두 번 했다.
 * - **개념 스티커 격자와 상세 팝오버** — 개념 하나에 90px 카드. 목록 한 줄로 갈았다.
 * - **미조판 예고 두 종** — 「아직 없다」를 두 문단으로 말했다. 빈 상태 한 줄로 충분하다.
 * - **길잡이 한 줄** — 「오늘 할 것」이 그 일을 한다.
 * - **마스코트** — 정본 §7.
 *
 * **순수 컴포넌트다.** `HomeData` 를 통째로 받아 그리기만 한다.
 */
export function HomeScreen({
  data, repoName, today_, onSettings, onRepos, reingest, onStart, onMake, onPick,
  onCourse, streak, now,
}: HomeScreenProps) {
  const flag = data.newcomerFlag;

  return (
    // 세션 오버레이가 닫히면 포커스가 `<body>` 로 떨어진다 — 05 §9 의 「포커스 유실」이다.
    // `App` 이 세션이 닫힐 때 여기로 옮긴다 (D111).
    <div className="press" tabIndex={-1}>
      <Topbar
        repoName={repoName}
        onCourse={() => onCourse?.(null)}
        onRepos={onRepos}
        onSettings={onSettings}
      />

      <Page className="home">
        {reingest === true ? (
          <Notice title={t('home.reingestTitle')}>
            <RichText as="p" html={t('home.reingestNote')} />
          </Notice>
        ) : null}

        {flag === 'none' ? null : (
          <Notice title={t('home.newcomer')}>
            <p className="why">{t(NEWCOMER_WHY[flag])}</p>
            <p>{t('home.newcomerBody')}</p>
          </Notice>
        )}

        {today_ === undefined || onStart === undefined ? null : (
          <TodayCard today={{ ...today_, streak }} onStart={onStart} />
        )}

        <div className="home-sub l-cols">
          <UnitList
            sheets={data.sheets}
            files={data.files}
            concepts={data.masthead.concepts}
            learned={data.masthead.printed}
            {...(onPick ? { onPick } : {})}
            {...(onCourse ? { onCourse: (unitId: number) => onCourse(unitId) } : {})}
            now={now}
          />
          <GapList
            gaps={data.gaps}
            openable={data.openableBlocks}
            files={data.files}
            commits={data.lastRun?.commits ?? 0}
            onMake={onMake}
          />
        </div>
      </Page>
    </div>
  );
}
