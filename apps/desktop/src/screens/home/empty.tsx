import { t, type Locale } from '@chickadee/i18n';
import { PressButton, Switch } from '@chickadee/ui';

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
   * **레벨을 재는 시험이 아니다**(방안 E-5 는 그대로다).
   */
  newcomer: boolean;
  onNewcomer: (newcomer: boolean) => void;
}

/**
 * 첫 실행 · 빈 상태 (05 §2.1 `first-run`).
 *
 * 화면에 있는 것은 넷이다 — 이름 한 줄, 무엇을 하는 프로그램인지 한 문단, 물음 둘,
 * 그리고 **리포를 넣는 문**. 마스코트와 종이 질감은 뺐다 (정본 §7 · D182).
 *
 * 리포를 넣는 문이 시각적으로 가장 크다 — 이 화면에서 할 일이 그것 하나다.
 */
export function FirstRun({ onPick, locale, onLocale, newcomer, onNewcomer }: FirstRunProps) {
  // 언어 이름은 그 언어로 적는다 — 못 읽는 언어로 적힌 이름은 고를 수가 없다.
  const options = [
    { v: 'ko' as const, label: t('locale.ko') },
    { v: 'en' as const, label: t('locale.en') },
  ];

  return (
    <div className="firstrun">
      <main className="firstrun-in" tabIndex={-1}>
        <h1 className="firstrun-title">Chickadee</h1>
        <p className="firstrun-note">{t('firstRun.note')}</p>
        {/* 대상 경계를 **먼저** 말한다 (D139·D147). 묻지 않고 잠그지 않는다 —
            읽고 그냥 등록해도 아무것도 안 막힌다. */}
        <p className="firstrun-scope">{t('firstRun.scope')}</p>

        <div className="firstrun-asks">
          {/* 한 문항 (D147). 바꾸는 것은 0장의 길이 하나다. */}
          <div className="firstrun-ask firstrun-lang firstrun-newcomer">
            <span className="firstrun-ask-k">{t('firstRun.newcomerQ')}</span>
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
          <p className="firstrun-hint">{t('firstRun.newcomerAsk')}</p>

          {/* 두 스위치가 같은 배치를 쓴다. 뒤에 붙은 클래스가 실기 E2E 의 선택자다. */}
          <div className="firstrun-ask firstrun-lang firstrun-locale">
            <span className="firstrun-ask-k">{t('firstRun.language')}</span>
            <Switch
              options={options}
              value={locale}
              label={t('firstRun.languageSwitch')}
              onChange={onLocale}
            />
          </div>
        </div>

        <div className="firstrun-go">
          <PressButton onClick={onPick}>{t('firstRun.pick')}</PressButton>
          {/* 리포가 이 컴퓨터에 없을 수도 있다 (D129) — 폴더 고르기 아래에 주소 한 줄. */}
          <CloneField />
        </div>
      </main>
    </div>
  );
}
