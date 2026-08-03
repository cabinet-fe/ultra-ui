# @veltra/sheet

电子表格包：基于 `@visactor/vtable`（ListTable）渲染，**数据模型完全自持有，VTable 只做视图层**。单元格读写、合并单元格、公式（含跨表引用）、undo/redo（命令系统）、填充柄、行高、右键合并菜单、工具栏扩展机制、`USheet` 组件。

```ts
import { USheet, Workbook, registerTool } from '@veltra/sheet'
import type { SheetProps, SheetExposed, SheetTool, SheetContext } from '@veltra/sheet'
import '@veltra/sheet/vue/style'
```

宿主需安装 peer `@veltra/desktop`（右键菜单）。

## 分层与入口选择

- **`USheet` 组件**（多数场景）：toolbar（工具注册表）+ grid + 底部 sheet tabs，一个组件即用。
- **无头 / 自组 UI**：`Workbook`（多 sheet + 共享公式依赖图）→ `Sheet`（统一操作入口）；
  `SheetGrid`（VTable 适配层，自行挂载到容器）。core 不依赖 vue/desktop，可单独测试与复用。
- 组件高度由宿主控制（grid 区 `flex:1`），需给 `.u-sheet` 一个高度。
- 交互：填充柄（复制 / 数字日期等差 / 公式 `$` 感知位移）、行高拖拽（稀疏存模型、不进 undo）、
  右键合并/取消合并、编辑中方向键只移光标。

## 核心约定

- 坐标 0-based：`{ row: 0, col: 0 }` 即 A1；`CellRange` 闭区间、start 恒为左上角。
- 一切写操作（`setCellValue` / `setCellFormula` / `mergeCells` / `setCells` …）都走命令系统，
  天然可 `undo()` / `redo()`；`'='` 前缀输入自动走公式路径。
- 合并：锚点恒为区域左上角、数据只存锚点；`getCellInfo` 区分普通格/锚点/被覆盖格。
- 读语义两种：`getCellData`（原始存储，被覆盖格 → undefined）/ `getDisplayValue`（锚点解析）。
- 公式：`f` 存原文、`v/t` 存计算缓存；跨表引用 `Sheet2!A1`；循环引用 → `#CYCLE!`；
  函数注册表可经 `registerFormulaFunction` 扩展。

## 工具扩展（toolbar）

工具栏渲染全局默认注册表（`defaultToolRegistry`）的内容；内置工具（撤销/重做/合并/取消合并）
与自定义工具同通道注册，可 `unregisterTool(id)` 移除或同 id 覆盖：

```ts
registerTool({
  id: 'insert-date',
  title: '插入当前日期',
  icon: Calendar,            // 可选，Vue 组件
  group: 'demo',             // 分组渲染，组间分隔符
  order: 0,                  // 组内排序
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: (ctx) => {
    const active = ctx.getSelection().activeCell
    if (active) ctx.setCellValue(active, new Date().toLocaleDateString('sv-SE'))
  }
})
```

- **`SheetContext` 是工具的唯一操作门面**：选区读写、取值、命令执行、
  `selection-change` / `history-change` 订阅；写方法全走命令系统（扩展天然可 undo），
  不暴露 Sheet 实例。tab 切换后上下文自动指向当前活动 sheet。
- 同 id 重复注册 = 替换（保留原位置）；`visible?(ctx)` / `disabled?(ctx)` 在状态变化时重新求值。
- 注册表全局共享：所有 `USheet` 实例显示同一组工具，各自上下文绑定各自工作簿。

## 组件 API 摘要

- **Props**：`workbook?`（缺省内部自建）、`rows?`(100)、`cols?`(26)、`showToolbar?`(true)、`showTabs?`(true)
- **Emits**：`active-sheet-change`
- **Exposed**（`SheetExposed`）：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`

## 已知限制

sheet 重命名/删除不联动公式引用缓存；跨表 undo 历史按 sheet 分栈；无单元格样式系统、
行列插入删除 UI（模型层预留）。详见 `packages/sheet/AGENTS.md`。
