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
}

/**
 * 첫 실행 · 빈 상태 (05 §2.1 `first-run`).
 *
 * 리포가 0개일 때 화면에 있는 것은 넷이다 — 로고 배지, 한 문단, **언어 고르기**,
 * 버튼 하나. 언어가 먼저 오는 이유는 나머지 셋이 그 언어로 그려지기 때문이다.
 */
export function FirstRun({ onPick, locale, onLocale }: FirstRunProps) {
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
