import { ipc, log } from '@chickadee/ipc-client';
import { SCHEMA_VERSION, catalog } from '@chickadee/store-sql';

import { applyLocale, DEFAULTS, loadSettings, startTheme } from './data/settings.js';
import { refreshRepos } from './flow.js';
import { useUi } from './store.js';

/**
 * 기동 순서 (01 §10): 마이그레이션 → `store_open` → 창 표시.
 *
 * 창은 `visible:false` 로 만들어진다. 폰트가 준비되기 전에 보이면 폴백 서체로 한 프레임이 그려지고
 * 행 길이가 흔들린다(05 §1.2·§10) — `document.fonts.ready` 뒤에 연다.
 */
export async function boot(): Promise<void> {
  const info = await ipc.store.open(catalog());
  if (info.userVersion !== SCHEMA_VERSION) {
    throw new Error(`스키마 번호가 어긋난다: DB ${info.userVersion} ≠ 앱 ${SCHEMA_VERSION}`);
  }
  // 언어를 **창을 보이기 전에** 세운다 (D117). 창은 `visible:false` 로 떠 있으므로
  // 여기서 바꿔도 사용자는 다른 언어의 한 프레임을 보지 않는다.
  const settings = await loadSettings().catch(() => null);
  const locale = settings?.locale ?? DEFAULTS.locale;
  applyLocale(locale);
  useUi.getState().setLocale(locale);

  // 밝기도 **창을 보이기 전에** (D187 ⑫). 이것이 없으면 `<html data-theme>` 을 세우는 것이
  // 설정 화면의 훅뿐이라, 설정에 들어갔다 나오기 전에는 홈도 세션도 밝게로 굳는다.
  await startTheme();

  // 등록된 리포가 있으면 홈, 없으면 첫 실행 화면 — 그 판단은 목록을 읽어야 한다.
  await refreshRepos().catch(() => log.warn('리포 목록을 읽지 못했다'));
  // 마지막으로 본 리포로 들어간다 (D119 · 05 §2.4). 그 리포가 사라졌으면 `setRepos` 가
  // 이미 첫 줄을 골라 두었으므로 여기서는 목록에 있을 때만 덮어쓴다.
  const last = settings?.lastRepoId ?? null;
  if (last !== null && useUi.getState().repos.some((r) => r.id === last)) {
    useUi.setState({ activeId: last });
  }
  await document.fonts.ready;
  await ipc.win.show();
  performance.measure('home:paint', { start: 0 });
}
