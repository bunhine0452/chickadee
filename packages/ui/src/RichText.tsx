import DOMPurify from 'dompurify';

/**
 * 문법 사전(커뮤니티 기여 데이터)의 카드 문구를 그리는 유일한 지점.
 * 06 §4.2 · 00 D42 — 이 파일과 `components/dee/DeeSprite.tsx` 만
 * `dangerouslySetInnerHTML` 을 쓸 수 있다.
 */

/** 06 §4.2 가 정한 허용 태그 6개. 이 목록은 넓히지 않는다. */
export const RICH_TEXT_ALLOWED_TAGS = ['code', 'b', 'i', 'em', 'br', 'kbd'] as const;

/** 사용자 코드 발췌는 항상 텍스트 노드다 — 속성은 하나도 통과시키지 않는다. */
export const RICH_TEXT_ALLOWED_ATTR: readonly string[] = [];

/** 허용 태그만 남기고 나머지를 지운다. 렌더 없이 문자열만 필요할 때 쓴다. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...RICH_TEXT_ALLOWED_TAGS],
    ALLOWED_ATTR: [...RICH_TEXT_ALLOWED_ATTR],
  });
}

export interface RichTextProps {
  /** 사전에서 온 원문. 반드시 이 컴포넌트를 거쳐야 화면에 닿는다. */
  html: string;
  as?: 'span' | 'p' | 'div' | undefined;
  className?: string | undefined;
}

/** 정화한 서식 글. */
export function RichText({ html, as = 'span', className }: RichTextProps) {
  const clean = sanitizeRichText(html);
  const props = { className, dangerouslySetInnerHTML: { __html: clean } };
  if (as === 'p') return <p {...props} />;
  if (as === 'div') return <div {...props} />;
  return <span {...props} />;
}
