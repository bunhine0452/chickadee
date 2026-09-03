/**
 * 구문 강조 — 목업 `design/src/ink/util.js` 의 `hl()` 정규식을 그대로 옮긴 것 (05 §5).
 *
 * 클래스는 6종뿐이다: `k` 키워드 · `s` 문자열 · `n` 숫자 · `c` 주석 · `p` 구두점 · `f` 호출·타입.
 * 판 안에 색 **면**은 없다 — 색은 글자에만 얹는다. 강조는 판독 보조지 장식이 아니다.
 *
 * 목업과 다른 점 하나: HTML 문자열이 아니라 조각 배열을 돌려준다. 앱에서는
 * `dangerouslySetInnerHTML` 이 두 파일에만 허용되므로(D42) JSX 가 조각을 그린다 —
 * 이스케이프가 React 몫이 되어 목업의 `esc()` 호출도 함께 사라졌다.
 *
 * 1차 구현이다. 03 의 tree-sitter 캡처 이름(`keyword`·`string`·`number`·`comment`·
 * `punctuation`·`function`/`type`)이 오면 같은 6클래스로 매핑하는 `fromCaptures.ts` 가
 * 이 파일을 대신한다 (05 §5). 그때도 반환 타입은 그대로 둔다.
 */

/** 판독 보조 클래스 6종. 이 목록은 늘어나지 않는다 (05 §5). */
export type HlClass = 'k' | 's' | 'n' | 'c' | 'p' | 'f';

/** 강조 조각 하나. `cls` 가 `null` 이면 맨 글자다(식별자·공백). */
export interface HlToken {
  readonly cls: HlClass | null;
  readonly t: string;
}

/** 목업 `KW` 그대로. 언어별 확장은 `fromCaptures.ts` 의 몫이다. */
const KW =
  /^(const|let|var|function|return|if|else|await|async|export|import|from|type|new|typeof|null|undefined|true|false|as|for|of|in|while|class|extends|interface|default|throw|try|catch|switch|case|break)$/;

/**
 * 목업 `TOKRE` 그대로 — 주석 · 문자열 · 숫자 · 식별자 · 공백 · 그 밖의 한 글자.
 * `m` 플래그가 없는 것도 그대로다: 판은 한 줄씩 들어오므로 `//.*$` 의 `$` 는 줄 끝이다.
 */
const TOKRE =
  /(\/\/.*$)|(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d])/;

/** 식별자 뒤에 여는 괄호가 붙으면 호출이다. 목업의 `nxt` 선행 탐색. */
const NEXT_NON_SPACE = /^\s*(\S)/;

/**
 * 코드 한 줄을 강조 조각으로 쪼갠다.
 *
 * 정규식 인스턴스를 호출마다 새로 만든다 — 모듈 전역 정규식의 `lastIndex` 는 상태이고,
 * 목업은 매번 `TOKRE.lastIndex = 0` 으로 지웠다. 판이 여러 장 동시에 그려지는 앱에서는
 * 그 지우기가 경합한다.
 */
export function hl(src: string): HlToken[] {
  const re = new RegExp(TOKRE.source, 'g');
  const out: HlToken[] = [];
  let prev = '';

  let m = re.exec(src);
  while (m !== null) {
    const s = m[0];
    if (m[1] !== undefined) out.push({ cls: 'c', t: s });
    else if (m[2] !== undefined) out.push({ cls: 's', t: s });
    else if (m[3] !== undefined) out.push({ cls: 'n', t: s });
    else if (m[4] !== undefined) {
      const nxt = NEXT_NON_SPACE.exec(src.slice(re.lastIndex));
      if (KW.test(s)) out.push({ cls: 'k', t: s });
      else if (prev === '<' || prev === '</' || nxt?.[1] === '(') out.push({ cls: 'f', t: s });
      else out.push({ cls: null, t: s });
    } else if (m[5] !== undefined) out.push({ cls: null, t: s });
    else out.push({ cls: 'p', t: s });

    // 공백은 앞 글자 기억을 지우지 않는다 — `< Foo` 도 태그다 (목업 그대로).
    if (m[5] === undefined) prev = prev === '<' && s === '/' ? '</' : s;
    m = re.exec(src);
  }
  return out;
}
