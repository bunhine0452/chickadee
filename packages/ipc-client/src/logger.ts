/**
 * 로그 안전 래퍼 (01 §6 · 06 §1.3 Q8). 금지 필드를 **넣을 수 없게** 만드는 것이 목적이다 —
 * 「조심하자」는 합의는 6주 안에 무너지고, 그때 새는 것이 사용자의 코드다.
 *
 * 금지: 파일 내용 · 코드 조각 · 캡처 excerpt · 사용자 답안 · 「왜」 문장 · LLM 프롬프트 · 절대 경로.
 * 허용: `repoId`, 리포 상대 경로, 개수, 소요 ms, 오류 코드, 커밋 해시.
 *
 * 이 파일이 프로젝트에서 `console` 을 쓰는 유일한 자리다 — ESLint `no-console` 이 나머지를 막는다.
 */

export type Level = 'debug' | 'info' | 'warn' | 'error';

/** 로그 한 줄. 값은 원시형만 — 객체를 통째로 넘기면 무엇이 들었는지 아무도 모른다. */
export type Fields = Record<string, string | number | boolean | null | undefined>;

/**
 * 이름만으로 거른다. 무엇을 담았든 이 이름이면 나가지 않는다.
 *
 * `code` 는 **소스 코드 조각**을 막으려는 것이다. 01 §6 이 허용한 「오류 코드」는 이 이름과
 * 부딪히므로 **`errorCode`** 로 적는다 — M2 에서 인제스트 실패를 쫓다가 로그에 남은 것이
 * `[redacted]` 뿐이라 원인을 못 본 적이 있다 (D79).
 */
const FORBIDDEN_KEYS = [
  'text', 'code', 'excerpt', 'content', 'source', 'snippet', 'answer', 'why',
  'prompt', 'body', 'lines', 'bytes', 'value', 'query', 'sql', 'scm',
];

/** 유닉스 절대 경로 · 윈도 드라이브 · `file://`. 리포 상대 경로만 남긴다. */
const ABSOLUTE = /(^|[\s"'(])(\/[^\s"')]+|[A-Za-z]:[\\/][^\s"')]+|file:\/\/\S+)/g;

export const REDACTED = '[redacted]';

/** 절대 경로를 마지막 두 조각으로 줄인다 — 어느 파일인지는 남고 어디 사는지는 지운다. */
export function scrub(text: string): string {
  return text.replace(ABSOLUTE, (_, lead: string, path: string) => {
    const parts = path.replace(/^file:\/\//, '').split(/[\\/]/).filter(Boolean);
    return `${lead}…/${parts.slice(-2).join('/')}`;
  });
}

/** 금지 이름을 지우고, 남은 문자열에서 절대 경로를 줄인다. */
export function safeFields(fields: Fields): Fields {
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (FORBIDDEN_KEYS.includes(key.toLowerCase())) {
      out[key] = REDACTED;
      continue;
    }
    out[key] = typeof value === 'string' ? scrub(value) : value;
  }
  return out;
}

export interface Sink {
  (level: Level, message: string, fields: Fields): void;
}

/* eslint-disable no-console -- 이 파일이 유일한 콘솔 출구다 (06 §1.3). */
const CONSOLE: Sink = (level, message, fields) => {
  const line = { level, message, ...fields };
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
};
/* eslint-enable no-console */

let sink: Sink = CONSOLE;
let threshold: Level = 'info';
const ORDER: Level[] = ['debug', 'info', 'warn', 'error'];

/** 테스트와 파일 전송(M5 의 `tauri-plugin-log`)이 갈아 끼우는 자리. */
export function setSink(next: Sink | null, level: Level = 'info'): void {
  sink = next ?? CONSOLE;
  threshold = level;
}

function emit(level: Level, message: string, fields: Fields = {}): void {
  if (ORDER.indexOf(level) < ORDER.indexOf(threshold)) return;
  sink(level, scrub(message), safeFields(fields));
}

export const log = {
  debug: (message: string, fields?: Fields) => emit('debug', message, fields),
  info: (message: string, fields?: Fields) => emit('info', message, fields),
  warn: (message: string, fields?: Fields) => emit('warn', message, fields),
  error: (message: string, fields?: Fields) => emit('error', message, fields),
} as const;
