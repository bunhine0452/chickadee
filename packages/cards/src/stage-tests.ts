/**
 * 판정용 테스트를 뽑는다 (D180 ③ · `docs/program/exercises.md` §4).
 *
 * 4·5단은 실행으로 판정한다. 그 판정의 정답지가 여기서 나오고, 재료는 리포 안에만 있다 —
 * 지어내지 않는다. 세 갈래를 순서대로 보고 **처음 걸리는 것**을 쓴다.
 *
 *   ⓐ `commit`  그 `fix:` 커밋이 **같이 고친 테스트 파일**. 커밋이 무엇을 고쳤는지가 곧 판정
 *               기준이라 가장 강하다. hunk 의 자식 판(`' '`+`'+'`)이 그 테스트의 최신 모양이다.
 *   ⓑ `repo`    대상 클래스와 **이름이 맞는** 리포 테스트 (`AuthService` → `AuthServiceTest`).
 *               원본의 관찰 가능한 계약이 이미 코드로 적혀 있는 자리다.
 *   ⓒ `contract` 둘 다 없으면 **계약 테스트를 생성한다** — 공개 메서드의 이름·인자 수·인자와
 *               반환 타입의 단순 이름을 리플렉션으로 못박는 JUnit 한 장. 타입을 이름으로만
 *               보므로 import 가 필요 없고, 대상이 안 컴파일되면 여기서 먼저 죽는다.
 *
 * **한계를 숨기지 않는다.** ⓒ 가 재는 것은 컴파일과 시그니처이지 본문의 값이 아니다. 리포에
 * 행위 테스트가 없으면 「본문이 옳은가」는 여전히 못 재고, 그 사실은 화면이 말한다(D180).
 *
 * 순수 함수다 — 파일을 읽지 않고 전부 인자로 받는다.
 */
import type { Hunk, JudgeTest, StageCommit, StageTestFile } from './stage-types.js';

/** 자바 소스 루트. 이 뒤가 패키지 경로다. */
const JAVA_ROOT = /(^|\/)src\/main\/java\//;
/** 자바 테스트 루트 — 생성한 테스트를 여기 둔다. */
const JAVA_TEST_ROOT = 'src/test/java/';
/** 생성한 테스트의 패키지. 리포의 어느 패키지와도 안 겹치게 이름을 못박는다. */
export const JUDGE_PACKAGE = 'chickadee.judge';

