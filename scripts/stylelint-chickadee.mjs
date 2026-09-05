/**
 * stylelint-chickadee — 정본 §6 을 린트로 굳힌 4개 규칙.
 *
 * 「왜」: 이 규칙들이 리뷰어 눈이 아니라 린트에 있어야 3주 뒤에도 산다.
 *
 * **D182 로 셋 중 둘을 갈아 끼웠다.** 옛 규칙 둘(`track-alias-only`·`print-physics-scope`)은
 * 리소그래프 원색과 인쇄 물리를 막던 것인데 그 토큰과 클래스가 통째로 사라져 **막을 것이
 * 없어졌다** — 통과하는 규칙이 아니라 죽은 규칙이었다. 지키는 대상이 없는 규칙을 초록으로
 * 두면 다음 사람이 그것이 아직 지켜지는 줄 안다.
 *
 *   chickadee/no-font-size-below-13   13px 하한. font-size 리터럴 < 13px 금지, var() 만 허용.
 *   chickadee/no-retired-tokens       폐기된 리소 토큰(--paper·--ink·--t0·--verdict·…) 부활 금지.
 *   chickadee/dark-selector-allowlist [data-theme="dark"] 는 토큰 파일에서만.
 *   chickadee/no-decoration           장식 속성(질감·블렌드·drop-shadow·회전)은 어디서도 금지.
 */

import path from 'node:path';
import stylelint from 'stylelint';

const { createPlugin, utils } = stylelint;

const DOC = 'docs/05-frontend.md';

/** 규칙 하나를 stylelint 플러그인으로 감싼다. */
function definePlugin(ruleName, messages, meta, check) {
  const rule = (primary) => (root, result) => {
    const valid = utils.validateOptions(result, ruleName, { actual: primary, possible: [true] });
    if (!valid) return;
    check(root, result, { ruleName, messages });
  };
  rule.ruleName = ruleName;
  rule.messages = messages;
  rule.meta = meta;
  return createPlugin(ruleName, rule);
}

const report = (result, ruleName, messages, node, message, word) =>
  utils.report({ result, ruleName, node, message, ...(word ? { word } : {}) });

/* ════════════════════════════════════════════════════════════════════════
   1. chickadee/no-font-size-below-13  (05 §4.2)

   토큰에 --fs-12 가 없으니 남은 구멍은 리터럴이다. 목업의
   `.map .nd .dir{12.5px}` · `.newtag{12px}` 가 여기 걸린다. `.band-s{13px}` 는 통과.
   ════════════════════════════════════════════════════════════════════════ */

const MIN_PX = 13;
const ROOT_PX = 16; // rem 환산 기준 — html 의 font-size 를 바꾸지 않는다는 전제(reset.css)

const fontSizeRuleName = 'chickadee/no-font-size-below-13';
const fontSizeMessages = utils.ruleMessages(fontSizeRuleName, {
  rejected: (literal, px) =>
    `활자 하한 위반: \`${literal}\` = ${px}px 로 ${MIN_PX}px 미만입니다. ` +
    `--fs-13 이상 토큰을 var() 로 쓰세요 (${DOC} §4.2).`,
});

/** 값 안의 px/rem 리터럴을 모두 뽑아 px 로 환산한다. */
function pxLiterals(value) {
  const out = [];
  const re = /(^|[\s(,+*/-])(\d*\.?\d+)(px|rem)\b/gi;
  let m = re.exec(value);
  while (m !== null) {
    const n = Number(m[2]);
    out.push({ literal: `${m[2]}${m[3]}`, px: m[3].toLowerCase() === 'rem' ? n * ROOT_PX : n });
    m = re.exec(value);
  }
  return out;
}

const noFontSizeBelow13 = definePlugin(
  fontSizeRuleName,
  fontSizeMessages,
  { url: `${DOC}#42`, fixable: false },
  (root, result, ctx) => {
    root.walkDecls(/^font-size$/i, (decl) => {
      for (const { literal, px } of pxLiterals(decl.value)) {
        if (px < MIN_PX) {
          report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejected(literal, px), literal);
        }
      }
    });
  },
);

/* ════════════════════════════════════════════════════════════════════════
   2. chickadee/track-alias-only  (05 §4.2)

   컴포넌트 CSS 는 --t0/--t1/--t2(-deep/-text)·--on-t*·--verdict-* 만 쓴다.
   원색 직접 참조는 나중에 T1 색을 바꿀 때 판정 색까지 딸려 바뀌게 만든다.
   D182 가 이 이름들을 통째로 폐기했다. 값이 사라졌으므로 다시 쓰면 CSS 가 조용히
   `unset` 이 되고 화면이 어긋난다 — 리뷰가 아니라 린트가 잡아야 하는 종류다.
   토큰 파일 자신은 새 이름만 정의하므로 예외가 필요 없다.
   ════════════════════════════════════════════════════════════════════════ */

/** D182 가 지운 토큰의 접두어. 이 목록에 이름을 더하려면 정본 §6 을 먼저 고친다. */
const RETIRED_PREFIXES = [
  'paper', 'ink', 'stock', 'edge', 'lamp', 'grain', 'glow', 'verdict',
  'desk', 'misreg', 'drop', 'f-poster', 'fs-poster', 'on-t', 'rule',
  't0', 't1', 't2', 'blue', 'pink', 'yellow',
];
const RETIRED_RE = new RegExp(
  `--(?:${RETIRED_PREFIXES.join('|')})(?![a-z0-9])[a-z0-9-]*`,
  'g',
);

