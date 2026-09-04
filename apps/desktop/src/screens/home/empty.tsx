import { t, type Locale } from '@chickadee/i18n';
import { DeeLogo, DeeSprite, PressButton, Switch } from '@chickadee/ui';

import { CloneField } from '../repos/CloneField.js';
import './empty.css';

export interface FirstRunProps {
  /** 리포 폴더를 고른다 (`plugin-dialog`). 화면은 부르기만 하고 IPC 를 모른다. */
  onPick: () => void;
  /** 0단계에서 고른 표시 언어 (D117). */
  locale: Locale;
  onLocale: (locale: Locale) => void;
  /**
   * 「프로그래밍이 처음인가요?」의 답 (D147). 0장을 얼마나 길게 열지만 정한다 —
   * **레벨을 재는 시험이 아니다**(방안 E-5 는 그대로다). 안 고르면 거짓이고, 안 고른 것을
   * 「아니오」로 세지 않는다.
   */
  newcomer: boolean;
  onNewcomer: (newcomer: boolean) => void;
}

/**
 * 첫 실행 · 빈 상태 (05 §2.1 `first-run`).
 *
 * 리포가 0개일 때 화면에 있는 것은 넷이다 — 로고 배지, 한 문단, **언어 고르기**,
 * 버튼 하나. 언어가 먼저 오는 이유는 나머지 셋이 그 언어로 그려지기 때문이다.
 */
export function FirstRun({ onPick, locale, onLocale, newcomer, onNewcomer }: FirstRunProps) {
  // 언어 이름은 그 언어로 적는다 — 못 읽는 언어로 적힌 이름은 고를 수가 없다.
  // 그래서 `en` 카탈로그가 이 둘을 비워 두고 폴백으로 같은 값이 온다.
  const options = [
    { v: 'ko' as const, label: t('locale.ko') },
    { v: 'en' as const, label: t('locale.en') },
  ];
  return (
    <div className="firstrun">
      {/* HomeScreen 과 같은 이유 — 셸이 생기면 스프라이트는 그리로 간다 (05 §6). */}
      <DeeSprite />
      <main className="firstrun-in grain" tabIndex={-1}>
        <DeeLogo className="firstrun-logo" />
        <h1 className="firstrun-title">Chickadee</h1>
        <p className="firstrun-note">{t('firstRun.note')}</p>
        {/* 대상 경계를 **먼저** 말한다 (D139). D147 이 그 경계를 넓히면서 문장이 「대상이
            아니다」에서 「0장이 데려간다」로 바뀌었다 — 말하는 자리는 그대로 첫 화면이다.
            같은 말을 하는 `home.newcomer` 는
            뿌리 개념이 두 세션 내리 막힌 뒤에야 뜬다 — 그때 말하면 헛돈 사람에게만 정직한
            것이 된다. 묻지 않고 잠그지 않는다: 읽고 그냥 등록해도 아무것도 안 막힌다. */}
        <p className="firstrun-scope">{t('firstRun.scope')}</p>

        {/* 한 문항 (D147). **레벨을 고르게 하지 않는다** — 대상 경계 안쪽인지만 묻고,
            바꾸는 것은 0장의 길이 하나다. E-5 「별도 배치고사를 만들지 않는다」는 그대로다. */}
        <div className="firstrun-lang">
          <span className="firstrun-lang-k">{t('firstRun.newcomerQ')}</span>
          <Switch
            options={[
              { v: 'no' as const, label: t('firstRun.newcomerNo') },
              { v: 'yes' as const, label: t('firstRun.newcomerYes') },
            ]}
            value={newcomer ? 'yes' : 'no'}
            label={t('firstRun.newcomerQ')}
            onChange={(v) => onNewcomer(v === 'yes')}
          />
        </div>
        <p className="firstrun-scope">{t('firstRun.newcomerAsk')}</p>
        <div className="firstrun-lang">
          <span className="firstrun-lang-k">{t('firstRun.language')}</span>
          <Switch
            options={options}
            value={locale}
            label={t('firstRun.languageSwitch')}
            onChange={onLocale}
          />
        </div>
        <PressButton onClick={onPick}>{t('firstRun.pick')}</PressButton>
        {/* 리포가 이 컴퓨터에 없을 수도 있다 (D129) — 폴더 고르기 아래에 주소 한 줄. */}
        <CloneField />
      </main>
    </div>
  );
}
