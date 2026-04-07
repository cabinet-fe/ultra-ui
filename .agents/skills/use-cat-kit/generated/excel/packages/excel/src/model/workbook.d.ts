import { WorkbookMetadata, WorksheetOptions } from "../types.js";
import { Worksheet } from "./worksheet.js";

//#region src/model/workbook.d.ts
declare class Workbook {
  metadata: WorkbookMetadata;
  private readonly sheetList;
  private readonly sheetNameSet;
  constructor(metadata?: WorkbookMetadata);
  addWorksheet(name: string, options?: WorksheetOptions): Worksheet;
  getWorksheet(nameOrIndex: string | number): Worksheet | undefined;
  get worksheets(): Worksheet[];
  removeWorksheet(name: string): boolean;
}
//#endregion
export { Workbook };
//# sourceMappingURL=workbook.d.ts.map