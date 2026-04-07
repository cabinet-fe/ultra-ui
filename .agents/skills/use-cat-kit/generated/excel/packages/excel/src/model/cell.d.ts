import { CellStyle, CellValue } from "../types.js";

//#region src/model/cell.d.ts
declare class Cell {
  value: CellValue;
  style?: CellStyle;
  constructor(value?: CellValue, style?: CellStyle);
  setValue(value: CellValue): this;
  setStyle(style?: CellStyle): this;
  clone(): Cell;
}
//#endregion
export { Cell };
//# sourceMappingURL=cell.d.ts.map