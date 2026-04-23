# 修复虚拟表格滚动时页面与滚动条抖动

## 补丁内容

patch-2 将 `u-table` 的虚拟滚动位移从 `tbody` 的 `transform` 迁移到前后 `<tbody><tr><td colspan>` 占位（`beforeSize` / `afterSize` spacer）后，表格列宽塌陷问题解决；但在实际运行时仍复现「滚动容器在滚动时页面抖动、滚动条 thumb 抖动」的现象，用户反馈问题未真正修复。

启动 playground `table/index`（200 行）并在 `useVirtual` 内插装 `subscribe` 日志后，观察到两条决定性证据：

1. 初次挂载时 `totalSize` 从估值 200×52=10400px 在首批 16 行被测量后迅速跌到 200×41=8200px（**estimateSize 与真实行高严重偏差**），这 2200px 的位移直接映射为容器 `scrollHeight` 跳变，滚动条 thumb 抖动；
2. 随后任意方向的小幅滚动都会让 `totalSize` 继续「漏气」下滑，甚至出现 `t=820` 的断崖值（远低于任何合理估算）。审阅 `node_modules/@cat-kit/fe/dist/virtualizer/index.js` 发现其内部 `ResizeObserver` 在元素被 Vue 卸载脱离 DOM 后仍持有观察，浏览器随后会派发一次 `size=0` 的 ResizeObserverEntry 回调，而适配层此前的 `measureElement(el)` 在 `el == null` 时直接 early-return，既未调用 `v.measureElement(index, null)` 解绑，也未阻止 `0` 进入 `measuredSizes` 缓存 → `totalSize` 被污染。

本补丁对上述两个根因分别修复：

### 1. `useVirtual.measureElement` 改为显式 `(el, index)` 双参，并做两件事

- 无论 `el` 为 `Element` 还是 `null`，都调用 `v.measureElement(index, el)`。传 `null` 时底层会把该 index 从 ResizeObserver 中解绑，避免被卸载的 `<tr>` 以 `size=0` 污染尺寸缓存（这是 `totalSize` 「清零」的根因）。
- 首次取得真实尺寸后调用 `v.setOptions({ estimateSize: () => measured })` 做**一次性校准**：后续未渲染项的预估值等于真实行高，滚动时新进入视口的项被测量后不再把 `totalSize` 朝 `actual - estimate` 方向拉动，从源头消除 thumb 抖动与页面抖动。`Virtualizer` 只会用新估值重算未缓存项，不会覆盖已测量的真实尺寸，校准安全。

### 2. 所有消费者的 ref 回调同步改造，显式透传 `index`

`measureElement` 签名变化 ⇒ 必须让 `u-table`、`u-tree`、`u-select`、`u-multi-select` 四个虚拟分支消费者及其子组件把虚拟项在 rows/nodes/options 数组中的**绝对索引**传给适配层：

- `u-table`：
  - `table-body.vue` 的 `v-for` 把 `{ row, index, stripeIndex }` 解构后把 `index` 显式传给 `UExpandTableRow` / `UTableRow`。
  - `table-row.tsx` 的 `UTableRow` / `UExpandTableRow` 新增 `index: number` prop，内部用 `measureRef = (el) => measureElement(el as Element | null, props.index)` 做 functional ref 绑定。
  - `table.vue` 的 `estimateSize` 从 `() => 52` 调整为 `() => 41`（真实默认行高），把初次挂载阶段 `totalSize` 的跳变从 2200px 压到约 0px；校准逻辑仍会覆盖到主题覆写后的任意行高。
- `u-tree`：`tree.vue` 把 `v-for` 里的 `index` 透传到 `UTreeNode`；`tree-node.vue` 的 `:ref` 由 `measureElement` 改为本地 `measureRef` 函数；`types/tree.ts` 的 `TreeNodeProps` 补 `index?: number` 并更新 `measureElement` 签名。
- `u-multi-select`：`multi-select.vue` 的 `v-for` 透传 `index`；`multi-select-option.vue` 新增 `index?` prop + 本地 `measureRef`。
- `u-select`：`select.vue` 的 `li` `:ref` 改为箭头函数 `(el) => measureElement(el as Element | null, index)`，直接从 `v-for` 的 `index` 拿索引。

### 3. 验证

在 playground 中临时加入 `+50 / +200 / +1000 / reset` 四个 `scrollTop` 操控按钮与 `subscribe` 日志，观察到：

- 初始挂载 `[uV] {"t":8200,"b":0,"a":7544,"o":0}`：与 200×41 完全一致，无 2200px 跳变；
- +50 / +200 / +1000 / reset 以及连续 +50 小步滚动过程中，每一条日志的 `t` 均**稳定保持 8200**，`b+a+rendered≈t` 恒成立；
- 视觉上页面与滚动条 thumb 不再抖动。

验证通过后删除 playground 的临时按钮与 `useVirtual` 内的 `console.debug` 日志。

## 影响范围

- 修改文件: `packages/compositions/src/use-virtual/index.ts`
- 修改文件: `packages/desktop/src/components/table/table.vue`
- 修改文件: `packages/desktop/src/components/table/table-body.vue`
- 修改文件: `packages/desktop/src/components/table/table-row.tsx`
- 修改文件: `packages/desktop/src/components/tree/tree.vue`
- 修改文件: `packages/desktop/src/components/tree/tree-node.vue`
- 修改文件: `packages/desktop/src/components/select/select.vue`
- 修改文件: `packages/desktop/src/components/multi-select/multi-select.vue`
- 修改文件: `packages/desktop/src/components/multi-select/multi-select-option.vue`
- 修改文件: `packages/desktop/src/types/tree.ts`
