# Tree 组件样式重塑与性能优化

> 状态: 已执行

## 目标

- **修复样式、恢复层级感**：当前叶子节点的圆环占位突兀、节点无层级指示、选中态依赖 `!important`、hover/ripple 视觉对比不足、虚拟与非虚拟模式间距不一致。通过引入层级连接线（showLine 风格，默认开启）、重做占位、选中色带、节点间距规范，使 Tree 组件在多层嵌套与大数据下仍具备清晰的视觉层级与现代观感。
- **消除关键性能热点**：当前 `forest`/`nodeDict` 为 computed，props 任一变化（尤其内联的 `disabledNode` 函数）都会触发整棵 Forest 重建并丢失 `expanded/checked/visible` 状态；每个 `TreeNode` 叠加 `shallowReactive`，与 `shallowRef<TreeNode[]>` 形成双层响应；`getFlattedNodes` 做了两次 O(N) 遍历；`useCheck` 的回显 watch 每次全量清空重建。内部重构这些环节，使 1000+ 节点场景下展开/折叠/过滤/勾选/选中操作保持流畅，且不会因父组件无关更新而丢状态。
- **零破坏对外 API**：`TreeProps`、`TreeEmit`、`TreeNodeProps`、`_TreeExposed`/`TreeExposed` 的类型与行为保持不变，不新增任何 prop。

## 内容

### 步骤 1：性能模块 —— 重构 `useTreeNodes`（`packages/desktop/src/components/tree/use-tree-nodes.ts`）

1. 将内部 `forest` 从 `computed` 改为 `shallowRef<Forest<Record<string, unknown>, any>>`，命名为 `forestRef`。通过显式 `watch([() => props.data, () => props.disabledNode, () => props.childrenKey, () => props.valueKey, () => props.labelKey, () => props.expandAll], () => rebuildForest(), { immediate: true })` 触发重建。
2. `rebuildForest()` 内部：重新构造 `Forest` 实例、重新分配 `forestRef.value`，并在同一次调用中同步重建 `nodeDictRef`（见步骤 2）。保留现有 `createNode` + `disabledNode` 的逻辑分支。
3. 对外返回的 `forest` 改用 `computed(() => forestRef.value)` 包装，确保 `_TreeExposed.forest` 保持 `ComputedRef<Forest<...>>` 类型不变。
4. 在 `rebuildForest()` 结束时主动调用一次 `getFlattedNodes()`，替代旧 `watch` 在外部对 forest 的监听所需的同步行为。

### 步骤 2：性能模块 —— `nodeDict` 重构

1. 将 `nodeDict` 从 `computed` 改为 `shallowRef<Map<string | number, TreeNode>>`，命名为 `nodeDictRef`。
2. 填充时机合并到 `rebuildForest()` 中：在创建完 Forest 后，以一次 DFS 同时收集 `dict.set(node.key, node)`；消除原先"forest 变化 → 单独触发 dict 的 computed 再跑一次完整 DFS"的重复遍历。
3. 对外暴露为 `computed(() => nodeDictRef.value)`，保持 `ComputedRef<Map<...>>` 的类型契约。

### 步骤 3：性能模块 —— `getFlattedNodes` 单次遍历

1. 去除旧版 `forest.value.flattenVisible((n) => n.expanded).filter((n) => n.visible)` 的两段式实现。
2. 改为手写一次 DFS：`const result: TreeNode[] = []`，递归 `forestRef.value.roots`，遇到 `!node.visible` 直接跳过该子树，对 `node.visible === true` 的节点 `result.push(node)`，仅当 `node.expanded === true` 时继续向下递归 children。
3. 末尾 `nodes.value = result`（`nodes` 仍为 `shallowRef<TreeNode[]>`）。
4. 校验：展开/折叠、过滤后结果集合与旧实现完全一致；对 1000 × 2 子节点的测试数据，单次调用耗时应与旧两次遍历相比降至约一半。

### 步骤 4：性能模块 —— `TreeNode` 去 `shallowReactive`（`packages/desktop/src/components/tree/tree-node.ts`）

