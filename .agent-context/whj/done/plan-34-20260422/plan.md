# 用 @cat-kit/fe Virtualizer 替代 @tanstack/vue-virtual

> 状态: 已执行

## 目标

将 `@veltra/compositions` 中 `useVirtual` 组合式函数的底层实现从 `@tanstack/vue-virtual` 切换为 `@cat-kit/fe` 的 `Virtualizer`：

- 统一 monorepo 工具链：该仓库已广泛使用 `@cat-kit/*` 生态（`@cat-kit/core`、`@cat-kit/be` 等），移除 `@tanstack/vue-virtual` 这一外部依赖可降低生态分叉、减少维护面。
- `@cat-kit/fe` Virtualizer 已具备虚拟滚动所需的完整能力（增量测量、`mount/unmount`、`scrollToIndex`、订阅式快照、水平方向支持）。
- 保持 `useVirtual` 的**公共契约不变**（`Options` / `VirtualReturned` / `CustomVirtualItem` 的 `key` 字段），使 `@veltra/desktop` 下 `tree / table / select / multi-select` 及其子组件（`tree-node / table-row / multi-select-option`）**零改动**。

## 内容

### 步骤 1：核对 API 差异映射并固化适配规则

对比两个库的差异并在适配层实现以下明确映射（作为步骤 2 重写的输入）：

| 维度 | `@tanstack/vue-virtual` | `@cat-kit/fe` Virtualizer | 适配策略 |
|------|-------------------------|---------------------------|----------|
| 构造与挂载 | `new Virtualizer(options)` + `_didMount()` + `_willUpdate()` + `setOptions()` | `new Virtualizer(options)` + `mount(el)` / `unmount()` + `setOptions()` / `setCount()` | 用 `watch(scrollEl)` 切换 `mount`/`unmount`；用 `watch(count)` 调用 `setCount`；`onScopeDispose` 调用 `destroy()` |
| 获取滚动元素 | `getScrollElement: () => el` 选项 | 由外部通过 `mount(el)` 传入 | 在 composable 内部持有 `scrollEl` 引用，通过 watch 驱动 `mount/unmount` |
| `observeElementRect` / `observeElementOffset` / `scrollToFn` | 需显式传入 | 内部封装 `ResizeObserver` + `scroll` 监听 | 不再暴露，由 `@cat-kit/fe` 内部处理 |
| 启用/禁用 | `enabled: boolean` 选项 | 无原生开关 | 在 composable 层实现：`enabled=false` 时跳过 `mount`、`virtualList=[]`、`totalHeight=0` |
| 列表项间距 | `gap` 选项（项间距，不影响末尾） | 无原生 `gap` | 适配层包装 `estimateSize`：`(i) => base(i) + (i === count-1 ? 0 : gap)`；在 `measureElement(el)` 包装中：对非末项用 `resizeItem(index, rect.height + gap)`，末项用 `rect.height`（避免末尾多出一个 gap） |
| overscan | `overscan: 3`（硬编码） | `overscan` 选项，默认保持 `3` | 直接透传 |
| 变更通知 | `onChange: (v) => void` 回调 | `onChange` 选项 **或** `subscribe(listener)` 订阅 | 统一用 `subscribe`（返回 unsubscribe），在 `onScopeDispose` 解绑 |
| VirtualItem | `{ index, start, end, size, key, lane }` | `{ index, start, end, size }` | 适配层在映射时补 `key: item.index`（保持 `CustomVirtualItem.key` 字段，为现有消费者的 `:key` 绑定提供稳定主键） |
| `measureElement` 调用签名 | 实例方法 `measureElement(el)`，内部从 `el.dataset.index` 解析 index | 实例方法 `measureElement(index, el)`，必须显式传 index | composable 导出的 `measureElement(el)` 保持单参签名：内部读取 `el?.dataset?.index` → `Number(index)`，`NaN` 时直接返回；命中有效 index 则按上表 `gap` 规则调用 `v.resizeItem(index, size)`（不使用 `v.measureElement`，因为我们需要在 gap 场景下介入尺寸）；无 gap 场景则调用 `v.measureElement(index, el)` |
| `scrollTo(index)` | `v.scrollToIndex(index, { align: 'center' })` | `v.scrollToIndex(index, { align: 'center' })` | 签名一致，直接调用，保持 `align: 'center'` |
| 快照读取 | `v.getTotalSize()` / `v.getVirtualItems()` | 订阅器参数 `snapshot.totalSize` / `snapshot.items`（亦可 `v.getSnapshot()`） | 统一在 `subscribe` 回调中写入 `totalHeight.value = snapshot.totalSize` 与 `virtualList.value = snapshot.items.map(item => ({ ...item, key: item.index }))` |
| 水平方向 | 默认垂直，可 `horizontal` | 支持 `horizontal` 选项 | 现有 `Options` 未暴露，保持未暴露（后续需要再扩展） |

