import { describe, expect, test } from 'vitest';

import type { RawImport } from './derive.js';
import type { FileImports, ResolvedEdge } from './resolve-imports.js';
import { extractSchema } from './schema.js';

const DDL = 'BACK/dream_DB.sql';
const COPY = 'AI_API/example_dataset/database_sql_commands/dream_db_2025-12-24.sql';
const MAPPER = 'BACK/src/main/resources/mapper/user/UserMapper.xml';
const USER = 'BACK/src/main/java/com/a/model/entity/User.java';

const table = (name: string, line: number): RawImport => ({ specifier: name, form: 'ddl-table', line });
const column = (table: string, name: string, line: number, ctx: Record<string, string> = {}): RawImport =>
  ({ specifier: name, form: 'ddl-column', line, ctx: { table, type: 'BIGINT', ...ctx } });
const fk = (table: string, column: string, refTable: string, refColumn: string, line: number): RawImport =>
  ({ specifier: refColumn, form: 'ddl-fk', line, ctx: { table, column, ref_table: refTable } });
const binding = (column: string, property: string, line: number): RawImport =>
  ({ specifier: column, form: 'column-of', line, ctx: { type: 'com.a.model.entity.User', property, tag: 'resultMap', row: 'result' } });
const reads = (table: string, line: number): RawImport => ({ specifier: table, form: 'reads-table', line });

function ddl(path: string): FileImports {
  return { path, imports: [
    table('users', 12),
    column('users', 'user_id', 13, { notnull: 'NOT' }),
    column('users', 'login_id', 14, { type: 'VARCHAR(255)', notnull: 'NOT' }),
    column('users', 'coin', 20, { type: 'INT', notnull: 'NOT', default: '5' }),
    column('users', 'deleted_date', 25, { type: 'DATETIME' }),
    table('dreams', 39),
    column('dreams', 'dream_id', 40, { notnull: 'NOT' }),
    column('dreams', 'user_id', 41, { notnull: 'NOT' }),
    fk('dreams', 'user_id', 'users', 'user_id', 50),
  ] };
}

const mapper: FileImports = { path: MAPPER, imports: [
  binding('user_id', 'userId', 8), binding('login_id', 'loginId', 9), binding('coin', 'coin', 16),
  reads('users', 33), reads('users', 41),
] };
const edges: ResolvedEdge[] = [{ from: MAPPER, to: USER, kind: 'static', confidence: 'syntactic', line: 7 }];

describe('extractSchema (D169)', () => {
  test('표·열·기본값·외래키가 DDL 에서 선다', () => {
    const s = extractSchema([ddl(DDL)], []);
    expect(s.tables.map((t) => t.name)).toStrictEqual(['dreams', 'users']);
    const users = s.tables.find((t) => t.name === 'users');
    expect(users?.columns.map((c) => `${c.name} ${c.type} ${c.notNull ? 'NN' : '-'} ${c.default ?? '-'}`)).toStrictEqual([
      'user_id BIGINT NN -', 'login_id VARCHAR(255) NN -', 'coin INT NN 5', 'deleted_date DATETIME - -',
    ]);
    expect(s.fks).toStrictEqual([
      { table: 'dreams', column: 'user_id', refTable: 'users', refColumn: 'user_id', path: DDL, line: 50 },
    ]);
  });

  test('같은 표가 덤프 사본에도 있으면 예제·데이터셋이 아닌 짧은 경로가 정본이다', () => {
    const s = extractSchema([ddl(COPY), ddl(DDL)], []);
    expect(s.tables.map((t) => t.path)).toStrictEqual([DDL, DDL]);
    // 사본의 열이 두 번 들지 않는다.
    expect(s.tables.find((t) => t.name === 'users')?.columns).toHaveLength(4);
  });

  test('매퍼의 열 ↔ 필드가 표와 엔티티 파일에 붙는다', () => {
    const s = extractSchema([ddl(DDL), mapper], edges);
    expect(s.bindings.map((b) => `${b.column}→${b.property} ${b.table ?? '?'} ${b.entityPath ?? '?'}`)).toStrictEqual([
      // `user_id` 는 두 표에 있다 — 매퍼가 읽는 표가 `users` 하나뿐이라 그쪽에 붙는다.
      `user_id→userId users ${USER}`,
      `login_id→loginId users ${USER}`,
      `coin→coin users ${USER}`,
    ]);
  });

  test('열 이름이 여러 표에 있고 매퍼가 여러 표를 읽으면 표를 안 붙인다', () => {
    const two: FileImports = { path: MAPPER, imports: [binding('user_id', 'userId', 8), reads('users', 33), reads('dreams', 50)] };
    const s = extractSchema([ddl(DDL), two], edges);
    expect(s.bindings[0]?.table).toBeNull();
  });

  test('같은 입력에 같은 결과 — 파일 순서를 섞어도', () => {
    const a = extractSchema([ddl(DDL), mapper, ddl(COPY)], edges);
    const b = extractSchema([mapper, ddl(COPY), ddl(DDL)], edges);
    expect(b).toStrictEqual(a);
  });
});
