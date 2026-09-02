/**
 * stylelint-chickadee — 05 §4.2 · §4.3 을 린트로 굳힌 4개 규칙.
 *
 * 「왜」: 05 §4.3 마지막 줄 — 이 규칙들이 리뷰어 눈이 아니라 린트에 있어야 3주 뒤에도 산다.
 *
 *   chickadee/no-font-size-below-13   13px 하한. font-size 리터럴 < 13px 금지, var() 만 허용.
 *   chickadee/track-alias-only        styles/ 밖에서 --blue/--pink/--yellow 직접 참조 금지.
 *   chickadee/dark-selector-allowlist [data-theme="dark"] 는 tokens.css + 6개 컴포넌트만.
 *   chickadee/print-physics-scope     인쇄 물리는 본문 단(.ps-in 하위) 밖에만.
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
   styles/ 안(토큰 정의·리셋·물리)은 원색을 알아야 하므로 예외.
   ════════════════════════════════════════════════════════════════════════ */

const STYLES_DIR = path.join('apps', 'desktop', 'src', 'styles');
const RAW_INKS = ['blue', 'pink', 'yellow'];
const RAW_TOKENS = RAW_INKS.flatMap((c) => [`--${c}`, `--${c}-deep`, `--${c}-text`]);

const aliasRuleName = 'chickadee/track-alias-only';
const aliasMessages = utils.ruleMessages(aliasRuleName, {
  rejectedUse: (token) =>
    `원색 직접 참조: \`var(${token})\`. 컴포넌트는 --t0/--t1/--t2(-deep/-text) · --on-t* · ` +
    `--verdict-* 만 씁니다 (${DOC} §4.2).`,
  rejectedDefine: (token) =>
    `원색 재정의: \`${token}\` 은 apps/desktop/src/styles/tokens.css 에서만 정의합니다 (${DOC} §4.2).`,
});

const insideStyles = (file) => typeof file === 'string' && path.normalize(file).includes(STYLES_DIR);

const trackAliasOnly = definePlugin(
  aliasRuleName,
  aliasMessages,
  { url: `${DOC}#42`, fixable: false },
  (root, result, ctx) => {
    if (insideStyles(root.source?.input?.file)) return;

    root.walkDecls((decl) => {
      if (RAW_TOKENS.includes(decl.prop)) {
        report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejectedDefine(decl.prop), decl.prop);
      }
      const re = /var\(\s*(--(?:blue|pink|yellow)(?:-deep|-text)?)\s*[,)]/g;
      let m = re.exec(decl.value);
      while (m !== null) {
        report(result, ctx.ruleName, ctx.messages, decl, ctx.messages.rejectedUse(m[1]), m[1]);
        m = re.exec(decl.value);
      }
    });
  },
);

/* ════════════════════════════════════════════════════════════════════════
   3. chickadee/dark-selector-allowlist  (05 §4.3)

   야간반은 반전이 아니라 다른 공정이다. 테마 분기는 토큰 한 곳에서 끝내고,
   글로우가 필요한 6개 컴포넌트만 예외로 둔다.
   ════════════════════════════════════════════════════════════════════════ */

const DARK_ALLOWED_COMPONENTS = ['PressButton', 'Switch', 'TimeQueue', 'Node', 'Stamp', 'Crumb'];
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
   4. chickadee/print-physics-scope  (05 §4.3)

   원칙 ①: 읽어야 하는 텍스트 위에는 잉크를 얹지 않는다.
   인쇄 물리(mix-blend-mode · .mr · .grain)는 본문 단 밖에만 — 워드마크·판 번호·
   도장·마스트헤드 바탕까지다.
   ════════════════════════════════════════════════════════════════════════ */

const BODY_COLUMN = ['ps-in', 'ask', 'fb', 'code', 'rung-body', 'drow'];
const PHYSICS_CLASSES = ['mr', 'grain'];
const PHYSICS_PROPS = ['mix-blend-mode'];

const physicsRuleName = 'chickadee/print-physics-scope';
const physicsMessages = utils.ruleMessages(physicsRuleName, {
  rejectedDecl: (prop, selector) =>
    `본문 단 안의 인쇄 물리: \`${prop}\` 를 \`${selector}\` 에 선언했습니다. ` +
    `인쇄 물리는 본문 단(.${BODY_COLUMN.join(' · .')}) 밖에만 (${DOC} §4.3).`,
  rejectedSelector: (cls, selector) =>
    `본문 단 안의 인쇄 물리: \`.${cls}\` 를 \`${selector}\` 로 걸었습니다. ` +
    `인쇄 물리는 본문 단(.${BODY_COLUMN.join(' · .')}) 밖에만 (${DOC} §4.3).`,
});

const classesOf = (selector) => [...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]);

const printPhysicsScope = definePlugin(
  physicsRuleName,
  physicsMessages,
  { url: `${DOC}#43`, fixable: false },
  (root, result, ctx) => {
    root.walkRules((node) => {
      const offending = node.selectors.find((s) => classesOf(s).some((c) => BODY_COLUMN.includes(c)));
      if (!offending) return;

      const physicsClass = classesOf(offending).find((c) => PHYSICS_CLASSES.includes(c));
      if (physicsClass) {
        report(
          result,
          ctx.ruleName,
          ctx.messages,
          node,
          ctx.messages.rejectedSelector(physicsClass, offending),
          `.${physicsClass}`,
        );
      }

      for (const child of node.nodes ?? []) {
        if (child.type === 'decl' && PHYSICS_PROPS.includes(child.prop.toLowerCase())) {
          report(result, ctx.ruleName, ctx.messages, child, ctx.messages.rejectedDecl(child.prop, offending));
        }
      }
    });
  },
);

export default [noFontSizeBelow13, trackAliasOnly, darkSelectorAllowlist, printPhysicsScope];
