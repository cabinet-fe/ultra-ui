//#region src/data/type.d.ts
type DataType = 'object' | 'array' | 'string' | 'number' | 'blob' | 'date' | 'undefined' | 'function' | 'boolean' | 'file' | 'formdata' | 'symbol' | 'promise' | 'null' | 'arraybuffer';
/**
 * 获取值对应的类型字符串
 * @param value 值
 * @returns 类型字符串
 */
declare function getDataType(value: any): DataType;
/**
 * 是否是对象
 * @param value 值
 */
declare function isObj(value: any): value is Record<string, any>;
/**
 * 是否是数组。实现委托 `Array.isArray`，与原生「是否为数组」的结论一致（含跨 realm 等边界）。
 * 若仅需布尔判断且不需要本包导出的类型守卫，可直接使用 `Array.isArray`。
 * @param value 值
 */
declare function isArray(value: any): value is Array<any>;
/**
 * 是否是字符串
 * @param value 值
 */
declare function isString(value: any): value is string;
/**
 * 是否是数字
 * @param value 值
 */
declare function isNumber(value: any): value is number;
/**
 * 是否是Blob
 * @param value 值
 */
declare function isBlob(value: any): value is Blob;
/**
 * 是否是
 * @param value 值
 */
declare function isDate(value: any): value is Date;
/**
 * 是否是函数
 * @param value 值
 */
declare function isFunction(value: any): value is Function;
/**
 * 是否是布尔值
 * @param value 值
 */
declare function isBool(value: any): value is boolean;
/**
 * 是否是文件
 * @param value 值
 */
declare function isFile(value: any): value is File;
/**
 * 是否是表单数据
 * @param value 值
 */
declare function isFormData(value: any): value is FormData;
/**
 * 是否是Symbol
 * @param value 值
 */
declare function isSymbol(value: any): value is symbol;
/**
 * 是否是Promise
 * @param value 值
 */
declare function isPromise(value: any): value is Promise<any>;
/**
 * 是否是ArrayBuffer
 * @param value 值
 */
declare function isArrayBuffer(value: any): value is ArrayBuffer;
/**
 * 是否是Uint8Array
 * @param value 值
 */
declare function isUint8Array(value: any): value is Uint8Array;
/**
 * 是否是Uint16Array
 * @param value 值
 */
declare function isUint16Array(value: any): value is Uint16Array;
/**
 * 是否是Uint32Array
 * @param value 值
 */
declare function isUint32Array(value: any): value is Uint32Array;
/**
 * 是否是Int8Array
 * @param value 值
 */
declare function isInt8Array(value: any): value is Int8Array;
/**
 * 是否是Int16Array
 * @param value 值
 */
declare function isInt16Array(value: any): value is Int16Array;
/**
 * 是否是Int32Array
 * @param value 值
 */
declare function isInt32Array(value: any): value is Int32Array;
/**
 * 是否是null
 * @param value 值
 */
declare function isNull(value: any): value is null;
/**
 * 是否是未定义
 * @param value 值
 */
declare function isUndef(value: any): value is undefined;
/**
 * 是否是空值, 当值为null或undefined时返回true
 * @param value 值
 */
declare function isEmpty(value: any): boolean;
//#endregion
export { getDataType, isArray, isArrayBuffer, isBlob, isBool, isDate, isEmpty, isFile, isFormData, isFunction, isInt16Array, isInt32Array, isInt8Array, isNull, isNumber, isObj, isPromise, isString, isSymbol, isUint16Array, isUint32Array, isUint8Array, isUndef };
//# sourceMappingURL=type.d.ts.map