/**
 * statements/*.sql 과 migrations/*.sql 을 읽어 `packages/store-sql/src/catalog.ts` 를 만든다.
 *
 * 왜 생성인가 (01 §3.5): 스키마·SQL·행 타입이 한 패키지에서 같이 바뀌고 Rust 는 한 줄도 손대지 않는다.
 * 손으로 쓴 타입은 SQL 이 바뀌어도 조용히 낡는다 — 머리 주석이 곧 타입이라 같이 바뀔 수밖에 없게 만든다.
 *
 * statement 파일 규약:
 *   -- @name   <카탈로그 이름>            (필수, 다음 @name 까지가 한 statement)
 *   -- @params { … }                      (필수, TS 타입 리터럴 그대로)
 *   -- @row    { … } | void               (필수, void = 행을 돌려주지 않음)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PKG = join(ROOT, 'packages/store-sql');

interface Stmt { name: string; params: string; row: string; sql: string; file: string }

function parseStatements(text: string, file: string): Stmt[] {
  const out: Stmt[] = [];
  // @name 마다 자른다. 첫 조각(파일 머리말)은 버린다.
  const chunks = text.split(/^--\s*@name\s+/m).slice(1);
  for (const chunk of chunks) {
    const nl = chunk.indexOf('\n');
    const name = chunk.slice(0, nl).trim();
    const body = chunk.slice(nl + 1);
    const params = /^--\s*@params\s+(.+)$/m.exec(body)?.[1]?.trim();
    const row = /^--\s*@row\s+(.+)$/m.exec(body)?.[1]?.trim();
    if (!params) throw new Error(`${file}: '${name}' 에 -- @params 가 없다`);
    if (!row) throw new Error(`${file}: '${name}' 에 -- @row 가 없다`);
    const sql = body
      .split('\n')
      .filter((l) => !/^--\s*@(params|row)\b/.test(l))
      .join('\n')
      .trim();
    if (!sql) throw new Error(`${file}: '${name}' 에 SQL 이 없다`);
    if (!/^[a-z][a-z0-9]*\.[a-z][a-z0-9_]*$/.test(name)) {
      throw new Error(`${file}: 이름 '${name}' 은 '<group>.<snake_case>' 형태여야 한다`);
    }
    out.push({ name, params, row, sql, file });
  }
  return out;
}

const stmts: Stmt[] = [];
const seen = new Map<string, string>();
for (const f of readdirSync(join(PKG, 'statements')).filter((f) => f.endsWith('.sql')).sort()) {
  for (const s of parseStatements(readFileSync(join(PKG, 'statements', f), 'utf8'), f)) {
    const prev = seen.get(s.name);
    if (prev) throw new Error(`중복된 statement 이름 '${s.name}' (${prev}, ${f})`);
    seen.set(s.name, f);
    stmts.push(s);
  }
}
stmts.sort((a, b) => a.name.localeCompare(b.name));

const migrations = readdirSync(join(PKG, 'migrations'))
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort()
  .map((f) => ({ version: Number(basename(f).slice(0, 4)), file: f, sql: readFileSync(join(PKG, 'migrations', f), 'utf8') }));
if (migrations.length === 0) throw new Error('마이그레이션이 하나도 없다');
migrations.forEach((m, i) => {
  if (m.version !== i + 1) throw new Error(`마이그레이션 번호가 1부터 연속이 아니다: ${m.file}`);
});

// Rust 가 기동 시 요구하는 이름 (01 §3.3 · D65). 하나라도 없으면 앱이 STORE_CATALOG_MISSING 으로 죽는다.
// `repo.*` 는 여기 없다 — 리포 장부는 TS 가 조립한다.
const REQUIRED_BY_RUST = [
  'facts.file_upsert', 'facts.file_hashes', 'facts.file_mark_deleted',
  'facts.capture_delete_by_file', 'facts.capture_insert',
  'facts.commit_insert', 'facts.commit_file_insert', 'facts.commit_mark_unreachable',
  'facts.run_start', 'facts.run_finish',
];
const missing = REQUIRED_BY_RUST.filter((n) => !seen.has(n));
if (missing.length) throw new Error(`Rust 가 요구하는 statement 가 없다: ${missing.join(', ')}`);

const q = (s: string) => JSON.stringify(s);
const out = `// 생성 파일 — 고치지 말 것. \`pnpm catalog:build\` 가 다시 만든다.
// 출처: packages/store-sql/{statements,migrations}/*.sql
/* eslint-disable */

export const migrations = [
${migrations.map((m) => `  { version: ${m.version}, sql: ${q(m.sql)} },`).join('\n')}
] as const;

export const statements = {
${stmts.map((s) => `  ${q(s.name)}: ${q(s.sql)},`).join('\n')}
} as const;

export type StatementName = keyof typeof statements;

/** Rust 가 기동 시 반드시 찾는 이름 (01 §3.3). 테스트가 이 목록을 카탈로그와 대조한다. */
export const REQUIRED_BY_RUST = ${JSON.stringify(REQUIRED_BY_RUST, null, 2).replace(/\n/g, '\n')} as const;

// 선언 병합은 대상 모듈이 프로그램 안에 있을 때만 성립한다 — 타입 전용 import 로 끌어온다(런타임엔 지워진다).
import type {} from '@chickadee/ipc-client';

// \`ipc.store.query/exec\` 의 이름·파라미터·행 타입. ipc-client 의 빈 StatementMap 을 여기서 채운다
// (선언 병합 — 01 §2 의 의존 방향 \`store-sql → ipc-client\` 를 순환 없이 지킨다).
declare module '@chickadee/ipc-client' {
  interface StatementMap {
${stmts.map((s) => `    ${q(s.name)}: { params: ${s.params}; row: ${s.row === 'void' ? 'never' : s.row} };`).join('\n')}
  }
}
`;
writeFileSync(join(PKG, 'src/catalog.ts'), out);
console.log(`catalog: statement ${stmts.length}개, 마이그레이션 ${migrations.length}개 → packages/store-sql/src/catalog.ts`);
