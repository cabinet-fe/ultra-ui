---
'@veltra/sheet': minor
---

xlsx 导入链路性能优化（196 sheet / 76 万格实测）：

- **快照整表替换**：`replaceWorkbook` 内部改走新命令 `RestoreSheetCommand`（`sheet.restore-sheet`，
  `SnapshotPatch` 整表补丁）——替换/undo/redo 不再逐格 `setCells`（消除主线程十万级视图同步），
  新增 `content-reset` 事件供视图层 `setRecords` 全量刷新一次
- **批量结构事件**：`Workbook.beginBatch()/endBatch()` 合并结构事件补发（196 次 `sheets-change`
  风暴收敛为 1 次）；`replaceWorkbookWithSnapshots` 新入口直取 worker 快照数组（主线程不再
  restore 重建临时工作簿）
- **批量合并**：`Sheet.mergeCellsBatch(ranges)`（`sheet.command.merge-cells-batch`）——导入
  1016 个合并区域 1 次命令 = 单 undo 单元，批量内相交边收集边应用与逐条语义一致
- **样式 memo**：按 hucre 样式池共享子对象引用组合 key 缓存 StyleId，跳过重复样式解析与 intern
- **worker 进度反馈**：`buildWorkbookFromHucre` 分片构建，按 10% 粒度回报进度；sheet 自绘
  「遮罩 + 动画 + 文字」覆盖层（readXlsx 段「正在读取文件结构…」/ 分片段「正在解析… X/Y」）
- 选区对齐改静默（`selection.restoreState`），补漏遍历先解析行号省列解析
- 修复：整表替换后被清空的旧格纳入重算标脏（跨表引用方缓存联动）
