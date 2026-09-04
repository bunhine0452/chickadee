import { t, type MessageKey } from '@chickadee/i18n';

import type { NewcomerFlag } from '../../screens/home/data';
import './Newcomer.css';

export interface NewcomerProps {
  /** `settings.newcomer_flag` (02 §6.4). `'none'` 이면 아무것도 그리지 않는다. */
  flag: NewcomerFlag;
}

/**
 * 왜 이 안내가 떴는지. 감지 규칙(뿌리 개념 새 판이 대부분 오답·「모르겠어요」이고
 * 사다리 2단이 매번 「비어 있는 층 0」)을 숫자 없이 그대로 옮긴 문장이다 — 규칙의 상수가
 * 바뀌어도 이 문장은 거짓이 되지 않는다.
 */
const WHY_KEY: Record<Exclude<NewcomerFlag, 'none'>, MessageKey> = {
  suspect: 'home.newcomerSuspect',
  confirmed: 'home.newcomerConfirmed',
};

/**
 * `.newcomer` — 홈 상단의 정직한 안내 한 줄 (02 §6.4 · 정본 §1).
 *
 * **아무것도 잠그지 않는다.** 게이트가 아니라 안내이므로 버튼도 확인도 없고, 닫기도 없다 —
 * 플래그가 `none` 으로 돌아가면(뿌리 개념 4장 중 3장을 맞히는 세션) 스스로 사라진다.
 *
 * 자료는 링크가 아니라 주소 글자다. 외부 링크를 여는 문(`plugin-opener`)이 아직
 * `@chickadee/ipc-client` 에 없다 — 그 문이 생기면 이 두 자리가 링크가 된다 (05 §87).
 */
export function Newcomer({ flag }: NewcomerProps) {
  if (flag === 'none') return null;

  return (
    <aside className="newcomer" aria-label={t('home.newcomer')}>
      <p className="why">{t(WHY_KEY[flag])}</p>
      <p>{t('home.newcomerBody')}</p>
    </aside>
  );
}
