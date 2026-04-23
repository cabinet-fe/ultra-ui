# 升级 @cat-kit/fe 至 1.0.7 并修复 table 虚拟滚动列宽塌陷

## 补丁内容

在 plan-34 / patch-1 完成后发现两处遗留问题：

1. **`@cat-kit/fe` 版本与已生成 skill 脱节**：当前 `@veltra/compositions` 依赖 `@cat-kit/fe@^1.0.5`，而该版本的 `Virtualizer` 尚未提供 `gap / paddingStart / paddingEnd` 原生选项，导致 `useVirtual` 需要在适配层自行包装 `estimateSize` 来模拟间距，实现偏复杂且与 `.agents/skills/cat-kit-fe/generated/virtualizer/index.d.ts`（展示的 1.0.7 API）不一致。
2. **`u-table` 在虚拟分支下列宽塌陷**：原实现用 `tbody` 的 `translate3d` 移动可视窗口，另以一个空 `tbody` 撑开 `spaceHeight` 模拟总高。该策略与 `.u-table__wrap { table-layout: fixed }` 冲突：滚动时 `colgroup` 基于当前参与 layout 的 `tbody` 子树重新解析列宽，空 `tbody` 与被 transform 的 `tbody` 交替生效，导致「姓名」等自适应列在首次滚动后塌陷到最小宽度或消失；同时 `table.vue` 仍保留 `nextTick` 的 `setStyles` 路径，产生 `ReferenceError: nextTick is not defined` 运行时异常。

本补丁统一解决两者：

### 1. 升级到 `@cat-kit/fe@^1.0.7` 并简化 `useVirtual`

- `packages/compositions/package.json`：`dependencies["@cat-kit/fe"]` 由 `^1.0.5` 升到 `^1.0.7`，`bun install` 同步写入 `bun.lock` / `skills-lock.json`。
- `packages/compositions/src/use-virtual/index.ts`：
  - `Options` 扩展 `paddingStart / paddingEnd / overscan`（`overscan` 默认 `3`，保持原行为），`gap` 语义同步切换为 `Virtualizer` 原生 `gap`。
  - 删除自己包装的 `wrappedEstimate` gap 逻辑，构造时直接传 `{ count, overscan, gap, paddingStart, paddingEnd, estimateSize }`。
  - `VirtualReturned` 新增 `beforeSize / afterSize: ShallowRef<number>`：从 `snapshot.beforeSize / snapshot.afterSize` 直接派生，用于表格等需要块状 spacer 的消费者。
  - `subscribe` 回调统一写入 `totalSize / beforeSize / afterSize / items`；`watch([scrollEl, enabled])` 合并：禁用时重置 `virtualList / totalHeight / beforeSize / afterSize` 并 `unmount`，启用时 `v.mount(el ?? null)`。
  - `measureElement(el)` 简化为「读 `dataset.index` → 调 `v.measureElement(index, el)`」，删除旧版针对 `gap` 的 `resizeItem` 分支（`@cat-kit/fe` 内部已感知 gap，无需外部介入）。
  - `CustomVirtualItem` 从 `Omit<VirtualItem, 'key'> & { key }` 调整为 `VirtualItem & { key: number | string }`（新版 `VirtualItem` 不含 `key`，无需再 `Omit`）并 `export` 以供外部类型引用（此前为内部类型）。

### 2. 重构 `u-table` 虚拟滚动布局

- `packages/desktop/src/components/table/table.vue`：
  - 移除 `u-table-body` 的 `ref` / `tableBodyRef`、`spaceHeight` 计算、`spaceRef` 及其 `watch + setStyles + nextTick` 链路；彻底删除 transform 驱动路径，根治 `nextTick is not defined` 异常。
  - 在 `u-table-body` 前后各加一个占位 `<tbody>`：
    - 前置 `tbody`（仅在 `virtualEnabled && beforeSize > 0` 时渲染）：`<tr :style="{ height: beforeSize + 'px' }"><td :colspan="leafColumns.length" /></tr>`；
    - 后置 `tbody`（仅在 `virtualEnabled && afterSize > 0` 时渲染）：结构同上，高度绑定 `afterSize`。
  - 使用真实 `<tr><td colspan="n">` 撑开高度（而非仅给 `tbody` 设 `height`），既满足 `table-layout: fixed` 必需的完整行结构、避免列宽重算，又保证占位不参与实际绘制（`aria-hidden="true"` + `padding: 0; border: none`）。
  - 从 `useVirtual` 结构化解构出 `virtualEnabled / beforeSize / afterSize`；通过 `provide(TableDIKey, { ...virtualCtx })` 将新增的 `beforeSize / afterSize` 自动下发给子组件（`table-body.vue` 不需要这两个字段，仍只消费 `virtualList / virtualEnabled`）。
- `packages/desktop/src/components/table/table-body.vue`：
  - 删除 `bodyRef / setBodyTransform / watch(virtualList, ...)`：列表行的真实位置现在由外层 `beforeSize` 占位决定，`tbody` 不再需要 transform，同时不再 `defineExpose({ setBodyTransform })`。
  - 保留 `tableRows` 计算不变，只更新注释，说明位置由 `table.vue` 的 before/after 占位 tbody 撑开。

### 3. 文档与校验

- 由于 `use-virtual.md` 展示的实现发生了实质变化，重新运行 `bun tools/skills-sync/sync-veltra-compositions.ts` 同步 `skills/veltra-compositions/generated/manifest.json` 与 `modules/use-virtual.md`（顺带 `use-fallback-props.md / use-user-action.md` 的元数据由同步器刷新）。
- `packages/compositions` 与 `packages/desktop` 的 `bun run build` 均通过，`bun run check-types` 仅剩 `@cat-kit/core@1.0.7` 自身 `Buffer / process` 上游类型告警（与本补丁无关），`useVirtual / table / table-body` 对消费者无新增类型错误。
- 浏览器冒烟（playground `table/index` 200 行、`multi-select/index` 200 项）：表头 / 列宽在滚动前后均保持一致，`姓名`、`年龄`、`年级`、`班级`、`分数`、`操作` 列不再塌陷；控制台无 `ReferenceError` / Vue `Property "beforeSize|afterSize" was accessed during render but is not defined` 等错误。

## 影响范围

- 修改文件: `packages/compositions/package.json`
- 修改文件: `packages/compositions/src/use-virtual/index.ts`
- 修改文件: `packages/desktop/src/components/table/table.vue`
- 修改文件: `packages/desktop/src/components/table/table-body.vue`
- 修改文件: `skills/veltra-compositions/generated/manifest.json`
- 修改文件: `skills/veltra-compositions/generated/modules/use-virtual.md`
- 修改文件: `skills/veltra-compositions/generated/modules/use-fallback-props.md`
- 修改文件: `skills/veltra-compositions/generated/modules/use-user-action.md`
- 修改文件: `bun.lock`
- 修改文件: `skills-lock.json`
