//#region src/data/transform.d.ts
/** 定义转换方法的类型 */
type TransformMethod = (val: any) => any;
/**
 * 将字符串转换为 Uint8Array
 *
 * 优先使用标准 `TextEncoder`；不可用时在 Node 回退到 `Buffer`，以统一跨环境入口。
 * 与手写 `new TextEncoder().encode` 等价（在支持 `TextEncoder` 的环境下）。
 *
 * @param data 输入字符串
 * @returns Uint8Array 类型的数据
 * @throws 当环境不支持转换时抛出错误
 */
declare function str2u8a(data: string): Uint8Array;
/**
 * 将 Uint8Array 转换为字符串
 *
 * 优先使用标准 `TextDecoder`；不可用时在 Node 回退到 `Buffer`，以统一跨环境入口。
 *
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
 * @param hex 十六进制字符串（可选 `0x` 前缀；忽略首尾空白）
 * @returns 空串或仅空白时返回长度为 0 的 `Uint8Array`
 * @throws 长度为奇数、或含非十六进制字符时抛出 `Error`
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
 *
 * **并非** `URLSearchParams` 的常规表单语义：空值与 `encodeURIComponent(JSON.stringify(value))` 序列化非原始值，
 * 与原生查询串互操作前请先对照行为，避免误替换导致不一致。
 *
 * @param obj 要转换的对象
 * @returns URL 查询字符串（不包含开头的 ?）
 */
declare function obj2query(obj: Record<string, any>): string;
/**
 * 将 URL 查询字符串转换为对象
 *
 * 与 {@link obj2query} 成对：`JSON.parse` 可解析的值还原为对象/数组等，否则保留解码后的字符串。
 * 与仅用 `URLSearchParams` 解析的键值对语义不同，勿与原生 API 混用假设。
 *
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