1. 移除构造函数末尾的 `return shallowReactive(this)`，让 `TreeNode` 为普通实例。
2. 保留 `expanded/checked/visible/disabled/childrenCheckCount` 等字段与 `indeterminate` getter；不再依赖属性读取的响应式。
3. 由 `shallowRef<TreeNode[]>` 的 `nodes` 和必要处的 `triggerRef(nodes)` 驱动模板更新：
   - `tree-node.vue` 的 `toggleExpand` 中修改 `node.expanded` 后调用 `getFlattedNodes()`（已存在），`nodes.value = newArray` 替换本身会触发整体 diff，Vue 会重新读取每个节点的 `node.expanded / node.checked / node.indeterminate / node.disabled`，行为不变。
   - `useCheck` 中 `checkNode`/`uncheckNode` 修改 `checked` 与 `childrenCheckCount` 后，在 `toggleCheck` 末尾新增一次 `triggerRef(nodes)`（来自 `useTreeNodes` 返回值），强制列表刷新以让 `indeterminate` getter 被重新读取并反映到子组件 `UCheckbox`。
   - `useSelect` 中 `handleSelect` 设置 `selectedData.value` 后，类名绑定 `bem.is('selected', node.data === selectedData)` 本身就是响应式，无需 triggerRef。
4. 对外暴露的 `forest`/`nodes`/单个 `TreeNode` 形态（`ITreeNode` 接口）不变；外部若直接读取字段仍可正常读取（只是不再有变更订阅语义，这与旧实现对外同样不保证跨组件监听单个字段）。

### 步骤 5：性能模块 —— `useCheck` 回显 watch 优化（`packages/desktop/src/components/tree/use-check.ts`）

1. 将 watch 依赖由 `[() => props.checked, nodeDict]` 改为 `[() => props.checked, nodeDict]` 保持不变，但回调内改为差集比较：
   - 维护一个 `lastCheckedSet: Set<any>`（存的是 valueKey 的值）。
   - 回调触发时计算 `toAdd = 新集合 - lastCheckedSet`、`toRemove = lastCheckedSet - 新集合`。
   - 仅对 `toRemove` 中的 value 执行 `uncheckNode`；对 `toAdd` 中的 value 执行 `checkNode` 并冒泡展开祖先。
   - 更新 `lastCheckedSet = 新集合`。
2. 当 `nodeDict` 引用变化（即 forest 重建）时，视为全量同步场景：清空 `lastCheckedSet` 与 `checkedData` 后重新全量设置；仅此分支走旧的"全量清空"路径。
3. 回调末尾如对 `checkedData` 有变更则 `getFlattedNodes()` 与 `triggerRef(nodes)`；未变更则跳过，避免空转。

### 步骤 6：性能模块 —— `useVirtual` 配置调优（`packages/desktop/src/components/tree/tree.vue`）

1. `estimateSize` 从 `() => 40` 改为基于 `size.value` 的函数：`'small' → 32`、`'default' → 36`、`'large' → 44`（这些是按 `style.scss` 中 gap/radius/line-height 推算的稳态高度；实测需在步骤 9 验证）。
2. 保留 `gap: 2`、`virtualThreshold: 80` 参数不变。
3. `TreeNodeProps.index` 与 `measureElement` 的传递方式保持现状（真实高度仍由 `ResizeObserver` 测量回填）。

### 步骤 7：样式模块 —— 层级连接线与节点结构（`packages/desktop/src/components/tree/tree-node.vue`）

1. 删除模板中 `padding-left: node.depth * 20 - 20` 的内联样式与 `u-tree__icon-placeholder` 叶子节点圆环占位。
2. 在模板根 `u-tree__node` 内，节点内容前新增 `depth` 个 `<span class="u-tree__indent" />`，每个宽 20px；通过 `v-for="i in node.depth"` 渲染（`node.depth` 从 0 起，等于 0 的根节点不渲染 indent）。
3. 展开图标 / 叶子占位仍然存在：叶子节点渲染 `<i class="u-tree__indent u-tree__indent--leaf" />`（与 indent 等宽 20px）替代原圆环，使叶子与非叶子在水平位置完全对齐并让出空间给连接线。
4. `tree-node.ts`（TypeScript 类）及 `TreeNodeProps` 类型不变。