### 步骤 2：重写 `packages/compositions/src/use-virtual/index.ts`

按步骤 1 的映射表重写，约束如下：

1. **导入变更**：删除 `@tanstack/vue-virtual` 的 `elementScroll / observeElementOffset / observeElementRect / Virtualizer / VirtualItem` 导入，改为 `import { Virtualizer, type VirtualItem } from '@cat-kit/fe'`。
2. **公共类型保持不变**：
   - `interface Options`：字段与注释保持原样（`virtualThreshold / count / scrollEl / estimateSize / gap`）。
   - `type CustomVirtualItem = Omit<VirtualItem, 'key'> & { key: number | string }`：由于新 `VirtualItem` 本身不含 `key`，改为 `type CustomVirtualItem = VirtualItem & { key: number | string }`，对外导出保持同名。
   - `VirtualReturned` 字段清单不变（`virtualList / totalHeight / measureElement / scrollTo / virtualEnabled`）。
3. **内部实现**：
   - 用 `computed` 计算 `enabled`（保留现有 `virtualThreshold` 逻辑）。
   - `shallowRef<CustomVirtualItem[]>([])` 与 `shallowRef(0)` 初始值不变。
   - `new Virtualizer({ count, overscan: 3, estimateSize: wrappedEstimate })`；`wrappedEstimate` 处理 `gap`（见步骤 1 表格）与默认 `() => 34`（沿用 `defaultEstimateSize`）。
   - `v.subscribe((snapshot) => { if (!enabled.value) return; totalHeight.value = snapshot.totalSize; virtualList.value = snapshot.items.map(item => ({ ...item, key: item.index })) })`。
   - `watch(scrollEl, (el, _, onCleanup) => { if (!enabled.value || !el) { v.unmount(); return } v.mount(el); onCleanup(() => v.unmount()) }, { immediate: true })`。
   - `watch(count, (c) => v.setCount(c))`（或合并到 `watch([count, enabled], ...)`，启用切换时对齐状态）。
   - `watch(enabled, (on) => { if (!on) { virtualList.value = []; totalHeight.value = 0; v.unmount() } else if (scrollEl.value) v.mount(scrollEl.value) })`。
   - `onScopeDispose(() => { unsubscribe(); v.destroy() })`。
4. **导出函数**：
   - `scrollTo(index)` → `v.scrollToIndex(index, { align: 'center' })`。
   - `measureElement(el)`：按步骤 1 表格规则实现（解析 `data-index`、处理 `gap`、支持 `el` 为 `null` / 禁用状态的早退）。
5. **限制**：本步骤只修改此单文件；不得更改 `VirtualReturned` 字段名与语义、不得修改任何消费者组件（`tree / table / select / multi-select / tree-node / table-row / multi-select-option`）。

### 步骤 3：更新 `packages/compositions/package.json`

- `dependencies` 中：删除 `"@tanstack/vue-virtual": "^3.13.23"`，新增 `"@cat-kit/fe": "^1.0.5"`（对齐 `.agents/skills/cat-kit-fe/generated/manifest.json` 的 `1.0.5`；若安装时发现更高稳定版本则使用该版本，并在影响范围中记录）。
- 其他字段（`name / version / files / exports / scripts / peerDependencies`）保持不变。

### 步骤 4：更新 `packages/compositions/tsdown.config.ts`

- 将 `deps.neverBundle` 数组中的 `'@tanstack/vue-virtual'` 替换为 `'@cat-kit/fe'`；其他条目（`@veltra/utils / @cat-kit/core / vue / @floating-ui/dom`）保持不变。

### 步骤 5：安装依赖并校验类型

按以下顺序执行：

