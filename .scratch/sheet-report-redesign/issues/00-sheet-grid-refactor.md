Status: completed

# 00 — `@veltra/sheet-core` `SheetGrid` 模块化拆分重构

**What to build:** 
重构 `packages/sheet-core/src/grid/sheet-grid.ts`（当前 1434 行庞大类），按职责拆分为高内聚、低耦合的控制器与引擎模块（`GridStyleResolver`、`GridSelectionController`、`GridRowHeightEngine`、`GridSyncManager`、`GridEditorRouter`、`GridCoords`），将 `sheet-grid.ts` 主文件压缩至 300 行以内。
重构必须保障 **100% 向下兼容（0 Breaking Changes）**，无额外性能代理损耗，并在 `GridStyleResolver` 中直接预留后续 Ticket 01 的 `resolveCellStyle` Hook 扩展点。

**Blocked by:** None — can start immediately.

- [x] 拆分 `grid-coords.ts` 处理坐标转换与实测偏移计算 (`toSheetAddr`, `toTableCoord`, `getOffsets`, `hitTestSheetAddr`)
- [x] 拆分 `grid-editor-router.ts` 管理 `FormulaAwareInputEditor` 全局单例与 `WeakMap` 编辑路由
- [x] 拆分 `grid-style-resolver.ts` 管理静态与动态样式计算、共享边溯源，并预留 `resolveCellStyle` 视图钩子扩展点
- [x] 拆分 `grid-row-height-engine.ts` 管理行高配置、Wrap 自动计算与行高同步
- [x] 拆分 `grid-selection-controller.ts` 管理 VTable ↔ 模型选区双向同步、选区图层复位与引用选择拦截
- [x] 拆分 `grid-sync-manager.ts` 管理微任务批量同步、`pendingTableSync` 提交队列与视图局部重绘
- [x] `sheet-grid.ts` 精简为 Facade 入口类，代码量控制在 300 行以内
- [x] 运行 `bun run test`，全量测试套件（含 `sheet-grid.test.ts`, `sheet-grid-readonly.test.ts`, `sheet-grid-frozen.test.ts`, `sheet-grid-formula.test.ts`）100% 一次性通过，零单测代码修改
- [x] 运行 `bun run lint` 确认无类型与 Oxlint 错误
