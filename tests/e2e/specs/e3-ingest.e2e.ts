/**
 * E3 인제스트 진행 — `projectox-like` 진행률 이벤트 단조 증가, 완료 후 카드 수 > 0 (06 §1.5).
 *
 * **못 만들었다.** 인제스트는 리포 등록의 뒤꼬리다(`flow.ts` 의 `addRepo` 가 등록 직후
 * `ingest('full')` 을 부른다). E2 가 못 열리므로 이 화면에 도달할 길이 없다.
 *
 * 잃는 것은 생각보다 작다: 진행 이벤트의 단조 증가는 `IngestScreen.test.tsx` 와 `phases.ts`
 * 의 단위 테스트가, 「완료 후 카드 수 > 0」은 통합 파이프라인(`pipeline.rs` → `fixtures/ipc`)이
 * 이미 결정론적으로 잡는다. E3 이 더하는 것은 **그 둘이 실제 창에서도 이어지는가**뿐이고,
 * 그것은 E2 가 열리는 날 함께 온다.
 */
import { describe, pending } from '../helpers/driver.js';

describe('E3 인제스트 진행', () => {
  pending(
    '`projectox-like` 진행률이 단조 증가하고 완료 후 카드 수 > 0',
    'E2(리포 등록)가 네이티브 대화상자에 막혀 이 화면까지 못 간다',
  );
});
