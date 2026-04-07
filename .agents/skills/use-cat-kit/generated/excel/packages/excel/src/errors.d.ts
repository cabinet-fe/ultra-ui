//#region src/errors.d.ts
declare class ExcelError extends Error {
  readonly code: string;
  readonly path?: string;
  constructor(message: string, code: string, path?: string);
}
declare class ExcelParseError extends ExcelError {
  constructor(message: string, code?: string, path?: string);
}
declare class ExcelWriteError extends ExcelError {
  constructor(message: string, code?: string, path?: string);
}
declare class ExcelSchemaError extends ExcelError {
  constructor(message: string, code?: string, path?: string);
}
declare class ExcelValueError extends ExcelError {
  constructor(message: string, code?: string, path?: string);
}
//#endregion
export { ExcelError, ExcelParseError, ExcelSchemaError, ExcelValueError, ExcelWriteError };
//# sourceMappingURL=errors.d.ts.map