const retiredRuleName = 'chickadee/no-retired-tokens';
const retiredMessages = utils.ruleMessages(retiredRuleName, {
  rejected: (token) =>
    `폐기된 토큰 \`${token}\` (D182). 리소그래프 팔레트는 통째로 사라졌습니다 — ` +
    `표면 --surface* · 글자 --text* · 액센트 --accent · 상태 --ok/--bad/--warn/--info 를 쓰세요.`,
});

const noRetiredTokens = definePlugin(
  retiredRuleName,
  retiredMessages,
  { url: `${DOC}#4`, fixable: false },
  (root, result, ctx) => {
    root.walkDecls((decl) => {
      for (const text of [decl.prop, decl.value]) {
        for (const m of String(text).matchAll(RETIRED_RE)) {
          report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejected(m[0]), m[0]);
        }
      }
    });
  },
);

/* ════════════════════════════════════════════════════════════════════════
   3. chickadee/dark-selector-allowlist  (05 §4.3)

   어두운 화면은 반전이 아니라 다른 팔레트이다. 테마 분기는 토큰 한 곳에서 끝난다.
   ════════════════════════════════════════════════════════════════════════ */

/* D182 — 테마 분기는 토큰 한 곳에서 끝난다. 예외 컴포넌트 여섯은 전부 사라졌거나
   토큰만으로 서므로 목록을 비웠다. 다시 필요해지면 정본 §6 을 먼저 고친다. */
const DARK_ALLOWED_COMPONENTS = [];
const DARK_ALLOWED_FILES = ['tokens.css'];
const DARK_SELECTOR = /\[data-theme\s*=\s*("dark"|'dark'|dark)\]/;

const darkRuleName = 'chickadee/dark-selector-allowlist';
const darkMessages = utils.ruleMessages(darkRuleName, {
  rejected: (selector, where) =>
    `다크 선택자 금지: \`${selector}\` (${where}). [data-theme="dark"] 는 tokens.css 와 ` +
    `${DARK_ALLOWED_COMPONENTS.join(' · ')} 에서만 씁니다 (${DOC} §4.3).`,
});

function darkAllowedFile(file) {
  if (typeof file !== 'string') return false;
  const base = path.basename(file);
  if (DARK_ALLOWED_FILES.includes(base)) return true;
  const stem = base.split('.')[0];
  return DARK_ALLOWED_COMPONENTS.includes(stem);
}

const darkSelectorAllowlist = definePlugin(
  darkRuleName,
  darkMessages,
  { url: `${DOC}#43`, fixable: false },
  (root, result, ctx) => {
    const file = root.source?.input?.file;
    if (darkAllowedFile(file)) return;
    const where = typeof file === 'string' ? path.basename(file) : '이름 없는 소스';

    root.walkRules((node) => {
      const hit = node.selectors.find((s) => DARK_SELECTOR.test(s));
      if (hit) report(result, ctx.ruleName, ctx.messages, node, ctx.messages.rejected(hit, where), hit.trim());
    });
  },
);

/* ════════════════════════════════════════════════════════════════════════
   4. chickadee/no-decoration  (정본 §6 「장식 0」)

   D182 는 장식을 「기본 꺼짐」이 아니라 **없앴다**. 옛 규칙은 인쇄 물리를 본문 단 밖으로
   밀어내는 것이었는데, 이제 밀어낼 곳이 없다 — 화면 어디에도 두지 않는다.
   ════════════════════════════════════════════════════════════════════════ */

/** 질감·겹침·번짐을 만드는 속성과 값. 값 쪽은 정규식으로 본다. */
const DECOR_PROPS = ['mix-blend-mode', 'backdrop-filter'];
const DECOR_VALUE_RE = /\b(repeating-(?:linear|radial|conic)-gradient|drop-shadow)\s*\(/;
/** 기울기·회전은 장식이다. 각도가 0 이 아닌 rotate 만 잡는다. */
const ROTATE_RE = /\brotate[XYZ]?\(\s*(-?[\d.]+)(deg|rad|turn|grad)/;

const decorRuleName = 'chickadee/no-decoration';
const decorMessages = utils.ruleMessages(decorRuleName, {
  rejectedProp: (prop) =>
    `장식 속성 \`${prop}\` (정본 §6 「장식 0」). 질감·겹침은 화면 어디에도 두지 않습니다.`,
  rejectedValue: (what) =>
    `장식 값 \`${what}\` (정본 §6 「장식 0」). 무늬와 번짐 대신 면과 선으로 말합니다.`,
  rejectedRotate: (what) =>
    `기울기 \`${what}\` (정본 §6 「장식 0」). 종이를 흉내 내는 회전은 없습니다.`,
});

const noDecoration = definePlugin(
  decorRuleName,
  decorMessages,
  { url: `${DOC}#4`, fixable: false },
  (root, result, ctx) => {
    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      if (DECOR_PROPS.includes(prop)) {
        report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejectedProp(prop), prop);
        return;
      }
      const v = String(decl.value);
      const hit = DECOR_VALUE_RE.exec(v);
      if (hit) {
        report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejectedValue(hit[1]), hit[1]);
      }
      const rot = ROTATE_RE.exec(v);
      if (rot && Number(rot[1]) !== 0) {
        report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejectedRotate(rot[0]), rot[0]);
      }
    });
  },
);

export default [noFontSizeBelow13, noRetiredTokens, darkSelectorAllowlist, noDecoration];
