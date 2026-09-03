/**
 * E1 첫 실행 — 온보딩 화면·「프라이버시 노트」 표시, 네트워크 소켓 0 (06 §1.5).
 *
 * M5 의 「끝났다는 증거」 둘 중 하나가 여기 있다(00 §5). 소켓 측정은 세션 밖에서
 * `tests/e2e/scripts/first-run-sockets.sh` 가 하고, 이 스펙은 그 결과를 판정한다 —
 * 왜 세션 안에서 못 세는지는 그 스크립트의 머리에 적혀 있다.
 */
import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

import { socketsJson } from '../helpers/env.js';
import { before, describe, hasText, it, pending, shown, waitForBoot } from '../helpers/driver.js';

interface SocketReport {
  traced: boolean;
  booted: boolean;
  seconds?: number;
  reason?: string;
  counts: Partial<Record<'external' | 'dns' | 'loopback' | 'inetSocket' | 'inetBind' | 'unix' | 'netlink' | 'other', number>>;
  samples: Partial<Record<'external' | 'dns' | 'loopback' | 'inetSocket' | 'inetBind', string[]>>;
}

describe('E1 첫 실행', () => {
  before(async () => {
    await waitForBoot();
  });

  it('온보딩 화면이 뜬다 — 로고·한 문단·「리포 등록」 (05 §2.1 first-run)', async () => {
    const firstrun = await shown('.firstrun');
    assert.equal(await firstrun.isDisplayed(), true, '.firstrun 이 안 보인다');

    assert.equal(await hasText('Chickadee'), true, '온보딩에 제품 이름이 없다');
    const button = await shown('.firstrun button.press-btn');
    assert.equal(await button.getText(), '리포 등록');
    assert.equal(await button.isEnabled(), true, '「리포 등록」이 눌리지 않는다');
  });

  it('온보딩이 「리포에 쓰지 않는다」를 말한다 (06 §3.6 의 요지)', async () => {
    const note = await shown('.firstrun-note');
    const text = await note.getText();
    assert.ok(
      text.includes('읽기만 하고'),
      `온보딩 문단에 읽기 전용 선언이 없다: ${JSON.stringify(text.slice(0, 120))}`,
    );
  });

  // 06 §3.6 은 이 문구를 「첫 실행·설정에 표시」라고 적었는데, 05 §2.1 의 `first-run` 은
  // 「로고 배지 + 한 문단 + 버튼 하나」다. 지금 코드는 05 쪽이라 §3.6 전문은 설정 화면
  // (`#set-privacy`)에만 있다. **문서끼리 어긋난 자리**라 여기서 통과시키지 않는다 —
  // `screens/home/empty.tsx` 에 노트를 넣거나 06 §1.5 의 통과 조건을 고친 뒤 이 skip 을 푼다.
  pending(
    '첫 실행 화면에 06 §3.6 「프라이버시 노트」 전문이 있다',
    '06 §3.6 과 05 §2.1 이 어긋난다 — 지금 전문은 설정 화면에만 있다 (E8 이 그것을 본다)',
  );

  it('네트워크 소켓 0 — AF_INET/AF_INET6 로 나가는 connect 가 없다', () => {
    const at = socketsJson();
    assert.ok(existsSync(at), `소켓 측정 결과가 없다: ${at} — onPrepare 의 strace 단계를 보라`);
    const report = JSON.parse(readFileSync(at, 'utf8')) as SocketReport;

    assert.equal(report.traced, true, `strace 가 못 돌았다: ${report.reason ?? '(사유 없음)'}`);
    // **빈 트레이스는 통과가 아니다.** 앱이 즉시 죽어도 소켓은 0 이 된다.
    assert.equal(
      report.booted, true,
      '앱이 DB 를 만들지 못했다 — 첫 실행이 부팅까지 가지 못했으므로 소켓 0 은 뜻이 없다',
    );

    // 차단은 `external` 하나다. dns·loopback 은 스크립트가 stdout 으로 숫자를 남기고
    // (CI 로그에 그대로 뜬다) 여기서는 실패 메시지에만 싣는다 — 왜 그 셋을 나누는지는
    // `first-run-sockets.sh` 의 머리에 있다.
    const external = report.counts.external ?? -1;
    assert.equal(
      external, 0,
      `첫 실행이 밖으로 나갔다 (AF_INET/AF_INET6 connect ${external}건). ` +
      `함께 잰 것: ${JSON.stringify(report.counts)}\n` +
      (report.samples.external ?? []).map((l) => `  ${l}`).join('\n'),
    );
  });
});
