//#region src/data/transform.d.ts
/** 定义转换方法的类型 */
type TransformMethod = (val: any) => any;
/**
 * 将字符串转换为 Uint8Array
 * @param data 输入字符串
 * @returns Uint8Array 类型的数据
 * @throws 当环境不支持转换时抛出错误
 */
declare function str2u8a(data: string): Uint8Array;
/**
 * 将 Uint8Array 转换为字符串
 * @param data Uint8Array 类型的数据
 * @returns 转换后的字符串
 * @throws 当环境不支持转换时抛出错误
 */
declare function u8a2str(data: Uint8Array): string;
/**
 * 将 Uint8Array 转换为十六进制字符串
 * @param u8a Uint8Array 类型的数据
 * @returns 十六进制字符串
 */
declare function u8a2hex(u8a: Uint8Array): string;
/**
 * 将十六进制字符串转换为 Uint8Array
 * @param hex 十六进制字符串
 * @returns Uint8Array 类型的数据
 */
declare function hex2u8a(hex: string): Uint8Array;
/**
 * 将 Base64 字符串转换为 Uint8Array
 * @param base64 Base64 字符串
 * @returns Uint8Array 类型的数据
 */
declare function base642u8a(base64: string): Uint8Array;
/**
 * 将 Uint8Array 转换为 Base64 字符串
 * @param u8a Uint8Array 类型的数据
 * @returns Base64 字符串
 */
declare function u8a2base64(u8a: Uint8Array): string;
/**
 * 将对象转换为 URL 查询字符串
 * @param obj 要转换的对象
 * @returns URL 查询字符串（不包含开头的 ?）
 */
declare function obj2query(obj: Record<string, any>): string;
/**
 * 将 URL 查询字符串转换为对象
 * @param query URL 查询字符串（可以包含开头的 ?）
 * @returns 转换后的对象
 */
declare function query2obj(query: string): Record<string, any>;
/**
 * 数据转换
 * @param data 需要转换的原始数据
 * @param transformChain 转换链，按顺序执行
 * @returns 转换后的数据
 */
declare function transform<T extends TransformMethod>(data: any, transformChain: [...TransformMethod[], T]): ReturnType<T>;
//#endregion
export { base642u8a, hex2u8a, obj2query, query2obj, str2u8a, transform, u8a2base64, u8a2hex, u8a2str };
//# sourceMappingURL=transform.d.ts.map