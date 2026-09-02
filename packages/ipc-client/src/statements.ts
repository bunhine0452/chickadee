/**
 * `ipc.store.query/exec` 의 이름·파라미터·행 타입 표.
 *
 * 여기는 **비어 있다.** `@chickadee/store-sql` 이 생성한 `catalog.ts` 가 선언 병합으로 채운다.
 * 왜 이렇게: 01 §3.5 는 `StatementMap` 을 이 클라이언트가 쓰길 요구하고, 01 §2 의 의존 방향은
 * `store-sql → ipc-client` 다. 여기서 store-sql 을 import 하면 순환이 되므로 방향을 뒤집지 않고
 * 병합으로 채운다 — store-sql 을 한 번이라도 import 한 프로젝트에서는 이름·타입이 전부 살아난다.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StatementMap {}

export type StatementName = keyof StatementMap & string;
export type ParamsOf<K extends StatementName> = StatementMap[K] extends { params: infer P } ? P : never;
export type RowOf<K extends StatementName> = StatementMap[K] extends { row: infer R } ? R : never;

export interface BatchOp { name: StatementName; params: unknown }
