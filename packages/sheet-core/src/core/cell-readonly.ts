/**
 * 单元格只读标记的 Cell Meta namespace（payload 恒为 `true`）。
 *
 * 存储 / 撤销 / 快照序列化 / 行列结构平移全部复用 Cell Meta 机制；
 * 编辑拦截发生在 grid 层（SheetGrid 不开启编辑器、回写与填充柄跳过只读格），
 * 模型层不设防——与「SheetGrid readonly 模式」同款约定（见 AGENTS.md）。
 */
export const CELL_READONLY_META_NAMESPACE = 'cell-readonly'
