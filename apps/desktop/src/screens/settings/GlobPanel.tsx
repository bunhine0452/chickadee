/**
 * 제외 글롭 편집 (05 §2.1 · D122).
 *
 * 한 줄에 하나이고 기본 목록에 **더해진다**. 저장은 포커스를 뗄 때 한 번이다 — 다른 칸은
 * 글자마다 내려가지만(「저장」 버튼 없음, 05 §2.1) 여러 줄 상자에 그 규약을 그대로 걸면
 * 타자마다 원장에 쓰게 된다.
 *
 * 문제가 있는 줄은 **막지 않고 말한다.** 검사기는 `ignore` 크레이트의 파서가 아니라
 * 「조용히 반대로 도는 네 가지」만 보는 것이라, 통과를 조건으로 걸면 정당한 글롭이 걸릴 때
 * 사용자가 빠져나갈 길이 없다. 대신 문제 있는 줄은 저장에서 뺀다.
 */
import { globProblem, parseGlobs, type GlobProblem } from '@chickadee/concepts';
import { t, type MessageKey } from '@chickadee/i18n';
import { useEffect, useState } from 'react';

export interface GlobPanelProps {
  value: readonly string[];
  onChange: (next: string[]) => void;
}

const ERROR_KEY: Record<GlobProblem, MessageKey> = {
  negation: 'settings.globs.errNegation',
  backslash: 'settings.globs.errBackslash',
  absolute: 'settings.globs.errAbsolute',
  unbalanced: 'settings.globs.errUnbalanced',
};

export function GlobPanel({ value, onChange }: GlobPanelProps) {
  const [text, setText] = useState(value.join('\n'));

  // 원장에서 늦게 온 값으로 상자를 채운다. 사용자가 타자를 시작한 뒤에는 덮지 않는다 —
  // 화면이 뜨자마자 읽기가 끝나므로 실제로는 첫 한 번뿐이다.
  useEffect(() => setText(value.join('\n')), [value]);

  const lines = parseGlobs(text);
  const problems = lines
    .map((line) => ({ line, problem: globProblem(line) }))
    .filter((r): r is { line: string; problem: GlobProblem } => r.problem !== null);

  const commit = (): void => {
    const clean = lines.filter((l) => globProblem(l) === null);
    if (clean.join('\n') !== value.join('\n')) onChange(clean);
  };

  return (
    <div className="globs">
      <textarea
        className="globs-in"
        rows={4}
        spellCheck={false}
        aria-label={t('settings.globs.label')}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onBlur={commit}
      />
      {problems.map(({ line, problem }) => (
        <p key={line} className="set-note ident-err">{t(ERROR_KEY[problem], { line })}</p>
      ))}
      <p className="set-note">{t('settings.globs.reingest')}</p>
    </div>
  );
}
