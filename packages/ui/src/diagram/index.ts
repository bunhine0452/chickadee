/**
 * 학습 내용을 나르는 그림. **장식이 아니라 본문이다** — 근거와 목록은
 * `design/system/diagrams.md`.
 *
 * 열 개. 셋은 I2 가 만든 것(비트 배열·평가 트리·값 상자, 그리고 평가 트리의 둘째 입구인
 * 걸음 사다리)이고, 일곱은 명세만 있던 것과 언어 세션 여섯의 신청을 합친 것이다(D187 ⑲).
 */
export { Diagram } from './Diagram';
export type { DiagramNav, DiagramProps } from './Diagram';
export { BitField } from './BitField';
export type { BitFieldProps } from './BitField';
export { EvalTree } from './EvalTree';
export type { EvalTreeProps } from './EvalTree';
export { ValueBox, describeValues } from './ValueBox';
export type { ValueBoxProps } from './ValueBox';

export { MemoryLine, describeMemory, slotNames } from './MemoryLine';
export type { MemoryLineProps } from './MemoryLine';
export { BitOverlay, describeOverlay, keptBits } from './BitOverlay';
export type { BitOverlayProps } from './BitOverlay';
export { StackFrames, describeStack } from './StackFrames';
export type { StackFramesProps } from './StackFrames';
export { ConversionLadder, describeLadder, kindLabel } from './ConversionLadder';
export type { ConversionLadderProps } from './ConversionLadder';
export { PermissionLine, describePermissions, permName, permStateName } from './PermissionLine';
export type { PermissionLineProps } from './PermissionLine';
export { QueueLadder, describeQueue } from './QueueLadder';
export type { QueueLadderProps } from './QueueLadder';
export { ParallelSteps, describeParallel, channelLabel } from './ParallelSteps';
export type { ParallelStepsProps } from './ParallelSteps';

export { bitsOf, exactDecimal, describeBits, BITS_LABELS_KO } from './bits';
export type { BitsOptions } from './bits';
export { annotate, foldSteps, foldedText, isFolded, describeTree, describeFold } from './tree';
export type { FoldNode } from './tree';
export { DIAGRAM_LABELS_KO, withLabels } from './labels';
export type { DiagramLabels } from './labels';
export { diagramLabels } from './i18n';
export type {
  BitOverlayModel,
  BitsField,
  BitsFieldKind,
  BitsModel,
  ChannelKind,
  ConversionEdge,
  ConversionKind,
  ConversionLadderModel,
  ConversionRung,
  DiagramPhase,
  EvalNode,
  EvalTreeModel,
  FoldModel,
  FoldStep,
  MemoryLineModel,
  MemorySlot,
  MemoryWindow,
  NumType,
  ParallelEdge,
  ParallelLane,
  ParallelStepsModel,
  PermExpect,
  PermPlace,
  PermState,
  PermStep,
  PermissionLineModel,
  QueueLadderModel,
  StackFrame,
  StackFramesModel,
  StackStep,
  StackUnwind,
  ValueBoxModel,
  ValueCell,
  ValueStep,
} from './types';
