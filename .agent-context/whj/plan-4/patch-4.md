# format-svg 适配 SVGO 4.x

## 补丁内容

SVGO 4.x 的 `optimize` 类型与运行时行为为：成功时仅返回 `{ data: string }`，解析失败或未知插件等错误通过 **抛异常** 表达，不再返回带 `error` 字段的结果对象。

`format-svg.ts` 原先按 SVGO 3 风格分支判断 `'data' in out` / `'error' in out`。已改为在 `try/catch` 中调用 `optimize`，用 `catch` 统一记录路径并退出；写回逻辑仍仅在 `data !== input` 时执行。

## 影响范围

- 修改文件: `packages/icons/scripts/format-svg.ts`
