---
'@veltra/sheet': major
'@veltra/desktop': minor
---

删除 @veltra/sheet-core 包：模型 / 命令 / 公式 / IO / SheetGrid 全部直连 npm 包 infinitable（^0.1.3）

- @veltra/sheet：peer 移除 `@veltra/sheet-core`，新增依赖 `infinitable@^0.1.3`；引擎符号从 `infinitable/sheet` 导入，公式注册表 API（registerFormulaFunction / listFormulaFunctions / formulaError）从 `infinitable` 主入口导入；函数面板与补全切换官方 FormulaFunctionInfo 形状（meta.params 为 `{ name, optional? }` 对象数组，分类口径以官方注册表为准，如 SUM 归「常用」）
- @veltra/desktop：file-viewer 的 Excel/CSV 预览改经动态 `import('infinitable/sheet')`（infinitable 升 ^0.1.3，不再是 optional peer 降级场景）；smart-table 不变
- 公式自定义函数注册形状：`registerFormulaFunction(name, { meta: { params: [{ name }], description }, impl })`（旧字符串数组 params 不再接受）
- 上游配套：infinitable 0.1.3 新增导出 NumFmt / TypedEventEmitter / replaceWorkbookWithSnapshots（+SheetReplaceItem）
