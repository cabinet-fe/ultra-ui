# 移除 virtualizer 尺寸的 Vue 响应式绑定，改走 DOM 命令式写入

## 补丁内容

### 背景

`plan-38` 把 `useVirtual` 降级为 `useVirtualizer` 薄适配层后，消费者（`table.vue` / `tree.vue` / `select.vue` / `multi-select.vue`）按"snapshot 驱动 computed"的模式自己拼 `virtualEnabled` / `totalHeight` / `beforeSize` / `afterSize` / `virtualList` / `isScrolling` / `measureElement` / `scrollTo` 等 7~8 个派生字段，`table.vue` 的 `provide(TableDIKey, ...)` 也相应暴露了全部虚拟化中间量。

这样做在滚动帧会产生大量无谓的响应式求值：每次 scroll 触发 `snapshot.value = next`（整个快照 shallow 替换），所有读 `snapshot.value.xxx` 的 computed 会整体失效并重算；模板上 `:style="{ height: \`${beforeSize}px\` }"` 的绑定又会把 effect 下推到 `table.vue` 的渲染，表格模板 / colgroup / tbody 等整棵子树都进入 patch pass。

用户反馈中额外暴露了两处症状：

1. `packages/desktop/src/components/table/table.vue:14` 残留调试语句 `{{ console.log(1) }}`，滚动时每次 patch 都会在控制台刷屏。
2. 消费者侧为承接 `useVirtualizer` 的新契约新增了大量 computed 与模板绑定，超出了这次"薄适配层"重构的预期复杂度。

### 变更要点

**1. `useVirtualizer` 下沉尺寸写入到 DOM（核心变更）**

- 新增三个可选入参 `contentEl` / `beforeEl` / `afterEl: MaybeRefOrGetter<HTMLElement | null | undefined>`；传入任一后 hook 在 subscribe 回调里直接命令式写 `el.style.height = totalSize|beforeSize|afterSize + 'px'`（`horizontal: true` 时写 `width`）。
- 元素引用切换时自动清除旧元素的内联尺寸并为新元素写入当前快照值；作用域销毁或传入 `null` 时清除内联尺寸恢复 CSS 默认。
- 返回值新增两个独立 `shallowRef`：
  - `items: ShallowRef<VirtualItem[]>`：仅在底层 items 引用变化时赋值；
  - `isScrolling: ShallowRef<boolean>`：仅在布尔值变化时赋值；
  - 消费者 `v-for` 和 `watch(isScrolling)` 解耦，`items.map(...)` 不再因 `isScrolling` 切换或尺寸变化而重算。

**2. `table.vue`：模板/provide 双侧精简**

- 删除 L14 的 `{{ console.log(1) }}` 调试语句。
- 虚拟化前后占位 `<tr>` 改用 `ref="beforeSpacerRef"` / `ref="afterSpacerRef"`，不再绑定 `:style="{ height }"`；高度由 hook 命令式写入。
- 删除 `beforeSize` / `afterSize` / `totalHeight` computed；`useVirtualizer` 把 `beforeEl` / `afterEl` 直接指向占位 `<tr>`，模板无需参与尺寸传递。
- `measureElement` / `scrollTo` 的消费者侧包装函数全部删除，改用 `virtualizer.measureElement` / `virtualizer.scrollToIndex` 按需直调。
- `provide(TableDIKey, ...)` 精简为下游实际使用的字段：`virtualList: items`（shallowRef 直接透传）+ `virtualEnabled` + `measureElement`；`totalHeight` / `beforeSize` / `afterSize` / `isScrolling` / `scrollTo` 不再作为注入契约暴露（审读确认这四个字段仅在 `table.vue` 内部使用，下游 `table-body` / `table-row` / `table-cell` / `use-rows` / `use-fixed-columns` 均未读）。
- `isScrollingRelay` 的来源从"computed(snapshot.value.isScrolling) + watch"改为"`watch(isScrolling, ...)`"，少一层 computed。

**3. `TableDIKey` 字段精简**

- `di.ts` 中移除 `totalHeight` / `beforeSize` / `afterSize` / `isScrolling` / `scrollTo` 字段；
- `virtualList` 类型从 `ComputedRef<(VirtualItem & { key })[]>` 收敛为 `ShallowRef<VirtualItem[]>`（下游 `table-body.vue` 只读 `item.index` / `item.start`，不读 `item.key`）；
- `measureElement` 参数顺序由 `(el, index)` 翻转为 `(index, el)`，与底层 `Virtualizer.measureElement` 对齐。
- `table-row.tsx` 两处 `measureElement(...)` 调用点同步调整参数顺序；`packages/desktop/src/types/tree.ts` 中 `TreeNodeProps.measureElement` 签名同步翻转。

