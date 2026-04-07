//#region src/address.d.ts
interface CellAddress {
  row: number;
  col: number;
}
declare function columnToIndex(column: string): number;
declare function indexToColumn(index: number): string;
declare function parseCellAddress(address: string): CellAddress;
declare function formatCellAddress(row: number, col: number): string;
declare function pixelsToExcelWidth(pixels: number): number;
declare function excelWidthToPixels(width: number): number;
//#endregion
export { CellAddress, columnToIndex, excelWidthToPixels, formatCellAddress, indexToColumn, parseCellAddress, pixelsToExcelWidth };
//# sourceMappingURL=address.d.ts.map