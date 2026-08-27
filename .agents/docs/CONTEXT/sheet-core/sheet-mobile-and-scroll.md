# SheetCore 移动端触控滚动与 PC 端图片区域滚轮支持

## 术语

- **ImageLayer**：表格浮动图片图层，管理浮动图片 DOM 渲染、选中与拖拽定位。
- **SheetGrid**：表格视图核心容器，封装底层 VTable 实例并统一管理交互手势与图层生命周期。

## 领域

`SheetGrid` 与 `ImageLayer`（`packages/sheet-core/src/grid`）协同支持跨 PC 与移动端触控设备的滚动与手势交互：
1. **PC 端浮动图片滚轮滚动**：`ImageLayer` 监听浮动图片节点的 `wheel` 滚轮事件，将垂直与水平滚动增量直接转发至表格实例更新滚动位置，销毁时自动注销监听器。
2. **移动端触控拖拽滚动**：`SheetGrid` 监听单指 `TouchEvent` 及触控/触控笔 `PointerEvent`，按手指滑动增量平滑滚动表格内容，销毁时自动清理监听器。
3. **触控场景下图片拖拽与表格滚动互斥联动**：
   - 只读模式（`readonly: true`）下，触控滑动不拦截且不平移图片，直接触发表格内容滚动；
   - 非只读模式下，未选中图片上的触摸滑动优先触发表格滚动，轻触抬起时才选中图片；
   - 图片处于选中状态且拖拽超过阈值时平移图片锚点，并阻止底层表格触控滚动，避免手势冲突。

## 影响文件

- 修改：`packages/sheet-core/src/grid/image-layer.ts`
- 修改：`packages/sheet-core/src/grid/sheet-grid.ts`
- 修改：`packages/sheet-core/src/grid/__test__/image-layer.test.ts`
- 修改：`packages/sheet-core/src/grid/__test__/sheet-grid.test.ts`

## 更新记录

- 2026-08-27：归档自 cooking/sheet-mobile-and-scroll
