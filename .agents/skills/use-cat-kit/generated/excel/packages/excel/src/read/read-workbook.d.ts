import { ReadOptions, WorkbookInput } from "../types.js";
import { Workbook } from "../model/workbook.js";

//#region src/read/read-workbook.d.ts
declare function readWorkbook(input: WorkbookInput, options?: ReadOptions): Promise<Workbook>;
//#endregion
export { readWorkbook };
//# sourceMappingURL=read-workbook.d.ts.map