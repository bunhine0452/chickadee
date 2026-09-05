/**
 * 데이터베이스 스키마 (D169). 「이 데이터베이스의 스키마는 어떻게 설계되어 있는가」의 재료.
 *
 * 표·열·외래키는 `.sql` 의 DDL 에서, 열 ↔ 자바 필드는 매퍼 XML 의 `<resultMap>` 에서 온다.
 * 둘을 잇는 코드는 리포에 없다 — 이음매는 또 이름이다: `column="login_id"` 는 `users.login_id`
 * 이고 `property="loginId"` 는 `User.loginId` 다. 그래서 3단 `origin`(「이 값은 어디서 처음
 * 정해지나」)이 매퍼 `column` → 표 열 → 기본값까지 내려갈 수 있다.
 *
 * 재료는 `_imports` 캡처다 (`sql/_imports.scm` · `mybatis/_imports.scm`). 순수 함수 (04 §9).
 */
import type { FileImports, ResolvedEdge } from './resolve-imports.js';

export interface SchemaColumn {
  name: string;
  /** DDL 에 적힌 그대로 — `BIGINT`·`VARCHAR(255)`. */
  type: string;
  notNull: boolean;
  /** `DEFAULT 5` 의 `5`. 없으면 `null`. */
  default: string | null;
  line: number;
}

export interface SchemaTable {
  name: string;
  /** DDL 이 있는 파일. 사본이 여럿이면 하나만 고른다 (`pickSource`). */
  path: string;
  line: number;
  columns: SchemaColumn[];
}

export interface SchemaFk {
  table: string;
  column: string;
  refTable: string;
  refColumn: string;
  path: string;
  line: number;
}

/** 매퍼의 `<result property="loginId" column="login_id"/>` 한 줄. */
export interface ColumnBinding {
  /** 매퍼 파일. */
  path: string;
  line: number;
  column: string;
  property: string;
  /** `<resultMap type="…">` 의 값 — 엔티티의 FQCN. */
  entity: string;
  /** 그 엔티티 파일. 파일 간선(`type` 속성, D159)이 이미 풀어 두었다. */
  entityPath: string | null;
  /** 이 열이 속한 표. 열 이름이 한 표에만 있거나 매퍼가 표 하나만 읽을 때 붙는다. */
  table: string | null;
}

export interface Schema {
  /** 이름 오름차순. */
  tables: SchemaTable[];
  fks: SchemaFk[];
  bindings: ColumnBinding[];
}

const cmp = (a: string, b: string): number => (a < b ? -1 : Number(a > b));

/**
 * 같은 표가 여러 파일에 있을 때 — 덤프 사본·예제 데이터셋 — 어느 것이 정본인가.
 * `example`·`test`·`dataset`·`sample` 을 안 낀 것이 먼저고, 그다음 짧은 경로, 그다음 사전순.
 */
function rank(path: string): [number, number, string] {
  return [/example|test|dataset|sample|backup|dump/i.test(path) ? 1 : 0, path.length, path];
}
const byRank = (a: string, b: string): number => {
  const [x, y] = [rank(a), rank(b)];
  return x[0] - y[0] || x[1] - y[1] || cmp(x[2], y[2]);
};

