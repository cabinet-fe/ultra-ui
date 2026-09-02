//#region src/data/any.d.ts
/**
 * 深拷贝任意值。
 *
 * 优先 native `structuredClone`。Proxy（Vue 3 响应式也是 Proxy）不能结构化克隆：
 * 能探测到则直接图遍历，否则捕获抛错再回退。不向外抛错。
 *
 * @param value 任意值
 * @returns 拷贝后的快照（原始值与函数原样返回）
 */
declare function copy<T>(value: T): T
//#endregion
export { copy }
