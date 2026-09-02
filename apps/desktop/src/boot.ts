import { ipc } from '@chickadee/ipc-client';
import { SCHEMA_VERSION, catalog } from '@chickadee/store-sql';

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
  await document.fonts.ready;
  await ipc.win.show();
}
