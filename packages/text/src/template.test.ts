import { describe, expect, test } from 'vitest';

import { escapeHtml, isMissing, josa, render } from './template.js';

/** 실패하면 그 자리에서 이름을 보여 준다 — `missing` 을 그대로 비교하는 것보다 읽기 쉽다. */
function text(tpl: string, vars: Record<string, string>): string {
  const out = render(tpl, vars);
  if (isMissing(out)) throw new Error(`없는 변수: ${out.missing.join(', ')}`);
  return out.text;
}

function missing(tpl: string, vars: Record<string, string>): string[] {
  const out = render(tpl, vars);
  return isMissing(out) ? out.missing : [];
}

describe('변수 치환', () => {
  test('점이 든 이름도 평평한 키로 찾는다', () => {
    expect(text('{{site.line}}행의 {{pick.1}}', { 'site.line': '42', 'pick.1': 'res.user' }))
      .toBe('42행의 res.user');
  });

  test('없는 변수는 빈 문자열이 아니라 missing 이다', () => {
    expect(missing('{{pick.1}} 와 {{pick.9}}', { 'pick.1': 'a' })).toEqual(['pick.9']);
  });

  test('같은 변수가 여러 번 없어도 이름은 한 번만 나온다', () => {
    expect(missing('{{ctx.x}}{{ctx.x}}', {})).toEqual(['ctx.x']);
  });

  test('빈 값은 있는 값이다 — missing 이 아니다', () => {
    expect(text('[{{hole}}]', { hole: '' })).toBe('[]');
  });
});

describe('이스케이프 경계', () => {
  test('템플릿 리터럴의 허용 태그는 그대로 두고 값만 이스케이프한다', () => {
    expect(text('<b>{{pick.1}}</b> 를 읽는다', { 'pick.1': 'a < b && c' }))
      .toBe('<b>a &lt; b &amp;&amp; c</b> 를 읽는다');
  });

  test('값에 든 태그는 태그가 되지 않는다', () => {
    expect(text('{{site.text}}', { 'site.text': '<img src=x onerror="y">' }))
      .toBe('&lt;img src=x onerror=&quot;y&quot;&gt;');
  });

  test('작은따옴표도 이스케이프한다', () => {
    expect(text('{{ctx.fallback}}', { 'ctx.fallback': "'손님'" })).toBe('&#39;손님&#39;');
  });

  test('code 필터는 감싸고 안쪽을 이스케이프한다', () => {
    expect(text('{{pick.1|code}}', { 'pick.1': 'a<b' })).toBe('<code>a&lt;b</code>');
  });

  test('escapeHtml 은 다섯 글자를 바꾼다', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('josa 필터', () => {
  test('받침이 있으면 앞 조사, 없으면 뒤 조사', () => {
    expect(text('{{x|josa:은,는}}', { x: '손님' })).toBe('은');
    expect(text('{{x|josa:은,는}}', { x: '배열' })).toBe('은');
    expect(text('{{x|josa:은,는}}', { x: '주소' })).toBe('는');
  });

  test('영문은 자음으로 끝나면 받침 있음으로 본다 (util.js 규칙)', () => {
    expect(text('{{x|josa:이,가}}', { x: 'res.user' })).toBe('이');
    expect(text('{{x|josa:이,가}}', { x: 'prev' })).toBe('이');
    expect(text('{{x|josa:이,가}}', { x: 'items' })).toBe('이');
    expect(text('{{x|josa:이,가}}', { x: 'data' })).toBe('가');
  });

  test('닫는 괄호·마침표로 끝나면 받침 없음으로 본다 (util.js 규칙)', () => {
    expect(text('{{x|josa:이,가}}', { x: 'f(x)' })).toBe('가');
  });

  test('조사만 내므로 사전의 「값 + 조사」 두 칸 표기가 겹치지 않는다', () => {
    expect(text('{{pick.1|code}}{{pick.1|josa:이,가}} 없을 때', { 'pick.1': 'res.user' }))
      .toBe('<code>res.user</code>이 없을 때');
  });

  test('필터 연쇄에서는 앞 결과 뒤에 붙는다 (D69)', () => {
    expect(text('{{pick.1|code|josa:이,가}}', { 'pick.1': 'res.user' }))
      .toBe('<code>res.user</code>이');
  });

  test('받침 판정은 이스케이프 전 원값으로 한다', () => {
    // `&#39;` 로 바꾼 뒤에 보면 마지막 글자가 `;` 이라 판정이 달라진다.
    expect(text('{{x|josa:을,를}}', { x: "'손님'" })).toBe('를');
  });

  test('josa() 는 목업 서명 그대로 값에 조사를 붙인다', () => {
    expect(josa('손님', '은', '는')).toBe('손님은');
    expect(josa('<code>주소</code>', '은', '는')).toBe('<code>주소</code>는');
  });
});

describe('섹션', () => {
  const withFallback = { 'ctx.fallback': "'손님'", 'site.line': '42' };

  test('있으면 본문, 없으면 부정 본문', () => {
    const tpl = '{{#ctx.fallback}}{{ctx.fallback|code}} 로 채운다{{/ctx.fallback}}'
      + '{{^ctx.fallback}}{{site.line}}행의 결과다{{/ctx.fallback}}';
    expect(text(tpl, withFallback)).toBe('<code>&#39;손님&#39;</code> 로 채운다');
    expect(text(tpl, { 'site.line': '42' })).toBe('42행의 결과다');
  });

  test('거짓 섹션 안의 변수는 없어도 된다', () => {
    expect(missing('{{#ctx.fallback}}{{ctx.fallback}}{{/ctx.fallback}}', {})).toEqual([]);
  });

  test('참 섹션 안의 없는 변수는 잡는다', () => {
    expect(missing('{{#other}}{{other.line}}{{/other}}', { 'other.file': 'a.ts' }))
      .toEqual(['other.line']);
  });

  test('묶음 이름은 접두어로 참을 판정한다 — {{#other}} 는 other.* 가 있으면 참', () => {
    expect(text('{{#other}}다른 자리{{/other}}', { 'other.text': 'x' })).toBe('다른 자리');
    expect(text('{{#other}}다른 자리{{/other}}', {})).toBe('');
  });

  test('빈 값은 거짓이다', () => {
    expect(text('{{#ctx.fallback}}있다{{/ctx.fallback}}', { 'ctx.fallback': '' })).toBe('');
  });

  test('짝이 안 맞는 닫힘은 글자로 남는다', () => {
    expect(text('a{{/nope}}b', {})).toBe('a{{/nope}}b');
  });
});

describe('필터 오류', () => {
  test('모르는 필터는 missing 으로 알린다', () => {
    expect(missing('{{x|upper}}', { x: 'a' })).toEqual(['|upper']);
  });
});
