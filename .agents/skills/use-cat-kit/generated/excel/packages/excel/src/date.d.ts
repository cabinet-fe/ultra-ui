import { DateSystem } from "./types.js";

//#region src/date.d.ts
declare function excelSerialToDate(serial: number, dateSystem?: DateSystem): Date;
declare function dateToExcelSerial(date: Date, dateSystem?: DateSystem): number;
//#endregion
export { dateToExcelSerial, excelSerialToDate };
//# sourceMappingURL=date.d.ts.map