### 步骤 8：样式模块 —— `style.scss` 重做

范围：`packages/desktop/src/components/tree/style.scss`。重写后必须覆盖以下要点，且变量全部走 `pkg:@veltra/styles` 的 `functions.use-var`（不硬编码颜色）：

1. **节点布局**：
   - `.u-tree__node`：`display: flex; align-items: center;`；去掉 `margin-bottom`，改为 `min-height` 与 `size` 联动（`small: 28px`、`default: 32px`、`large: 40px`）。
   - 非虚拟模式通过 `.u-tree__wrap:not(.is-virtual) .u-tree__node + .u-tree__node` 的 `margin-top: 2px` 提供间距，虚拟模式保留依赖 virtualizer gap。
2. **层级连接线**（默认总是绘制）：
   - `.u-tree__indent`：宽 20px、高 100%、相对节点内容垂直方向撑满；通过 `::before` 伪元素绘制 `border-left: 1px dashed use-var(border-color, regular)` 的竖线，竖线居中（`left: 50%; transform: translateX(-0.5px);`）。
   - `.u-tree__indent--leaf`：除了绘制父级延伸的竖线外，再绘制一个水平分支 `::after`：`border-top: 1px dashed use-var(border-color, regular); width: 50%; position: absolute; top: 50%; right: 0;` 使水平线从节点中心延伸到展开图标/内容位置。
   - 展开图标容器 `.u-tree__expand-icon` 上也绘制同形的水平分支 `::before`，与 indent 的竖线在视觉上形成 T/L 字形。
   - 最后一个子节点处理：若 CSS 直接判断困难，退一步方案 —— 在 `.u-tree__node` 根节点根据 `node === parent.children[last]` 由模板额外加 `is-last` 修饰符类，scss 下用 `.u-tree__indent:last-of-type::before` 针对最后一列缩减为半高竖线（`height: 50%; top: 0;`）形成 L 形收尾。为保持实现简洁，模板通过 `node.parent && node.parent.children && node === node.parent.children[node.parent.children.length - 1]` 计算 `isLast`，添加类 `is-last` 到 `u-tree__node`。
3. **展开图标**：
   - `.u-tree__expand-icon`：20×20、圆角 50%、默认无背景；hover 背景 `use-var(bg-color, hover)`（与选中色区分），transition 改 `0.15s cubic-bezier(0.4, 0, 0.2, 1)`。
   - 保留 `is-expanded` 下 `rotate(90deg)`。
4. **节点内容 `.u-tree__node-content`**：
   - `flex-grow: 1; display: flex; align-items: center; gap: use-var(gap, $size);`；保留 `user-select: none`；`word-break` 由 `break-all` 改为 `break-word`，避免英文串整词乱折。
   - hover 背景 `use-var(bg-color, hover)`（不带 `!important`）。
5. **选中态**：
   - `.u-tree__node.is-selected .u-tree__node-content`：背景 `use-var(color, primary, light-9)`、字色 `use-var(color, primary)`、`font-weight: 500`（而非 bold）；不再使用 `!important`。
   - 左侧 3px 色带：`.u-tree__node.is-selected::before` 定位 `absolute; left: 0; top: 4px; bottom: 4px; width: 3px; border-radius: 3px; background: use-var(color, primary);`（节点根设 `position: relative`）。
6. **Ripple**：`.u-tree__ripple` 背景改为 `use-var(color, primary, light-5)`、`opacity: 0.25`。
7. **Disabled**：保留当前文字色；额外在 `.u-tree__node.is-disabled .u-tree__node-content:hover` 取消 hover 背景，避免反馈假象。
8. **Empty**：保留 `.u-tree__empty { text-align: center; padding: use-var(gap, $size) 0; color: use-var(text-color, secondary); }`。

### 步骤 9：Playground 走查验证（`playgrounds/desktop/src/tree/index.vue`）

不修改业务代码；仅用该 playground 作为验证场景，确保：