1. 在仓库根目录执行 `bun install`（仓库 `packageManager` 为 `bun@1.3.11`），确保 `bun.lock` 更新（新增 `@cat-kit/fe`、移除 `@tanstack/vue-virtual` 及其传递依赖 `@tanstack/virtual-core`）。
2. `cd packages/compositions && bun run check-types`：应无错误（尤其是 `VirtualItem` 的字段变化不应影响外部消费者，因为 `CustomVirtualItem` 仍包含 `index / start / end / size / key`）。
3. `cd packages/desktop && bun run check-types`：验证 `tree / table / select / multi-select / tree-node / table-row / multi-select-option` 对 `useVirtual` 返回值与 `measureElement` 签名的消费仍类型通过。
4. 若出现类型错误，优先检查：
   - `CustomVirtualItem.key` 是否仍存在（`:key="item.key"` 消费者）；
   - `measureElement` 是否仍为单参函数 `(el: any) => void`；
   - `VirtualReturned` 字段名与 `ShallowRef` 类型是否一致。
   只允许回到步骤 2 调整适配层，不得放宽契约或修改消费者。

### 步骤 6：冒烟运行（构建与 Playground）

1. 在 `packages/compositions` 执行 `bun run build`，确认 `tsdown` 产物无警告、`@cat-kit/fe` 被 `neverBundle` 正确外化、无 `@tanstack/vue-virtual` 残留。
2. 在 `playgrounds/desktop` 启动开发服务器（若存在对应脚本），手动/通过浏览器 MCP 打开使用虚拟滚动的页面（table 大量行、select/multi-select 大量选项、tree 大量节点各一例），验证：
   - 列表能正常渲染、滚动；
   - 滚动到某索引（`scrollTo`）仍定位到中心；
   - `virtualThreshold` 边界：count 小于阈值时走非虚拟分支，大于阈值时走虚拟分支；
   - `gap` 效果（tree `gap: 2`、select `gap: 4`）视觉上与重构前一致、无末尾多余空白。
3. 若 playground 无配套脚本，仅执行步骤 1 的构建验证，并在补丁里记录“仅通过类型 + 构建校验，未做运行时冒烟”。

## 影响范围

- `packages/compositions/src/use-virtual/index.ts`：底层实现从 `@tanstack/vue-virtual` 切到 `@cat-kit/fe` 的 `Virtualizer`；保留 `Options / VirtualReturned / CustomVirtualItem.key` 对外契约；改用 `mount/unmount` + `subscribe` 驱动快照；`CustomVirtualItem` 类型定义改为 `VirtualItem & { key }`（新版 `VirtualItem` 无原生 `key`）。随 patch-2 升级到 `@cat-kit/fe@^1.0.7` 后：`Options` 新增 `paddingStart / paddingEnd / overscan`，`gap` 改用 `Virtualizer` 原生实现、删除适配层 `wrappedEstimate`；`VirtualReturned` 新增 `beforeSize / afterSize`（来自 `snapshot.beforeSize/afterSize`，用于块状 spacer）；`measureElement` 简化为直接 `v.measureElement(index, el)`，不再针对 `gap` 走 `resizeItem` 分支；`CustomVirtualItem` 由内部类型升级为 `export`。
- `packages/compositions/package.json`：`dependencies` 中移除 `@tanstack/vue-virtual`，新增 `@cat-kit/fe`（patch-2 定版 `^1.0.7`）。
- `packages/compositions/tsdown.config.ts`：`deps.neverBundle` 中用 `@cat-kit/fe` 替换 `@tanstack/vue-virtual`。
- `packages/desktop/src/components/table/table.vue`（patch-2）：移除 `u-table-body` 的 `ref / tableBodyRef`、`spaceHeight / spaceRef / setStyles + nextTick` transform 链路；在 `u-table-body` 前后各加一个条件渲染的占位 `<tbody><tr><td colspan>`，高度分别绑定 `beforeSize / afterSize`，从而在 `table-layout: fixed` 下稳定撑开虚拟滚动位置，同时根治 `nextTick is not defined` 运行时异常。
- `packages/desktop/src/components/table/table-body.vue`（patch-2）：删除 `bodyRef / setBodyTransform / watch(virtualList, ...)`，不再对 `tbody` 使用 `transform`；`tableRows` 计算保持不变。
- `bun.lock`：随 `bun install` 同步更新，移除 `@tanstack/vue-virtual` / `@tanstack/virtual-core`，新增 `@cat-kit/fe`；patch-2 再次更新锁文件以对齐 `@cat-kit/fe@1.0.7`。
- `skills-lock.json`（patch-2）：同步 `@cat-kit/fe` 版本至 1.0.7。

