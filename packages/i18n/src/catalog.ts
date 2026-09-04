/**
 * 카탈로그 합치는 자리 (D117). `t()` 와 린트가 읽는 것은 여기 둘뿐이다.
 *
 * `ko.ts`·`en.ts` 는 화면이 없던 시절부터 있던 공통 문구고, 영역이 늘 때마다 그 파일을
 * 키우면 화면 하나를 만들 때마다 같은 파일에서 병합이 난다. 그래서 영역은 `ko/<영역>.ts`
 * 로 나가고 이 파일이 **한 번만** 합친다 — 키 집합의 정본은 여전히 `ko` 쪽 전부다.
 *
 * 키가 겹치면 뒤에 오는 영역이 이긴다. 겹치게 두지 않는 것이 규약이고, 겹쳤다는 것은
 * 같은 문구를 두 곳에 적었다는 뜻이라 하나로 합쳐야 한다.
 */
import { en as enBase } from './en.js';
import { enRepos } from './en/repos.js';
import { ko as koBase } from './ko.js';
import { koRepos } from './ko/repos.js';

export const ko = { ...koBase, ...koRepos };

/** 카탈로그가 가진 키 전부. `en` 은 이 중 일부만 가진다. */
export type MessageKey = keyof typeof ko;

export const en: Partial<Record<MessageKey, string>> = { ...enBase, ...enRepos };
