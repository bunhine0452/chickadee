// @vitest-environment jsdom
/**
 * 악성 문법 사전 (06 §4.2 · Q10). `fixtures/evil-dict/hostile.yaml` 의 문자열이
 * 화면에 닿았을 때 `<script` 와 `on…=` 이 남지 않는지 본다.
 *
 * 왜 픽스처 파일인가: 공격 문자열을 테스트 안에 흩어 두면 새 사례를 더할 자리가 없다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup } from '@testing-library/react';

import { RichText, sanitizeRichText } from './RichText.js';

/** yaml 의존성 없이 읽는다 — `- name:` / `html: "…"` 두 줄짜리 고정 형식이다. */
function hostile(): { name: string; html: string }[] {
  // jsdom 환경에서는 `import.meta.url` 이 http URL 이라 파일 경로로 못 쓴다.
  const at = join(process.cwd(), 'fixtures/evil-dict/hostile.yaml');
  const text = readFileSync(at, 'utf8');
  const out: { name: string; html: string }[] = [];
  let name = '';
  for (const line of text.split('\n')) {
    const isName = /^\s*-\s*name:\s*(.+)$/.exec(line);
    if (isName) name = isName[1]?.trim() ?? '';
    const isHtml = /^\s*html:\s*"(.*)"\s*$/.exec(line);
    if (isHtml) out.push({ name, html: JSON.parse(`"${isHtml[1] ?? ''}"`) as string });
  }
  return out;
}

const cases = hostile();

afterEach(cleanup);

describe('악성 사전 문자열', () => {
  test('픽스처를 실제로 읽었다', () => {
    expect(cases.length).toBeGreaterThanOrEqual(10);
  });

  test.each(cases.map((c) => [c.name, c.html] as const))('%s — 스크립트도 이벤트도 안 남는다', (_name, html) => {
    const clean = sanitizeRichText(html);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/\son\w+\s*=/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/<iframe/i);
    expect(clean).not.toMatch(/\sstyle\s*=/i);
  });

  test.each(cases.map((c) => [c.name, c.html] as const))('%s — DOM 에도 남지 않는다', (_name, html) => {
    const { container } = render(<RichText html={html} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    for (const el of container.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        expect(attr.name.toLowerCase()).not.toMatch(/^on/);
      }
    }
  });

  test('허용 태그 6개는 살아남는다 — 정화가 사전을 못 쓰게 만들면 안 된다', () => {
    const { container } = render(
      <RichText html="<code>a?.b</code> 는 <b>없으면</b> <em>멈춘다</em><br><kbd>Esc</kbd>" />,
    );
    for (const tag of ['code', 'b', 'em', 'br', 'kbd']) {
      expect(container.querySelector(tag)).not.toBeNull();
    }
  });

  test('mustache 처럼 생긴 것은 표현식이 아니라 글자다', () => {
    const clean = sanitizeRichText("{{constructor.constructor('alert(1)')()}}");
    expect(clean).toContain('constructor');
    expect(clean).not.toMatch(/<[a-z]/i);
  });
});
