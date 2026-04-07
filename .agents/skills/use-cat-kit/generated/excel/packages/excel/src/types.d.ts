//#region src/types.d.ts
type DateSystem = 1900 | 1904;
type CellPrimitive = string | number | boolean | null;
interface FormulaValue {
  formula: string;
  result?: CellPrimitive;
}
type CellValue = CellPrimitive | Date | FormulaValue;
interface CellFontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}
interface CellFillStyle {
  type?: 'none' | 'solid';
  color?: string;
}
interface CellBorderEdgeStyle {
  style?: 'none' | 'thin' | 'medium' | 'thick' | 'double' | 'dotted' | 'dashed' | 'dashDot' | 'dashDotDot';
  color?: string;
}
interface CellBorderStyle {
  left?: CellBorderEdgeStyle;
  right?: CellBorderEdgeStyle;
  top?: CellBorderEdgeStyle;
  bottom?: CellBorderEdgeStyle;
  diagonal?: CellBorderEdgeStyle;
}
interface CellAlignmentStyle {
  horizontal?: 'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
  vertical?: 'top' | 'center' | 'bottom' | 'justify' | 'distributed';
  wrapText?: boolean;
  textRotation?: number;
  indent?: number;
}
interface CellProtectionStyle {
  locked?: boolean;
  hidden?: boolean;
}
interface CellStyle {
  font?: CellFontStyle;
  fill?: CellFillStyle;
  border?: CellBorderStyle;
  alignment?: CellAlignmentStyle;
  numberFormat?: string;
  protection?: CellProtectionStyle;
}
interface WorksheetColumn {
  key?: string;
  header?: string;
  width?: number;
  hidden?: boolean;
  style?: CellStyle;
}
interface WorksheetFrozenPane {
  xSplit?: number;
  ySplit?: number;
  topLeftCell?: string;
}
interface WorksheetOptions {
  frozenPane?: WorksheetFrozenPane;
  defaultRowHeight?: number;
  defaultColWidth?: number;
}
interface WorkbookMetadata {
  creator?: string;
  lastModifiedBy?: string;
  createdAt?: Date;
  modifiedAt?: Date;
}
interface ReadOptions {
  dateSystem?: DateSystem;
  strict?: boolean;
}
interface ReadStreamOptions extends ReadOptions {
  sheets?: string[];
  includeEmptyRows?: boolean;
}
interface WriteOptions {
  dateSystem?: DateSystem;
  useSharedStrings?: boolean;
  compressionLevel?: number;
}
type WorkbookInput = Uint8Array | ArrayBuffer | Blob | ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>;
interface StreamSheetStartEvent {
  type: 'sheetStart';
  sheetName: string;
  sheetIndex: number;
}
interface StreamSheetEndEvent {
  type: 'sheetEnd';
  sheetName: string;
  sheetIndex: number;
}
interface StreamRowEvent {
  type: 'row';
  sheetName: string;
  sheetIndex: number;
  rowIndex: number;
  values: CellValue[];
}
type StreamEvent = StreamSheetStartEvent | StreamSheetEndEvent | StreamRowEvent;
//#endregion
export { CellAlignmentStyle, CellBorderEdgeStyle, CellBorderStyle, CellFillStyle, CellFontStyle, CellPrimitive, CellProtectionStyle, CellStyle, CellValue, DateSystem, FormulaValue, ReadOptions, ReadStreamOptions, StreamEvent, StreamRowEvent, StreamSheetEndEvent, StreamSheetStartEvent, WorkbookInput, WorkbookMetadata, WorksheetColumn, WorksheetFrozenPane, WorksheetOptions, WriteOptions };
//# sourceMappingURL=types.d.ts.map