# fe — 虚拟列表

## 何时使用

大数据列表/表格只渲染可见区域（单轴，无 grid/masonry）。

## 推荐公开 API

`Virtualizer` 及类型：`VirtualizerOptions`、`VirtualSnapshot`、`VirtualItem` 等

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- `connect` / DOM 测量 / 滚动需浏览器元素；可无 DOM 构造
- 组件卸载调用 `destroy()`；`getItemKey` 对同一数据项须稳定
- `subscribe` 立即触发，之后仅结构性变化；纯 offset 位移不回调
- 默认 `useMeasuredAverage: true`：一个真实测量会影响未测项估值
- `scrollToOffset` 的 `align` 被忽略；smooth 滚动不立即更新 `snapshot.offset`

## 类型入口

[virtualizer/index.d.ts](../../../generated/fe/virtualizer/index.d.ts)
