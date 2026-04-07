import { CellStyle, CellValue, WorksheetColumn, WorksheetOptions } from "../types.js";
import { Cell } from "./cell.js";
import { Row } from "./row.js";

//#region src/model/worksheet.d.ts
declare class Worksheet {
  name: string;
  readonly options: WorksheetOptions;
  private readonly rows;
  private readonly columns;
  constructor(name: string, options?: WorksheetOptions);
  row(index: number): Row;
  getRow(index: number): Row | undefined;
  addRow(values: CellValue[]): Row;
  setCell(address: string, value: CellValue, style?: CellStyle): this;
  getCell(address: string): Cell | undefined;
  setColumn(index: number, column: WorksheetColumn): this;
  getColumn(index: number): WorksheetColumn | undefined;
  getColumns(): Array<[index: number, column: WorksheetColumn]>;
  getRows(): Row[];
  maxRowIndex(): number;
  maxColIndex(): number;
}
//#endregion
export { Worksheet };
//# sourceMappingURL=worksheet.d.ts.map