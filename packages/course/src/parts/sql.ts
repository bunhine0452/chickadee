/**
 * SQL 의 부 배치 (D190). 정본은 `docs/curriculum/sql.md` §0.2(0부) · §2(1부) · §3·§4(2부) 다.
 *
 * 열 중 유일한 선언형이라 0부가 「값 하나」가 아니라 「표 하나」다(README §8 「SQL 은 이 축을 안 쓴다」).
 * 3부는 없다 — SQL 에는 프레임워크 사전이 없고, 매퍼 XML 안의 SQL 은 같은 문법을 `mybatis_sql`
 * 키로 문 본문에만 돌리는 것이라 별도 네임스페이스가 아니다(`dictionary/sql/_lang.yaml`).
 *
 * §4 의 심화 여덟 중 `sql/normalization` 하나가 빠졌다 — 표를 나누는 일에 구문이 없어 캡처
 * 쿼리를 쓸 수 없고, `sql/` 은 쿼리 없는 개념을 못 든다(`schema.ts` 의 `COMPUTED_NAMESPACES`).
 */
import type { PartAssignment } from '../curriculum.js';

export const SQL_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「값 하나가 아니라 표 하나」 여덟 (sql.md §0.2)
    part: 0,
    concepts: [
      'sql/row-and-set',
      'sql/column-type',
      'sql/value-and-name',
      'sql/null-unknown',
      'sql/three-valued-comparison',
      'sql/implicit-cast',
      'sql/expression-per-row',
      'sql/clause-order',
    ],
  },
  {
    // 1부 「절을 읽기」 — 바닥 여덟 (sql.md §2)
    part: 1,
    concepts: [
      'sql/text-literal',
      'sql/from-table',
      'sql/select-list',
      'sql/comparison',
      'sql/where-filter',
      'sql/null-check',
      'sql/order-by',
      'sql/update-set',
    ],
  },
  {
    // 2부 「중심 열여섯 + 심화」 (sql.md §3·§4)
    part: 2,
    concepts: [
      'sql/insert-row',
      'sql/delete-row',
      'sql/named-param',
      'sql/qualified-column',
      'sql/arithmetic',
      'sql/case-when',
      'sql/join-inner',
      'sql/join-left',
      'sql/aggregate',
      'sql/group-by',
      'sql/having',
      'sql/subquery',
      'sql/exists',
      'sql/limit-offset',
      'sql/coalesce',
      'sql/on-conflict',
      'sql/self-join',
      'sql/cte',
      'sql/window-function',
      'sql/transaction',
      'sql/index',
      'sql/foreign-key',
      'sql/constraint-check',
      'sql/query-plan',
    ],
  },
  {
    // 3부 — 없다. 프레임워크 사전이 없다.
    part: 3,
    concepts: [],
  },
];
