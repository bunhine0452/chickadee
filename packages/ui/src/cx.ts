/** 클래스명 이어붙이기. 목업 클래스명을 그대로 쓰므로 해시·변형은 하지 않는다 (05 §1.1). */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
