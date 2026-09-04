// @chickadee/ui — 목업(`design/ink-home.html` · `design/src/ink/`)에서 옮긴 프리미티브.
// 클래스명은 목업 그대로다 (05 §1.1 — CSS Modules 금지).
// `dev/Gallery.tsx` 는 DEV 전용이라 여기서 내보내지 않는다.

export { cx } from './cx';
export type { InkLayer, Track, Verdict } from './types';

export { Pill } from './Pill';
export type { PillProps } from './Pill';
export { Passes, PASS_SLOTS } from './Passes';
export type { PassesProps } from './Passes';
export { Kbd } from './Kbd';
export type { KbdProps } from './Kbd';
export { PressButton, PRESS_DOWN_MS } from './PressButton';
export type { PressButtonProps } from './PressButton';
export { FlatButton } from './FlatButton';
export type { FlatButtonProps } from './FlatButton';
export { Switch } from './Switch';
export type { SwitchOption, SwitchProps } from './Switch';
export { Reg } from './Reg';
export type { RegProps } from './Reg';
export { Stamp } from './Stamp';
export type { StampProps, StampTone } from './Stamp';
export { Say } from './Say';
export type { SayProps } from './Say';
export { Toast, TOAST_MS } from './Toast';
export type { ToastProps } from './Toast';
export { LiveRegion, REANNOUNCE_DELAY_MS } from './LiveRegion';
export type { LiveRegionProps } from './LiveRegion';
export { announce, ANNOUNCE_MAX_LEN } from './announce';
export { Misreg } from './Misreg';
export type { MisregProps } from './Misreg';
export { RichText, sanitizeRichText, RICH_TEXT_ALLOWED_ATTR, RICH_TEXT_ALLOWED_TAGS } from './RichText';
export type { RichTextProps } from './RichText';

export { DeeSprite } from './dee/DeeSprite';
export { Dee, DeeLogo, DEE_HEAD_SIZE_LIMIT } from './dee/Dee';
export type { DeeProps, DeeLogoProps, DeeSymbol } from './dee/Dee';
export { useDeeMotion, DEE_MOTIONS, DEE_MOTION_CLASSES, DEE_MOTION_BUDGET_MS } from './dee/useDeeMotion';
export type { DeeMotion, DeeMotionOptions, DeeMotionSpec } from './dee/useDeeMotion';
export { DEE_PLATES, DEE_BIRD_CLIP_POINTS, DEE_BIRD_DIECUT_POINTS } from './dee/deePlates';
export { deeStandalone } from './dee/deeStandalone';
export { deeImageUrl, clearDeeImageCache } from './dee/deeImage';
export { SYMBOL_ID } from './dee/symbols';
export type { DeePlate } from './dee/deePlates';
export { actionLabel, errorCopy, isInternal } from './error-copy.js';
export type { ErrorAction, ErrorCopy } from './error-copy.js';