校验：
- `packages/compositions` 与 `packages/desktop` 的 `bun run check-types` 均通过。
- `packages/compositions` 的 `bun run build` 通过，产物 `dist/use-virtual/index.{js,d.ts}` 仅保留 `@cat-kit/fe` 外部引用，无 `@tanstack/vue-virtual` 残留。
- `playgrounds/desktop` 启动后访问 `tree/index`（1000 节点，触发虚拟分支）与 `select/index`（80 选项，非虚拟分支）均正常渲染，控制台无与虚拟列表相关的新错误。
- （patch-1）补齐 `table/index`（200 行）与 `multi-select/index`（200 选项）的虚拟分支运行时冒烟，均渲染正常；同步 `skills/veltra-compositions/generated/` 文档至最新实现。

追加影响：

- `playgrounds/desktop/src/table/index.vue`：`students` 扩展至 200 行以覆盖 `u-table` 默认 `virtualThreshold=80` 的虚拟分支（patch-1）。
- `playgrounds/desktop/src/multi-select/index.vue`：选项数量由 60 调整为 200（patch-1）。
- `skills/veltra-compositions/generated/modules/use-virtual.md` / `use-fallback-props.md` / `use-user-action.md` 与 `manifest.json`：由 `bun tools/skills-sync/sync-veltra-compositions.ts` 重新生成（patch-1）。
- `packages/compositions/src/use-virtual/index.ts`（patch-3）：`measureElement` 签名由 `(el)` 改为 `(el: Element | null, index: number)`，在 `el == null` 时显式调用 `v.measureElement(index, null)` 解绑底层 `ResizeObserver`，消除被卸载行 `size=0` 污染 `measuredSizes` 的回归；新增首次真实尺寸后的 `v.setOptions({ estimateSize })` 一次性校准，后续未渲染项预估与真实行高一致。
- `packages/desktop/src/components/table/table.vue`（patch-3）：`estimateSize` 由 `() => 52` 调整为 `() => 41`，将初次挂载的 `totalSize` 跳变从 2200px 降至约 0px。
- `packages/desktop/src/components/table/table-body.vue`（patch-3）：`v-for` 解构 `{ row, index, stripeIndex }` 并把 `index` 显式传给 `UExpandTableRow` / `UTableRow`。
- `packages/desktop/src/components/table/table-row.tsx`（patch-3）：`UTableRow` / `UExpandTableRow` 新增 `index: number` prop，使用本地 `measureRef` functional ref 调用 `measureElement(el, props.index)`。
- `packages/desktop/src/components/tree/tree.vue`（patch-3）：`v-for` 透传 `index` 给 `UTreeNode`。
- `packages/desktop/src/components/tree/tree-node.vue`（patch-3）：`:ref` 由 `measureElement` 改为本地 `measureRef`，显式透传 `props.index`。
- `packages/desktop/src/types/tree.ts`（patch-3）：`TreeNodeProps` 新增 `index?: number`，`measureElement` 签名更新为 `(el: Element | null, index: number) => void`。
- `packages/desktop/src/components/select/select.vue`（patch-3）：`li` 的 `:ref` 改为箭头函数 `(el) => measureElement(el as Element | null, index)`。
- `packages/desktop/src/components/multi-select/multi-select.vue`（patch-3）：`v-for` 透传 `index` 给 `u-multi-select-option`。
- `packages/desktop/src/components/multi-select/multi-select-option.vue`（patch-3）：新增 `index?: number` prop，使用本地 `measureRef`。
- `packages/compositions/src/use-virtual/index.ts`（patch-4）：`measureElement` 首次校准逻辑由「首测即锁」改为「首选索引 0 作为校准锚点」+「`MAX_CALIBRATION_ATTEMPTS=5` 次非零索引跳过后降级完成校准」，防御 expand 等异形行首帧被测量的理论边界。
- `skills/veltra-compositions/generated/*`（patch-4）：重新执行 `bun tools/skills-sync/sync-veltra-compositions.ts`，`use-virtual.md` 等 13 个模块镜像与 `manifest.json` 对齐 patch-3 / patch-4 的新签名与注释。
- `skills/veltra-desktop/generated/*`（patch-4）：重新执行 `bun tools/skills-sync/sync-veltra-desktop.ts`，`components/tree.md` 同步为 `measureElement?: (el: Element | null, index: number) => void` + `index?: number` 的新契约；其余 70 个组件镜像、7 个分类索引、`catalog.md` 与 `manifest.json` 产生本轮一致性规范化差异。

## 历史补丁

- patch-1: 补齐运行时冒烟与同步 skills 生成文档
- patch-2: 升级 @cat-kit/fe 至 1.0.7 并修复 table 虚拟滚动列宽塌陷
- patch-3: 修复虚拟表格滚动时页面与滚动条抖动
- patch-4: 同步 skills 文档并加固 estimateSize 首次校准锚点
