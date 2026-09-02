// Vite 가 주입하는 `import.meta.env` 최소 선언.
// `dev/Gallery.tsx` 가 프로덕션 번들에서 사라지는지 판정하는 데만 쓴다.
interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 컴포넌트별 순수 CSS 를 사이드이펙트로 들여온다 (CSS Modules 금지 — 05 §1.1).
declare module '*.css';
