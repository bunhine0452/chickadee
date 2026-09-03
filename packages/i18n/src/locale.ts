/**
 * 로케일 축 (D117). `ko` 가 정본이고 `en` 은 병기다.
 *
 * 정본이 `ko` 라는 말은 두 가지다 — 키 집합을 `ko` 카탈로그가 정하고(`en` 은 `Partial`),
 * 없는 키는 `ko` 로 폴백해 화면에 빈 자리를 내지 않는다.
 */
export type Locale = 'ko' | 'en';

export const LOCALES: readonly Locale[] = ['ko', 'en'];

export const isLocale = (v: unknown): v is Locale =>
  v === 'ko' || v === 'en';

/**
 * 첫 실행 기본값 추정. `navigator.language` 가 한국어면 `ko`, 그 밖은 전부 `en`.
 *
 * 추정일 뿐이고 첫 실행 0단계가 사용자에게 다시 묻는다 — 여기서 틀려도 화면 한 번의
 * 차이지 저장된 값이 되지 않는다.
 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ko';
  return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
