import { ReadStreamOptions, StreamEvent, WorkbookInput } from "../types.js";

//#region src/read/read-workbook-stream.d.ts
declare function readWorkbookStream(input: WorkbookInput, options?: ReadStreamOptions): AsyncIterable<StreamEvent>;
//#endregion
export { readWorkbookStream };
//# sourceMappingURL=read-workbook-stream.d.ts.map