/** 테스트 파일로 보이는 경로. 자바(JUnit)와 JS·TS 관례를 함께 본다. */
export function isTestPath(path: string): boolean {
  if (/(^|\/)src\/test\//.test(path)) return true;
  if (/(^|\/)tests?\//.test(path)) return true;
  if (/(Test|Tests|IT)\.(java|kt)$/.test(path)) return true;
  return /\.(test|spec)\.[cm]?[jt]sx?$/.test(path);
}

/** 자바 소스 경로 → 완전 이름. `src/main/java/` 뒤가 패키지라 파싱 없이 나온다. */
export function javaFqn(path: string): string | null {
  if (!path.endsWith('.java')) return null;
  const at = path.search(JAVA_ROOT);
  if (at < 0) return null;
  const rel = path.slice(path.indexOf('src/main/java/', at) + 'src/main/java/'.length);
  const dotted = rel.slice(0, -'.java'.length).split('/').filter((s) => s !== '').join('.');
  return dotted === '' ? null : dotted;
}

/** 클래스 단순 이름. */
export const simpleName = (fqn: string): string => fqn.slice(fqn.lastIndexOf('.') + 1);

/** 이 파일의 테스트를 놓을 자리. 자바 모듈 하나면 `src/test/java/` 아래다. */
function judgeTestPath(sourcePath: string, className: string): string {
  const at = sourcePath.indexOf('src/main/java/');
  const module = at < 0 ? '' : sourcePath.slice(0, at);
  return `${module}${JAVA_TEST_ROOT}${JUDGE_PACKAGE.replace(/\./g, '/')}/${className}.java`;
}

/** 공개 메서드 하나의 관찰 가능한 계약. */
export interface MethodContract {
  name: string;
  /** 인자 타입의 **단순 이름**. 제네릭 인자는 벗긴다 (`List<User>` → `List`). */
  params: string[];
  /** 반환 타입의 단순 이름. `void` 도 그대로. */
  returns: string;
}

const bare = (type: string): string => {
  const cut = type.replace(/<.*$/, '').replace(/\[\]$/, '').trim();
  return cut.slice(cut.lastIndexOf('.') + 1);
};

const SIG = /(?:^|\s)(?:public|protected)\s+(?:static\s+|final\s+|synchronized\s+)*(?:<[^>]*>\s*)?([A-Za-z_$][\w$.<>,\s[\]]*?)\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/;

/**
 * 시그니처 줄에서 계약을 읽는다. 시그니처는 `buildSpec` 이 이미 뽑아 payload 에 실어 두었고,
 * 여기서는 그 줄을 다시 읽을 뿐이다. 못 읽으면 `null` — 그때는 계약 테스트를 안 만든다.
 */
export function parseJavaSignature(lines: readonly string[]): MethodContract | null {
  for (const line of lines) {
    const m = SIG.exec(line);
    if (m === null) continue;
    const returns = bare(m[1] as string);
    const name = m[2] as string;
    if (returns === '' || returns === 'class' || returns === 'record') continue;
    const args = (m[3] as string).trim();
    const params = args === ''
      ? []
      : args.split(',').map((a) => {
        const parts = a.trim().replace(/^(?:final\s+|@\w+(?:\([^)]*\))?\s+)*/, '').split(/\s+/);
        return bare(parts[0] ?? '');
      }).filter((p) => p !== '');
    return { name, params, returns };
  }
  return null;
}

const javaIdent = (text: string): string => {
  const cleaned = text.replace(/[^A-Za-z0-9_]/g, ' ').split(/\s+/).filter((w) => w !== '')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return /^[A-Za-z]/.test(cleaned) ? cleaned : `X${cleaned}`;
};

const quote = (text: string): string => `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/**
 * 계약 테스트 한 장 (ⓒ). 메서드 계약을 못 읽으면 **클래스가 서는지**만 본다 — 그것도 판정이다:
 * 안 컴파일되거나 클래스가 사라지면 실패한다. 4단(한 줄 수정)이 이 자리다.
 */
export function contractTest(input: {
  file: string;
  signature?: readonly string[];
}): JudgeTest | null {
  const fqn = javaFqn(input.file);
  if (fqn === null) return null;
  const contract = input.signature === undefined ? null : parseJavaSignature(input.signature);
  const className = `${javaIdent(simpleName(fqn))}${contract === null ? '' : javaIdent(contract.name)}ContractTest`;
  const body = contract === null
    ? [
      `        Class<?> target = Class.forName(${quote(fqn)});`,
      `        assertNotNull(target, ${quote(`${simpleName(fqn)} is missing`)});`,
    ]
    : [
      `        Class<?> target = Class.forName(${quote(fqn)});`,
      '        java.util.List<Method> found = Arrays.stream(target.getDeclaredMethods())',
      `                .filter(m -> m.getName().equals(${quote(contract.name)}))`,
      '                .collect(java.util.stream.Collectors.toList());',
      `        assertFalse(found.isEmpty(), ${quote(`${contract.name}(...) is missing`)});`,
      '        Method m = found.stream()',
      `                .filter(x -> x.getParameterCount() == ${contract.params.length})`,
      `                .findFirst().orElseThrow(() -> new AssertionError(${quote(`${contract.name} takes ${contract.params.length} parameter(s)`)}));`,
      `        assertEquals(${quote(contract.returns)}, m.getReturnType().getSimpleName(), ${quote(`return type of ${contract.name}`)});`,
      `        assertEquals(${quote(contract.params.join(','))}, Arrays.stream(m.getParameterTypes())`,
      `                .map(Class::getSimpleName).collect(java.util.stream.Collectors.joining(",")), ${quote(`parameter types of ${contract.name}`)});`,
    ];
  const text = [
    `package ${JUDGE_PACKAGE};`,
    '',
    'import java.lang.reflect.Method;',
    'import java.util.Arrays;',
    'import org.junit.jupiter.api.Test;',
    'import static org.junit.jupiter.api.Assertions.assertEquals;',
    'import static org.junit.jupiter.api.Assertions.assertFalse;',
    'import static org.junit.jupiter.api.Assertions.assertNotNull;',
    '',
    '// Generated by Chickadee (D180). Pins the observable contract of the original code.',
    `class ${className} {`,
    '    @Test',
    '    void contractHolds() throws Exception {',
    ...body,
    '    }',
    '}',
    '',
  ].join('\n');
  return { path: judgeTestPath(input.file, className), text, source: 'contract' };
}

/** hunk 의 자식 판 — `' '` 와 `'+'`. 커밋 뒤의 테스트가 이것이다. */
const afterSide = (hunks: readonly Hunk[]): string[] =>
  hunks.flatMap((h) => h.lines.filter((l) => l.sign !== '-').map((l) => l.text));

/**
 * 그 커밋이 같이 고친 테스트 (ⓐ). hunk 는 문맥 4줄까지라 파일 전체가 아니다 — 그래서
 * **리포에 그 경로의 파일이 있으면 그쪽 전문을 쓰고**, 없을 때만 hunk 를 붙여 쓴다.
 */
export function commitTests(
  commit: StageCommit, repoTests: readonly StageTestFile[],
): JudgeTest[] {
  const byPath = new Map(repoTests.map((t) => [t.path, t.text]));
  return commit.files
    .filter((f) => isTestPath(f.path) && f.hunks.length > 0)
    .map((f) => ({ path: f.path, text: byPath.get(f.path) ?? afterSide(f.hunks).join('\n'), source: 'commit' as const }))
    .filter((t) => t.text.trim() !== '');
}

/** 스프링 컨텍스트 로드 테스트. 애너테이션 배선이 틀리면 여기서 죽는다 — 정본 §2 의 자리다. */
const SPRING_CONTEXT = /@SpringBootTest\b/;

/**
 * 리포의 스프링 컨텍스트 테스트 (ⓑ의 곁가지). 자바 답안에는 늘 함께 붙인다 —
 * `@Service`·생성자 주입·`@Transactional` 처럼 **애너테이션이 런타임에 하는 일**은 컨텍스트가
 * 떠 봐야 드러나고, 그것이 정본 §2 가 스프링에서 정적 판정을 못 믿는 이유다.
 */
export function springTests(repoTests: readonly StageTestFile[]): JudgeTest[] {
  return repoTests.filter((t) => SPRING_CONTEXT.test(t.text))
    .map((t) => ({ path: t.path, text: t.text, source: 'repo' as const }));
}

/** 대상 클래스와 이름이 맞는 리포 테스트 (ⓑ). `AuthService` → `AuthServiceTest`·`AuthServiceTests`. */
export function namedTests(file: string, repoTests: readonly StageTestFile[]): JudgeTest[] {
  const base = file.slice(file.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
  if (base === '') return [];
  const want = new Set([`${base}Test`, `${base}Tests`, `${base}IT`, `${base}.test`, `${base}.spec`]);
  return repoTests
    .filter((t) => want.has(t.path.slice(t.path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '')))
    .map((t) => ({ path: t.path, text: t.text, source: 'repo' as const }));
}

export interface JudgeTestInput {
  /** 학습자가 고치거나 다시 쓰는 파일. */
  file: string;
  /** 4단이면 그 정답지 커밋. 5단은 없다. */
  commit?: StageCommit;
  /** 5단이면 원본 시그니처 — 계약 테스트가 이 줄을 읽는다. */
  signature?: readonly string[];
  repoTests?: readonly StageTestFile[];
}

/**
 * 이 판을 판정할 테스트. ⓐ → ⓑ → ⓒ 순서로 **처음 걸리는 것**을 쓴다. 하나도 없으면 빈 배열이고,
 * 그때 그 판은 실행으로 판정하지 않는다 — 게이트에서 빠지고 화면이 그 사실을 말한다.
 */
export function judgeTests(input: JudgeTestInput): JudgeTest[] {
  const repoTests = input.repoTests ?? [];
  const isJava = javaFqn(input.file) !== null;
  const picked: JudgeTest[] = [];
  const fromCommit = input.commit === undefined ? [] : commitTests(input.commit, repoTests);
  if (fromCommit.length > 0) picked.push(...fromCommit);
  else {
    const named = namedTests(input.file, repoTests);
    if (named.length > 0) picked.push(...named);
    else {
      const made = contractTest({ file: input.file, ...(input.signature === undefined ? {} : { signature: input.signature }) });
      if (made !== null) picked.push(made);
    }
  }
  // 자바면 컨텍스트 로드도 늘 함께 — 배선은 떠 봐야 드러난다.
  if (isJava) {
    const seen = new Set(picked.map((t) => t.path));
    for (const t of springTests(repoTests)) if (!seen.has(t.path)) picked.push(t);
  }
  return picked;
}
