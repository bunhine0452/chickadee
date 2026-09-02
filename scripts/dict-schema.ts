/**
 * `dictionary/schema/concept.schema.json` 을 zod 에서 생성한다 (D69).
 * 기여자가 읽는 계약은 JSON Schema 지만 사람이 두 벌을 맞추지는 않는다.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { zodToJsonSchema } from 'zod-to-json-schema';

import { conceptSchema, langMetaSchema } from '../packages/dictionary/src/schema.js';

const ROOT = new URL('..', import.meta.url).pathname;

export function build(): string {
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://chickadee.dev/schema/concept.schema.json',
    title: 'Chickadee grammar dictionary',
    description:
      'Generated from packages/dictionary/src/schema.ts — do not edit by hand (D69). '
      + 'Run `pnpm dict:schema` after changing the zod schema.',
    $defs: {
      concept: zodToJsonSchema(conceptSchema, { target: 'jsonSchema2019-09' }),
      lang: zodToJsonSchema(langMetaSchema, { target: 'jsonSchema2019-09' }),
    },
  };
  return `${JSON.stringify(schema, null, 2)}\n`;
}

export const OUT = join(ROOT, 'dictionary/schema/concept.schema.json');

if (process.argv[1]?.endsWith('dict-schema.ts')) {
  writeFileSync(OUT, build());
  console.log(`schema: ${OUT}`);
}
