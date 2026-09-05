/**
 * 「먼저 읽기」 — **그 개념을 처음 만나는 판**에만 얹는 사전 1층 (D138 · D150 · 정본 §4).
 *
 * 그 언어가 처음이면 읽을 것을 얻으려고 **먼저 막혀야** 한다. 사전 3층은 사다리 안에만
 * 있고 사다리는 「모르겠어요」로만 열리기 때문이다. 0장 대지의 판에 한해 그 순서를 뒤집는다.
 *
 * **전역으로 켜지 않는 이유**는 정본 §1 이다 — 「가치는 설명이 아니라 강제된 능동 출력이다.
 * 설명은 이미 Claude Code 가 한다.」 문제 앞에 설명을 놓으면 T0 가 읽기 확인 문제가 된다.
 * **D150 이 그 예외의 선을 다시 그었다.** 처음에는 「0장 소속」이었는데, 그러면 0장을 마치는
 * 순간 읽을 것이 사라진다 — 개념이 어려워지는 바로 그 지점에서. 정확히는 사라지는 것이
 * 아니라 **값이 붙는다**: 사다리는 밖에서도 열리지만 「모르겠어요」가 `layer − 1` 이다
 * (`packages/scheduler/src/reducer.ts`). 절벽의 정체는 정보 소멸이 아니라 가격 변화다.
 *
 * 그래서 선을 **「그 개념의 겹이 0」**으로 옮겼다. 학습과학이 이 선을 그어 준다 — 완성된
 * 풀이를 먼저 보는 것은 **초보에게 이롭고 숙련자에게는 역전되어 해롭다.** 겹이 숙련도의
 * 대리 지표이고, 「개념당 평생 한 번」이 곧 문헌이 권하는 페이딩이다. 정본 §1 의 문장은
 * 숙련자 기준으로 옳으므로 이 선과 충돌하지 않는다.
 *
 * 여전히 **유한하다** — 상한이 사전 크기이고 개념마다 한 번뿐이다.
 */
import { ipc } from '@chickadee/ipc-client';
import { revealsToken } from '@chickadee/dictionary';
import type { CardPayload } from '@chickadee/store-sql';

type T0Payload = Extract<CardPayload, { track: 't0' }>;

/**
 * **아직 한 겹도 안 올린 개념**의 집합 (D150). 이 집합에 든 개념의 판에만 한 줄을 편다.
 *
 * `queue.known_rows` 를 그대로 쓴다 — 그 문장이 이미 `COALESCE(m.layer, 0)` 으로 개념 전량의
 * 겹을 주므로 새 statement 가 필요 없다. `packages/concepts` 의 `knownSet` 이 「겹 ≥ 1 이면
 * 아는 것」으로 세는 것과 **같은 선**이다. 두 곳이 어긋나면 「처음 만난다」의 뜻이 갈린다.
 *
 * 세션을 열 때 한 번만 부른다. 겹은 하루에 최대 +1 이라(D3) 세션 도중 이 집합이 바뀌어도
 * 그 판은 이미 첫 만남이었다 — 판정 시점을 세션 머리로 고정하는 편이 맞다.
 */
export async function loadFirstMeetingConcepts(): Promise<Set<string>> {
  const rows = await ipc.store.query('queue.known_rows', {});
  return new Set(rows.filter((r) => r.layer === 0).map((r) => r.id));
}

/** 이 판의 정답 글자. 지목형은 코드 줄의 조각에서, 나머지는 보기에서 나온다. */
export function answerText(payload: T0Payload): string | null {
  if (payload.kind !== 'point') return payload.options?.[payload.answer]?.t ?? null;
  const want = payload.answer + 1;
  for (const line of payload.lines) {
    if (!('seg' in line)) continue;
    for (const seg of line.seg) {
      if ('t' in seg && seg.pick === want) return seg.t;
    }
  }
  return null;
}

/**
 * 이 한 줄이 정답을 내주나. **판정은 사전 린트의 것을 그대로 쓴다**(`revealsToken`) —
 * 규칙이 둘이면 `dict:lint` 가 「샌다」고 세는 문장을 화면이 그대로 펴는 일이 생긴다.
 *
 * 그 함수가 이미 오탐 둘을 막아 둔다: 태그를 걷고, 문장 끝 마침표·쉼표를 토큰으로 세지
 * 않으며(`.` 이 정답인 개념이 영영 못 지나가는 것을 막는다), 식별자는 낱말 경계로 본다
 * (`prev` 가 `previous` 안에서 걸리지 않는다).
 *
 * 처음에는 여기서 「낱말 정답만 누설」이라는 느슨한 규칙을 따로 뒀다 — `a.b` 를 읽어도
 * `user.profile.nickname` 의 어느 점인지는 스스로 찾아야 한다는 판단이었다. 그 판단 자체는
 * 여전히 말이 되지만, **규칙을 하나로 두는 편이 낫다**: 느슨한 쪽을 고르면 린트가 부채로
 * 세는 두 사전(`ts/property-access` · `ts/nullish-coalescing`)을 화면은 그냥 펴게 된다.
 * 엄격한 쪽을 고르면 그 둘의 한 줄이 고쳐질 때까지 0장 판 중 그 둘만 안 열린다.
 */
export function leaksAnswer(oneLiner: string, answer: string | null): boolean {
  return answer !== null && revealsToken(oneLiner, answer);
}

/**
 * 이 판 위에 펼 사전 한 줄. 셋 다 참이어야 나온다 —
 * ① 그 개념의 겹이 0(처음 만난다)이고 ② 사전 1층이 있고 ③ 그 한 줄이 정답을 누설하지 않는다.
 *
 * ③에 걸리면 조용히 아무것도 안 낸다. 사전을 고치는 것이 진짜 해결이고(그 부채는
 * `dict:lint` 가 센다), 이 함수는 고쳐지기 전까지 판이 망가지지 않게 막는 자리다.
 */
export function readFirstText(
  payload: T0Payload,
  conceptId: string,
  firstMeeting: ReadonlySet<string>,
): string | null {
  if (!firstMeeting.has(conceptId)) return null;
  const first = payload.dict?.[0];
  if (first === undefined || !('t' in first)) return null;
  return leaksAnswer(first.t, answerText(payload)) ? null : first.t;
}
