// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UsesRung } from './UsesRung';
import type { UseRow } from './UsesRung';

afterEach(cleanup);

const USES: UseRow[] = [
  { siteId: 7, f: 'checkout.ts', l: 88, code: 'const id = user?.id;' },
  { siteId: 9, f: 'profile.ts', l: 12, code: 'return data?.name ?? "";' },
];

describe('UsesRung', () => {
  it('목업 클래스를 그대로 붙이고 자리마다 한 칸을 낸다', () => {
    const { container } = render(<UsesRung uses={USES} />);
    expect(container.querySelector('.uses')).not.toBeNull();
    expect(container.querySelectorAll('.use')).toHaveLength(2);
  });

  it('파일 이름과 행 번호를 적는다 — 디렉터리 경로는 담지 않는다', () => {
    const { container } = render(<UsesRung uses={USES} />);
    const src = container.querySelector('.use .src');
    expect(src?.querySelector('b')?.textContent).toBe('checkout.ts');
    expect(src?.textContent).toContain('88행');
    expect(container.textContent).not.toContain('/');
  });

  it('코드 한 줄은 코드 판으로 그리고 줄번호는 실제 행이다', () => {
    const { container } = render(<UsesRung uses={USES} />);
    const line = container.querySelector('.use .code .ln');
    expect(line?.getAttribute('data-n')).toBe('88');
    expect(line?.querySelector('span')?.textContent).toBe('const id = user?.id;');
  });

  it('자리가 없으면 빈 상태를 말한다', () => {
    const { container } = render(<UsesRung uses={[]} />);
    expect(container.querySelector('.uses')).toBeNull();
    expect(container.textContent).toContain('아직 찾지 못했습니다');
  });
});
