import { migrations, statements, REQUIRED_BY_RUST, type StatementName } from './catalog.js';

export { migrations, statements, REQUIRED_BY_RUST };
export type { StatementName };

/**
 * `store_open` 에 넘기는 카탈로그. 프로세스당 1회만 열 수 있으므로(01 §3.2)
 * 이 객체가 그 프로세스에서 실행 가능한 SQL 의 전부다 — 카탈로그 밖 SQL 은 어떤 명령으로도 못 돈다.
 */
export function catalog(): { statements: Record<string, string>; migrations: readonly { version: number; sql: string }[] } {
  return { statements: { ...statements }, migrations };
}

/** 마이그레이션이 세우는 최종 스키마 번호. `store_info().userVersion` 과 같아야 한다. */
export const SCHEMA_VERSION: number = migrations[migrations.length - 1]?.version ?? 0;

// 02 §8 층 — 타입(§8.2) · zod 스키마 · 행 변환기 · 트랜잭션 빌더.
export type * from './types.js';
export * from './errors.js';
export * from './schemas.js';
export * from './rows.js';
export * from './tx.js';