**4. `tree.vue` / `select.vue` / `multi-select.vue`：同构精简**

- 解构 `{ virtualizer, items }`（`tree` / `select` / `multi-select`）或 `{ virtualizer, items, isScrolling }`（`table`）；`snapshot` 不再解出。
- 删除 `totalHeight` computed；通过 `contentEl: () => virtualEnabled.value ? scrollRef.value?.contentRef : null` 把内容容器的高度交给 hook 命令式写入，关闭虚拟化时 hook 自动清除内联 height。
- 模板上原 `:content-style="{ height: withUnit(totalHeight, 'px') }"` 改为仅承担 grid/边距等非尺寸样式（`multi-select.vue` 因此顺手删除 `withUnit` 的未用导入）。
- `measureElement` 在消费者侧仅保留一个匹配 `TreeNodeProps.measureElement` 签名的薄包装：`(index, el) => virtualizer.measureElement(index, el)`。
- `tree-node.vue` / `multi-select-option.vue` 对应的 prop 签名与调用点同步翻转为 `(index, el)`。

**5. skill 文档与生成物同步**

- `skills/veltra-compositions/references/api-map.md`：补写 `contentEl` / `beforeEl` / `afterEl` 入参与 `items` / `isScrolling` 返回值，并说明"尺寸走 DOM 命令式写入"的设计意图。
- `skills/veltra-compositions/references/usage-patterns.md`：三段示例（select、table 的 `<tbody>` 占位、tree）重写为新契约；新增"为什么尺寸不走响应式"段落作为设计动因。
- `skills/veltra-compositions/SKILL.md`：函数速查表与场景选用描述同步。
- `packages/compositions/AGENTS.md`：`use-virtualizer` 条目的返回值说明补充。
- `bun run sync-skills` 刷新 `skills/veltra-compositions/generated/modules/use-virtualizer.md` 与 `manifest.json`。

### 收益

- 滚动帧开销仅剩「DOM 写 1~3 个 `style.height` + 窗口内真实行的 patch」，模板无 `totalSize` / `beforeSize` / `afterSize` 响应式订阅，Vue 不再因尺寸变化整树重渲染。
- `items` / `isScrolling` 独立 `shallowRef` 让滚动态切换（isScrolling 翻转）与窗口更新（items 变化）真正解耦：固定列阴影的 `watch(isScrolling)` 不再捎带触发 `v-for` 的 computed 重算。
- 消费者文件 diff 收敛：4 个消费者累计少 ~30 行 computed/模板绑定；`TableDIKey` 下游契约收敛到 3 个虚拟化字段。
- 调试残留清除，滚动时控制台不再刷屏。

### 验证

- 浏览器回归（`playgrounds/desktop` @ `http://localhost:7788`）：
  - `/table/index`（200 行数据）滚动至表尾，布局、条纹、列宽稳定；控制台仅余既有 `@veltra/styles` 命名空间弃用警告，**未再出现 `1` 的刷屏日志**。
  - `/tree/index`、`/select/index` 下拉渲染、搜索、键盘导航、滚动无退化。
- `rg 'useVirtual\b' packages/ playgrounds/ skills/` 在非归档目录零命中（`useVirtualizer` 除外）。

## 影响范围

### 修改文件

- `packages/compositions/src/use-virtualizer/index.ts`
- `packages/compositions/AGENTS.md`
- `packages/desktop/src/components/table/table.vue`
- `packages/desktop/src/components/table/di.ts`
- `packages/desktop/src/components/table/table-row.tsx`
- `packages/desktop/src/components/tree/tree.vue`
- `packages/desktop/src/components/tree/tree-node.vue`
- `packages/desktop/src/components/select/select.vue`
- `packages/desktop/src/components/multi-select/multi-select.vue`
- `packages/desktop/src/components/multi-select/multi-select-option.vue`
- `packages/desktop/src/types/tree.ts`
- `skills/veltra-compositions/SKILL.md`
- `skills/veltra-compositions/references/api-map.md`
- `skills/veltra-compositions/references/usage-patterns.md`
- `skills/veltra-compositions/generated/manifest.json`（由 `sync-skills` 刷新）
- `skills/veltra-compositions/generated/modules/use-virtualizer.md`（由 `sync-skills` 刷新）
