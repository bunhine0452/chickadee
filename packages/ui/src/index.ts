// @chickadee/ui — 프리미티브. 토큰은 `design/system/tokens.css` 가 단일 출처다(D182).
// 클래스명은 이력이라 그대로 둔다 (05 §1.1 — CSS Modules 금지).
// `dev/Gallery.tsx` 는 DEV 전용이라 여기서 내보내지 않는다.
//
// **새 화면은 아래 「D182 프리미티브」만 쓴다.** 그 아래 두 묶음은 옮기는 중이거나
// 폐기 대상이고, 옮기는 것은 화면 세션의 몫이다.

export { cx } from './cx';
export type { InkLayer, Track, Verdict } from './types';

/* ───────── D182 프리미티브 ───────── */

export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardLift, CardPad, CardProps, CardTone } from './Card';
export { Field } from './Field';
export type { FieldProps } from './Field';
export { Tag } from './Tag';
export type { TagProps, TagTone } from './Tag';
export { Progress } from './Progress';
export type { ProgressProps, ProgressTone } from './Progress';
export { Callout } from './Callout';
export type { CalloutProps, CalloutTone } from './Callout';

/* ───────── 그림 — 학습 내용을 나르는 다이어그램 (design/system/diagrams.md) ─────────
   장식이 아니라 본문이다. 정본 §6 자신이 「코드와 다이어그램이 가장 큰 요소」라고 적었다.
   전부 값에서 결정론으로 나오고, `predict`/`reveal` 두 상태로 답을 흘리지 않는다.
   문구는 `diagramLabels()` 로 `packages/i18n` 의 `diagram.*` 를 받는다 (D187 ⑳). */

export {
  Diagram, BitField, EvalTree, ValueBox,
  MemoryLine, BitOverlay, StackFrames, ConversionLadder, PermissionLine, QueueLadder, ParallelSteps,
  bitsOf, exactDecimal, describeBits, describeTree, describeFold, describeValues,
  describeMemory, describeOverlay, describeStack, describeLadder, describePermissions,
  describeQueue, describeParallel,
  annotate, foldSteps, foldedText, isFolded, slotNames, keptBits, kindLabel, channelLabel,
  permName, permStateName,
  BITS_LABELS_KO, DIAGRAM_LABELS_KO, withLabels, diagramLabels,
} from './diagram';
export type {
  BitFieldProps, BitsField, BitsFieldKind, BitsModel, BitsOptions,
  BitOverlayModel, BitOverlayProps,
  ChannelKind, ConversionEdge, ConversionKind, ConversionLadderModel, ConversionLadderProps, ConversionRung,
  DiagramLabels, DiagramNav, DiagramPhase, DiagramProps,
  EvalNode, EvalTreeModel, EvalTreeProps, FoldModel, FoldNode, FoldStep,
  MemoryLineModel, MemoryLineProps, MemorySlot, MemoryWindow,
  NumType,
  ParallelEdge, ParallelLane, ParallelStepsModel, ParallelStepsProps,
  PermExpect, PermPlace, PermState, PermStep, PermissionLineModel, PermissionLineProps,
  QueueLadderModel, QueueLadderProps,
  StackFrame, StackFramesModel, StackFramesProps, StackStep, StackUnwind,
  ValueBoxModel, ValueBoxProps, ValueCell, ValueStep,
} from './diagram';

/* ───────── 남은 것 — 새 시스템으로 다시 그렸고 호출처가 옮겨 가는 중 ───────── */

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
/* ───────── 폐기 대상 (D182) — 새 화면에서 쓰지 마라. @deprecated 주석에 옮길 곳이 있다. ───────── */

export { Toast, TOAST_MS } from './Toast';
export type { ToastProps } from './Toast';
export { LiveRegion, REANNOUNCE_DELAY_MS } from './LiveRegion';
export type { LiveRegionProps } from './LiveRegion';
export { announce, ANNOUNCE_MAX_LEN } from './announce';
export { RichText, sanitizeRichText, RICH_TEXT_ALLOWED_ATTR, RICH_TEXT_ALLOWED_TAGS } from './RichText';
export type { RichTextProps } from './RichText';

export { actionLabel, errorCopy, isInternal } from './error-copy.js';
export type { ErrorAction, ErrorCopy } from './error-copy.js';
