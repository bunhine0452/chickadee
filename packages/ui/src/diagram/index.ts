/**
 * 학습 내용을 나르는 그림. **장식이 아니라 본문이다** — 근거와 목록은
 * `design/system/diagrams.md`.
 */
export { Diagram } from './Diagram';
export type { DiagramNav, DiagramProps } from './Diagram';
export { BitField } from './BitField';
export type { BitFieldProps } from './BitField';
export { EvalTree } from './EvalTree';
export type { EvalTreeProps } from './EvalTree';
export { ValueBox, describeValues } from './ValueBox';
export type { ValueBoxProps } from './ValueBox';

export { bitsOf, exactDecimal, describeBits, BITS_LABELS_KO } from './bits';
export type { BitsOptions } from './bits';
export { annotate, foldSteps, foldedText, isFolded, describeTree, describeFold } from './tree';
export type { FoldNode } from './tree';
export { DIAGRAM_LABELS_KO, withLabels } from './labels';
export type { DiagramLabels } from './labels';
export type {
  BitsField,
  BitsFieldKind,
  BitsModel,
  DiagramPhase,
  EvalNode,
  EvalTreeModel,
  FoldModel,
  FoldStep,
  NumType,
  ValueBoxModel,
  ValueCell,
  ValueStep,
} from './types';
