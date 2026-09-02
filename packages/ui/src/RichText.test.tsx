// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RICH_TEXT_ALLOWED_TAGS, RichText, sanitizeRichText } from './RichText';

afterEach(cleanup);

/** 06 §4.2 「악성 문법 사전」 — fixtures/evil-dict 가 겨냥하는 네 가지. */
const EVIL = {
  script: '<script>alert(1)</script>정합',
  imgOnerror: '<img src=x onerror="alert(1)">정합',
  javascriptUrl: '<a href="javascript:alert(1)">눌러</a>정합',
  mustache: '{{constructor.constructor("alert(1)")()}}',
} as const;

describe('RichText', () => {
  it.each(Object.entries(EVIL))('악성 입력 %s 를 무해하게 만든다', (_name, evil) => {
    const { container } = render(<RichText html={evil} />);
    const html = container.innerHTML;
    expect(html).not.toContain('<script');
    expect(html).not.toMatch(/on\w+=/);
    expect(html).not.toContain('javascript:');
  });

  it('허용 태그 6개는 그대로 남는다', () => {
    const { container } = render(
      <RichText html="<b>const</b> 는 <code>재대입</code>만 막는다<br><i>i</i><em>em</em><kbd>Esc</kbd>" />,
    );
    for (const tag of RICH_TEXT_ALLOWED_TAGS) {
      expect(container.querySelector(tag)).not.toBeNull();
    }
  });

  it('속성은 하나도 통과하지 않는다', () => {
    expect(sanitizeRichText('<code class="k" id="x" title="t">x</code>')).toBe('<code>x</code>');
  });

  it('허용 목록 밖 태그는 글자만 남는다', () => {
    expect(sanitizeRichText('<div><strong>굵게</strong></div>')).toBe('굵게');
  });
});