export function extractSchema(files: readonly FileImports[], edges: readonly ResolvedEdge[]): Schema {
  // 표 이름 → 그 표를 선언한 파일들.
  const decl = new Map<string, { path: string; line: number }[]>();
  for (const f of files) {
    for (const raw of f.imports) {
      if (raw.form !== 'ddl-table') continue;
      decl.set(raw.specifier, [...(decl.get(raw.specifier) ?? []), { path: f.path, line: raw.line }]);
    }
  }
  const source = new Map<string, { path: string; line: number }>();
  for (const [name, at] of decl) {
    const best = [...at].sort((a, b) => byRank(a.path, b.path) || a.line - b.line)[0];
    if (best !== undefined) source.set(name, best);
  }

  const tables = new Map<string, SchemaTable>();
  for (const [name, at] of source) tables.set(name, { name, path: at.path, line: at.line, columns: [] });
  const fks: SchemaFk[] = [];
  for (const f of files) {
    for (const raw of f.imports) {
      if (raw.form === 'ddl-column') {
        const table = raw.ctx?.['table'];
        const at = table === undefined ? undefined : source.get(table);
        if (table === undefined || at === undefined || at.path !== f.path) continue;
        (tables.get(table) as SchemaTable).columns.push({
          name: raw.specifier,
          type: raw.ctx?.['type'] ?? '',
          notNull: raw.ctx?.['notnull'] !== undefined,
          default: raw.ctx?.['default'] ?? null,
          line: raw.line,
        });
      } else if (raw.form === 'ddl-fk') {
        const table = raw.ctx?.['table'];
        const at = table === undefined ? undefined : source.get(table);
        if (table === undefined || at === undefined || at.path !== f.path) continue;
        fks.push({
          table,
          column: raw.ctx?.['column'] ?? '',
          refTable: raw.ctx?.['ref_table'] ?? '',
          refColumn: raw.specifier,
          path: f.path,
          line: raw.line,
        });
      }
    }
  }
  for (const t of tables.values()) {
    t.columns.sort((a, b) => a.line - b.line || cmp(a.name, b.name));
    // 같은 열이 두 번 잡히면(`DEFAULT` 유무로 매치가 갈린 경우) 정보가 많은 쪽 하나만 남긴다.
    const seen = new Map<string, SchemaColumn>();
    for (const c of t.columns) {
      const held = seen.get(c.name);
      if (held === undefined || (held.default === null && c.default !== null) || (!held.notNull && c.notNull)) seen.set(c.name, c);
    }
    t.columns = [...seen.values()].sort((a, b) => a.line - b.line);
  }

  // 열 이름 → 그 열을 가진 표들. 유일하면 매퍼의 열에 표를 붙일 수 있다.
  const tablesOf = new Map<string, string[]>();
  for (const t of tables.values()) {
    for (const c of t.columns) tablesOf.set(c.name, [...(tablesOf.get(c.name) ?? []), t.name]);
  }
  // 매퍼 파일 → 그 SQL 이 읽는 표들 (`reads-table`). 표 하나뿐이면 그 표다.
  const readsOf = new Map<string, Set<string>>();
  for (const f of files) {
    for (const raw of f.imports) {
      if (raw.form !== 'reads-table') continue;
      const at = readsOf.get(f.path) ?? new Set<string>();
      at.add(raw.specifier);
      readsOf.set(f.path, at);
    }
  }
  // 엔티티 FQCN → 파일. 매퍼의 `type` 속성 간선이 이미 있다 — `…entity.User` 는 `…/entity/User.java`.
  const entityPath = (from: string, fqcn: string): string | null => {
    const tail = `/${fqcn.replace(/\./g, '/')}.java`;
    const hit = edges.filter((e) => e.from === from && e.to.endsWith(tail)).map((e) => e.to).sort(cmp);
    return hit[0] ?? null;
  };

  const bindings: ColumnBinding[] = [];
  for (const f of files) {
    for (const raw of f.imports) {
      if (raw.form !== 'column-of') continue;
      const entity = raw.ctx?.['type'] ?? '';
      const owners = tablesOf.get(raw.specifier) ?? [];
      const reads = readsOf.get(f.path) ?? new Set<string>();
      const table = owners.length === 1
        ? (owners[0] as string)
        : reads.size === 1 && owners.includes([...reads][0] as string)
          ? ([...reads][0] as string)
          : null;
      bindings.push({
        path: f.path, line: raw.line, column: raw.specifier, property: raw.ctx?.['property'] ?? '',
        entity, entityPath: entity === '' ? null : entityPath(f.path, entity), table,
      });
    }
  }

  return {
    tables: [...tables.values()].sort((a, b) => cmp(a.name, b.name)),
    fks: fks.sort((a, b) => cmp(a.table, b.table) || a.line - b.line || cmp(a.column, b.column)),
    bindings: bindings.sort((a, b) => cmp(a.path, b.path) || a.line - b.line || cmp(a.column, b.column)),
  };
}