1. 1000 根 × 2 子节点、`expand-all=false`、`checkable=true/checkStrictly=true` 场景下，整树展开收起流畅无明显卡顿。
2. 过滤输入（`qs`）键入时无可见延迟，连接线与选中色带正确显示。
3. 切换 `selectable`/`checkable`/`checkStrictly` 时不出现状态错乱；初始回显 `checked = ['0-1']` 能正确定位并自动展开祖先。
4. 自定义内容卡片内的 `check-strictly` + slot 场景样式正常。

### 步骤 10：类型与构建校验

1. 运行 `bun run check-types`（全 workspace）通过，不得以 `any`/`@ts-ignore`/`@ts-expect-error` 绕过。
2. 运行 `bun run lint` 通过；如需新增 ESLint 无害修复可一并完成。
3. 运行 `cd playgrounds/desktop && bun dev` 启动预览做一次人工视觉与交互验证（步骤 9）。

## 影响范围

- `packages/desktop/src/components/tree/use-tree-nodes.ts`：将 `forest` / `nodeDict` 从 `computed` 重构为 `shallowRef`，通过显式 `watch` 输入 prop 变化触发重建；合并 forest 构建与 nodeDict 填充为一次 DFS；`getFlattedNodes` 改写为手写迭代 DFS（单次遍历，跳过不可见子树）；新增 `triggerNodes` 返回项以便外部在字段级别变更后手动刷新。
- `packages/desktop/src/components/tree/use-check.ts`：`checkNode` / `uncheckNode` 增加幂等短路；回显 watch 改为基于 `lastCheckedSet` 的差集比较，引用变化的 `nodeDict` 视为森林重建走全量重建路径；`toggleCheck` 内同步 `lastCheckedSet`，避免随后由 `props.checked` 反向触发的 watch 误判；将 `expandAncestors` 提至模块作用域以消除 lint 警告。
- `packages/desktop/src/components/tree/tree.vue`：`estimateSize` 改为随 `size` 返回 32 / 36 / 44 的稳态高度估算函数；其它 `gap` / `virtualThreshold` / `scrollEl` 参数保持不变。
- `packages/desktop/src/components/tree/tree-node.vue`：移除 `padding-left` 内联样式与圆环占位，改为按 `node.depth` 渲染 `u-tree__indent` 占位 span；叶子节点渲染 `u-tree__indent--leaf`；新增 `isLast` 计算属性并在根元素附加 `is-last` 修饰类，供样式层裁剪最后一列连接线；去除未使用的 `withUnit` 引入。
- `packages/desktop/src/components/tree/style.scss`：重写样式，落实节点 `min-height` 与 `size` 联动、非虚拟模式兄弟间距、基于 `u-tree__indent` 伪元素的层级虚线连接系统、叶子与展开图标的水平分支、`is-last` 折半收尾、`is-selected` 3px 色带与弱 `light-9` 背景（不再使用 `!important`）、hover 背景走 `bg-color, hover`、禁用态取消 hover 反馈、Ripple 改用 `primary light-5 / opacity 0.25`、Empty 垂直内边距与次要文字色。

### 相对计划的偏差说明

- 步骤 4 保留 `TreeNode` 构造末尾的 `return shallowReactive(this)`：Vue 3 中当父组件仅更换 `nodes.value` 数组但单个 `TreeNode` 引用不变时，`shouldUpdateComponent` 会判定 `node` prop 未变而不重渲染 `UTreeNode` 子组件，其内部对 `node.expanded / node.checked / node.indeterminate / node.disabled` 的读取因此不会刷新。若按计划移除 `shallowReactive`，展开箭头旋转、复选框勾选状态等将出现视觉回归。其它步骤描述的性能收益（避免 forest 因 `disabledNode` 内联函数导致的整棵重建、单次 DFS 扁平化、差集化的 `useCheck` watch）已独立完成，故保留本项以确保功能正确性。
- 步骤 8 中层级连接线颜色使用 `use-var(border-color)`（项目内唯一存在的 token），未采用计划中的 `use-var(border-color, regular)`（该子 token 在 `@veltra/styles` 中不存在）。

## 历史补丁

- patch-1: 移除失败的层级虚线连接线，回归简洁的缩进布局
