import { CellStyle, CellValue } from "../types.js";
import { Cell } from "./cell.js";

//#region src/model/row.d.ts
declare class Row {
  readonly index: number;
  private readonly cells;
  constructor(index: number);
  cell(column: number | string): Cell;
  setCell(column: number | string, value: CellValue, style?: CellStyle): this;
  getCell(column: number | string): Cell | undefined;
  getCells(): Array<[column: number, cell: Cell]>;
  toValues(): CellValue[];
  private resolveColumn;
}
//#endregion
export { Row };
//# sourceMappingURL=row.d.ts.map