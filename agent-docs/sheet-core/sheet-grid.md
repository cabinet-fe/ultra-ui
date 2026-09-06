---
title: SheetGrid 渲染层
description: 从 @veltra/sheet-core/grid 使用 SheetGrid、readonly 与 cell hook
---

`SheetGrid` 是 VTable 适配层：数据仍在 `Sheet` 模型上，表格只负责渲染与输入。它**不在** `@veltra/sheet-core` 主入口，必须从 `@veltra/sheet-core/grid` 导入，以免无头 `import { Workbook }` 把 `@visactor/vtable` 类型图拉进 TS 程序。

该入口公开：`SheetGrid`、`CustomLayout`，以及类型 `SheetGridOptions` / `SheetGridContextMenuInfo` / `SheetGridContextMenuKind` / `ResolveCellRenderer` / `ResolveDisplayValue` / `ResolveCellStyleHook` / `ICustomLayoutObj`。不要把未从此入口导出的内部类（例如图片叠层实现）当公开 API。

```ts
import { Sheet } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid'

const sheet = new Sheet('Sheet1')
const grid = new SheetGrid({
  container: document.getElementById('stage')!, // 宿主需给容器高度
  sheet,
  rows: 100, // 渲染行数，默认 100
  cols: 26, // 渲染列数，默认 26
  showRowHeader: true,
  showColHeader: true,
  onContextMenu: (info) => {
    // info.kind: 'body' | 'row-header' | 'col-header'
  }
})

grid.undo()
grid.redo()
grid.refresh()
grid.getTable() // 底层 ListTable，仅在确实需要时使用
grid.release()
```

`destroy()` 与 `release()` 等价。`setVisible(false)` 挂起模型→视图同步（例如 LRU 隐藏实例）；重新可见时一次性补齐。

## readonly

`SheetGridOptions.readonly: true` 面向只读预览（如 desktop file-viewer 的 Excel/CSV）：

- 关闭：单元格编辑器与编辑回写、填充柄、行/列拖拽改尺寸、undo/redo 快捷键；浮动图禁止拖动与 Delete 删除（仍可点击选中）。
- 保留：渲染、选区、滚动、键盘导航、`onContextMenu`。
- 模型层不设防：绕过 grid 直接调命令仍能写。只读场景不要再暴露写 API。

```ts
const grid = new SheetGrid({ container, sheet, readonly: true })
```

单元格级只读见 `model.md` 的 `setCellReadonly` / `setRangeReadonly`：拦截同样在 grid（不开启编辑器、回写守卫、填充柄跳过只读目标）。整表 `readonly: true` 时也不会挂列级 editor。

## cell hook

三个可选 hook 都跑在渲染热路径上，必须是**纯函数、同步、O(1) 查找**，禁止异步、副作用和大对象分配。返回 `undefined` 即回落默认行为。hook **不写模型、不进快照**。

| 选项 | 时机 | 用途 |
| --- | --- | --- |
| `resolveDisplayValue(addr, base)` | 构建 record（数据变更才触发） | 覆盖显示值 |
| `resolveCellStyle(addr, baseStyle)` | 每次场景图重绘（最热） | 叠加样式，例如填报输入区高亮 `{ ...baseStyle, fill }` |
| `resolveCellRenderer(addr, base)` | 视口格布局 | 返回 `ICustomLayoutObj` 自定义格形态 |

`resolveCellRenderer` **仅在宿主传入时才安装**列级 `customLayout` 分发器（安装后 VTable 对该列关闭 fast-update）。布局对象用本入口 re-export 的 `CustomLayout` 构建。格内嵌入走 renderer；跨格浮动内容走内置图片叠层，不要用 renderer 模拟浮动层。

```ts
import { SheetGrid, CustomLayout, type ResolveCellRenderer } from '@veltra/sheet-core/grid'

const resolveCellRenderer: ResolveCellRenderer = (addr) => {
  if (addr.col !== 0) return undefined
  return {
    rootContainer: new CustomLayout.Container({ width: 80, height: 28 }),
    renderDefault: true
  }
}

new SheetGrid({ container, sheet, resolveCellRenderer })
```

`onEditStart` / `onEditEnd` 在进入/退出编辑时回调模型地址。`interceptSelection` / `onSelectionIntercept` 供宿主拦截选区。
