# use-virtual 降级为 useVirtualizer 薄适配层

> 状态: 已执行

## 目标

当前 `@veltra/compositions` 的 `useVirtual` 同时承担两件职责：
（1）Vue 反应式/生命周期胶水（对 `@cat-kit/fe` 的 `Virtualizer` 做 `subscribe → ref`、`onScopeDispose(destroy)`、`watch(scrollEl)` 等适配）；
（2）业务语义决策（`virtualThreshold` 阈值判定、`CustomVirtualItem.key` 组装、`scrollTo` 对齐模式）。

职责混杂导致两处明确的封装泄漏：

- `snapshot.items.map(item => ({ ...item, key: item.index }))` 在 `getItemKey` 被传入时仍把 Vue 层 `v-for :key` 固定为 index，致使底层 `getItemKey` 的 DOM 身份稳定性无法向上兑现；消费者（`tree.vue`）被迫在外部再写一次 `node.key || item.key` 手动补齐。
- `scrollTo(index)` 写死 `align: 'center'`，底层 `scrollToIndex(index, { align, behavior })` 的能力被阉割；消费者无路径越过封装使用 `start/end/auto` 对齐或 `smooth` 行为。

此外 `scrollToOffset` / `reset` / `measureMany` 等底层能力未透出，`getItemKey` 的"函数 vs Ref 双形态"在实际用法里与单一函数闭包无语义差别（过度设计）。

本计划将 `useVirtual` 降级为仅做 Vue 胶水的 `useVirtualizer`，业务决策全部回到 4 个消费者侧显式处理。期望收益：

- 抽象边界对齐：hook 只保证"订阅快照 + 生命周期"，业务语义在消费者文件内完整可见。
- 消除两处封装泄漏：`tree.vue` 可删除 `node.key || item.key` 兜底；`scrollTo` 在各消费者内按需传 `align`/`behavior`。
- 透出底层 `Virtualizer` 实例，`setOptions` / `reset` / `measureMany` / `scrollToOffset` 等能力自由取用，不再因为新能力加进来就要改 hook 签名。

## 内容

### 步骤 1：新增 `packages/compositions/src/use-virtualizer/index.ts`

产出 `useVirtualizer(options)`，契约如下：

- **入参**：
  - `count: Ref<number>`（响应式，内部 `watch` 自动调 `virtualizer.setCount`）
  - `scrollEl: ShallowRef<HTMLElement | null>`（响应式，内部 `watch` + `immediate` 自动 `connect`/`disconnect`）
  - 其余 `VirtualizerOptions` 字段（`buffer` / `gap` / `paddingStart` / `paddingEnd` / `horizontal` / `estimateSize` / `useMeasuredAverage` / `getItemKey` / `initialOffset` / `initialViewport`）原样透传给 `new Virtualizer(...)`，**一次性初始化，不做 watch**。消费者若需运行时切换（例如 key 空间切换），自行调用 `virtualizer.setOptions({...})`。
  - `initialOffset` / `initialViewport` 按底层约束**仅构造时生效**，后续任何 `setOptions` 调用都会忽略这两字段（步骤 9 的文档同步必须标注此 caveat）。
- **返回**：
  - `virtualizer: Virtualizer`（底层实例，未包装，消费者可直接调 `scrollToIndex` / `scrollToOffset` / `reset` / `measureMany` / `setOptions` / `measureElement` 等）
  - `snapshot: ShallowRef<VirtualSnapshot>`（结构变化驱动的快照；初始值来自 `virtualizer.getSnapshot()`，之后由 `subscribe` 回调整体替换引用）
- **生命周期**：
  - 构造期：`new Virtualizer(initOptions)` → 读一次 `getSnapshot()` 写入 `snapshot.value` → `subscribe(next => { snapshot.value = next })` 拿到 unsubscribe 函数
  - `watch(count, c => virtualizer.setCount(c))`（不 immediate；初始 count 已在构造时透传）
  - `watch(scrollEl, el => { el ? virtualizer.connect(el) : virtualizer.disconnect() }, { immediate: true })`
  - `onScopeDispose(() => { unsubscribe(); virtualizer.destroy() })`
- **类型导出**：re-export 底层的 `Virtualizer`（type） / `VirtualSnapshot` / `VirtualItem` / `VirtualRange` / `VirtualizerOptions` / `VirtualScrollOptions` / `VirtualAlign` / `GetItemKey` / `EstimateSize` / `VirtualMeasurement`，消费者从 `@veltra/compositions` 单点引用。
- **不导出**：旧 `CustomVirtualItem` / `VirtualReturned` 类型；旧 `Options` 接口；旧 `virtualEnabled` / `virtualList` / `totalHeight` / `beforeSize` / `afterSize` / `isScrolling` 返回字段（全部业务化，扔回消费者）。

完成标准：文件存在，`bun run check-types` 对 `@veltra/compositions` 包编译通过；与旧 `useVirtual` **无导出名交集**（旧名不保留 alias，走破坏性替换，因为 4 个消费者都在同一 monorepo 内）。

### 步骤 2：更新 `packages/compositions/src/index.ts` barrel

- 删除 `export * from './use-virtual'`
- 新增 `export * from './use-virtualizer'`

完成标准：barrel 编辑完成；`@veltra/compositions` 对外仅暴露新 hook。

### 步骤 3：删除 `packages/compositions/src/use-virtual/` 目录

删除 `packages/compositions/src/use-virtual/index.ts` 及其所在目录。

完成标准：目录不存在；全仓 `ripgrep "useVirtual\b" packages/ playgrounds/` 仅剩本计划后续步骤将要修订的注释/文档引用（以步骤 8、9 为准）。

### 步骤 4a：审读 `TableDIKey` 契约字段

`packages/desktop/src/components/table/table.vue` 目前通过 `provide(TableDIKey, { ...virtualCtx, ...其他字段 })` 下发虚拟化上下文；步骤 4b 的迁移需要逐一明确每个字段的新来源。本步骤只做审读和映射，不改代码。

审读过程：

1. **全仓引用核查**：先执行 `rg "TableDIKey" packages/desktop`，确认 `TableDIKey` 的全部 `provide` / `inject` 位置，以此作为审读清单（避免遗漏）。
2. 对核查得到的所有命中文件逐一读取（核查结果应至少包含以下 8 个文件，若清单更广则以实际 ripgrep 结果为准）：
   - `packages/desktop/src/components/table/table.vue`
   - `packages/desktop/src/components/table/table-body.vue`
   - `packages/desktop/src/components/table/table-row.tsx`
   - `packages/desktop/src/components/table/table-cell.vue`
   - `packages/desktop/src/components/table/use-table.ts`
   - `packages/desktop/src/components/table/use-rows.ts`
   - `packages/desktop/src/components/table/use-fixed-columns.ts`
   - `packages/desktop/src/components/table/node/row.ts`
   - `packages/desktop/src/components/table/di.ts`（若存在）

产出物（作为步骤 4b 的前置 scratchpad，实施时可记录于 `patch-N.md` 草稿或直接写入 implement 阶段的 `## 影响范围` 汇总）：**一份 "旧字段 → 新来源" 映射表**，每一行形如

```
<字段名> : <旧来源（virtualCtx.xxx）> → <新来源（snapshot.value.xxx / computed / virtualizer.xxx）>
```

至少需要覆盖：`virtualList` / `virtualEnabled` / `beforeSize` / `afterSize` / `totalHeight`（底层名 `totalSize`）/ `isScrolling` / `measureElement` / `scrollTo`，以及 `TableDIKey` 其余非虚拟化字段（这些保持不变，计划仅标注"不动"）。

完成标准：`rg "TableDIKey" packages/desktop` 的命中全部被审读；映射表完整、每项都有明确新来源；步骤 4b 按表施工即可。

### 步骤 4b：迁移 `packages/desktop/src/components/table/table.vue`

按 4a 产出的映射表施工。关键点（不完全列举，4a 映射表为准）：

- import 改 `useVirtualizer`；解构 `{ virtualizer, snapshot }`。
- 新增消费者侧 computed：
  - `virtualEnabled = computed(() => { const t = props.virtualThreshold; return t ? rows.value.length > t : true })`
  - `virtualList = computed(() => snapshot.value.items.map(item => ({ ...item, key: rows.value[item.index]?.uid ?? item.index })))`
  - `beforeSize` / `afterSize` / `totalSize`（可沿用旧名 `totalHeight` 不改，保持模板稳定）为 `computed` 取自 `snapshot.value`
  - `isScrolling` 改为 `computed(() => snapshot.value.isScrolling)`；原 `watch(isScrolling, v => isScrollingRelay.value = v)` 可用 `watchEffect(() => { isScrollingRelay.value = snapshot.value.isScrolling })` 代替
- `measureElement` 调用点：模板里 `:ref="(el) => measureElement(el, index)"` 改为 `(el) => virtualizer.measureElement(index, el as Element | null)`（底层签名就是 `(index, element)`，参数顺序反转）。
- **`measureElement` 绑定位置校验（防止非虚拟化分支误绑）**：核验 `:ref="(el) => virtualizer.measureElement(...)"` 的模板绑定点必须限定在 `virtualEnabled === true` 的分支（`v-if` 或等价结构）。若当前模板在非虚拟化分支也绑定了 `measureElement`，必须拆分成条件渲染；不得让非虚拟化项参与 Virtualizer 的尺寸测量（会污染 sizes / mounted）。
- `scrollTo` 调用点：`virtualCtx.scrollTo(i)` 改为 `virtualizer.scrollToIndex(i, { align: 'center' })`；若 `TableDIKey` 向下游暴露 `scrollTo` 字段，则在消费者侧定义一个 `function scrollTo(i: number) { virtualizer.scrollToIndex(i, { align: 'center' }) }` 保持对 `TableDIKey` 契约字段名不变。
- `provide(TableDIKey, { ... })` 依据步骤 4a 映射表重组字段；下游读到的字段名保持与当前一致（避免级联改动 table-row/table-cell 等下游消费者）。
- **保持不变的既有逻辑**：`LENGTH_DELTA_RATIO_TO_RESET_SCROLL = 0.5` 驱动的"数据显著替换时 `scrollTo({ y: 0 })` 复位"业务逻辑（当前 `table.vue` L186-L198 附近）与虚拟化生命周期正交，**本次迁移不做任何改动**，仅在迁移时顺带确认它仍然正常工作。

完成标准：`table.vue` 全部引用迁移完毕；`TableDIKey` 下游消费者（`table-body.vue` / `table-row.tsx` / `table-cell.vue` / `use-fixed-columns.ts` / `use-rows.ts` 等）未改动就能正常编译；`bun run check-types` / `bun run lint` 通过；模板里 `measureElement` 绑定点已限定在 `virtualEnabled=true` 分支。

### 步骤 5：迁移 `packages/desktop/src/components/tree/tree.vue`

- import 改 `useVirtualizer`；解构 `{ virtualizer, snapshot }`。
- 新增：
  - `virtualEnabled = computed(() => nodes.value.length > 80)`（原 `virtualThreshold: 80` 内化）
  - `virtualNodes = computed(() => snapshot.value.items.map(item => { const node = nodes.value[item.index]!; return { node, key: node?.key ?? item.index, offset: item.start, index: item.index } }))` —— 注意：**删除原 `node.key || item.key` 的兜底逻辑**（因为 `getItemKey` 的身份稳定性已由底层保证，现在可以放心以 `node.key` 为唯一 key；`item.index` 作为 fallback 仅用于 `nodes.value[item.index]` 为 undefined 的竞态边缘）。这是本计划消除的封装泄漏 #1 的直接体现。
  - `beforeSize` / `afterSize` / `totalHeight` / `virtualList`（若模板引用）迁移到 computed。
  - `scrollTo(i)` 保持对外 API 不变：在消费者内定义 `function scrollTo(i: number) { virtualizer.scrollToIndex(i, { align: 'center' }) }`。
- `measureElement` 调用点参数顺序调整为 `(index, el)`，并确保绑定点限定在 `virtualEnabled=true` 分支（与步骤 4b 同样的绑定位置校验）。

完成标准：`tree.vue` 迁移完毕，`node.key || item.key` 的兜底逻辑被删除且功能等价（靠底层 `getItemKey` 保证 DOM 身份稳定）；手动展开/收起/过滤场景下无 DOM 闪烁或 key 冲突警告；`measureElement` 绑定点仅在 `virtualEnabled=true` 分支渲染。

### 步骤 6：迁移 `packages/desktop/src/components/select/select.vue`

- import 改 `useVirtualizer`；解构 `{ virtualizer, snapshot }`。
- 原 `virtualEnabled = _virtualEnabled.value && !props.grid` 的两层判断改为：
  - `const baseVirtualEnabled = computed(() => options.value.length > 80)`
  - `const virtualEnabled = computed(() => baseVirtualEnabled.value && !props.grid)`
- `virtualOptions`（原基于 `virtualList.value.map`）改为基于 `snapshot.value.items.map`；不传 `getItemKey`，Vue 层 key 继续使用 `item.index`（与现状等价）。
- `measureElement` 调用点参数顺序调整为 `(index, el)`，并确保绑定点限定在 `virtualEnabled=true` 分支（与步骤 4b 同样的绑定位置校验）。
- 该文件不使用 `scrollTo`（当前也未从 `useVirtual` 解构），无需新增。
- `totalHeight`（若模板引用）迁移到 computed。

完成标准：select 下拉渲染/滚动/搜索功能无退化；`bun run check-types` / `bun run lint` 通过；`measureElement` 绑定点仅在 `virtualEnabled=true` 分支渲染。

### 步骤 7：迁移 `packages/desktop/src/components/multi-select/multi-select.vue`

与步骤 6 对称：

- import 改 `useVirtualizer`；解构 `{ virtualizer, snapshot }`。
- `virtualEnabled = computed(() => options.value.length > 80)`（multi-select 无 `props.grid` 分支）。
- `virtualOptions` 基于 `snapshot.value.items.map`，不传 `getItemKey`。
- `measureElement` 参数顺序调整为 `(index, el)`，并确保绑定点限定在 `virtualEnabled=true` 分支。
- `totalHeight`（若模板引用）迁移到 computed。

完成标准：multi-select 下拉渲染/选择/滚动功能无退化；`bun run check-types` / `bun run lint` 通过；`measureElement` 绑定点仅在 `virtualEnabled=true` 分支渲染。

### 步骤 8：同步 `packages/desktop/src/components/table/node/row.ts` 注释

文件第 35 行附近有注释提到 `useVirtual 的 getItemKey: i => rows[i].uid ...`，将 `useVirtual` 改为 `useVirtualizer`，以免后续阅读者按旧名搜索不到。

完成标准：该注释引用已更新；`ripgrep "useVirtual\b" packages/` 在 `packages/desktop/` 范围内应零命中。

### 步骤 9：同步 skill 文档与生成产物

本步骤严格遵守 `skills/AGENTS.md` 编辑约束 #1："不要修改 `generated/` 下的文件"——`generated/` 下的任何改动都必须通过运行同步脚本驱动，不得手动编辑内容或直接手动重命名文件。

#### 9.1 确认同步脚本行为

读取 `tools/skills-sync/sync-veltra-compositions.ts`，确认：

- 该脚本扫描 `packages/compositions/src/` 的目录名作为模块名生成 `generated/modules/*.md`；
- 该脚本是否会**清理已不存在模块**对应的旧产物（即当 `use-virtual/` 被删除后，是否会自动删除 `generated/modules/use-virtual.md`）。

#### 9.2 手写参考文档（references/）与外部入口更新

以下文件手动编辑（均非 `generated/` 目录，不违反编辑约束）：

- `skills/veltra-compositions/references/api-map.md`：将 `useVirtual` 条目重写为 `useVirtualizer`：
  - 签名：`useVirtualizer(options: { count: Ref<number>; scrollEl: ShallowRef<HTMLElement | null> } & VirtualizerOptions): { virtualizer: Virtualizer; snapshot: ShallowRef<VirtualSnapshot> }`
  - 补充 re-export 的类型清单（见步骤 1）
  - **明确标注 `initialOffset` / `initialViewport` 仅在构造时生效**，后续 `setOptions` 调用会忽略这两字段
  - 说明 `count` / `scrollEl` 是唯一响应式字段；其他选项需运行时切换请调 `virtualizer.setOptions({...})`
- `skills/veltra-compositions/references/usage-patterns.md`：3 段 `useVirtual` 示例（下拉 / 表格 / 树）整段重写为 `useVirtualizer` + 消费者侧自组 key / `virtualEnabled` / `scrollTo` 的形态，示例代码的业务语义必须与本计划步骤 4b–7 的实际迁移后代码保持一致（导入路径使用包名 `@veltra/compositions`，不使用 workspace 别名，遵守 `skills/AGENTS.md` 第 11 行约束）。
- `skills/veltra-compositions/references/source-discovery.md`：搜索 `useVirtual` 关键词替换为 `useVirtualizer`；涉及的源码锚点路径（`use-virtual/index.ts` → `use-virtualizer/index.ts`）同步更新。
- `skills/veltra-compositions/SKILL.md`：若含 `useVirtual` 引用则替换为 `useVirtualizer`，并确保文件仍在 500 行以内。
- `packages/compositions/AGENTS.md`：
  - **第 21 行**（或等效位置）的"组合式函数列表"表格里，将
    ```
    | `use-virtual`         | `useVirtual`                               | 虚拟滚动                                           |
    ```
    替换为
    ```
    | `use-virtualizer`     | `useVirtualizer`                           | 虚拟滚动低阶适配层（返回 `{ virtualizer, snapshot }`，业务语义由消费者组装） |
    ```
  - 文件内若还有其他 `useVirtual` 引用一并替换。

#### 9.3 运行同步脚本刷新 generated/

根据 `skills/AGENTS.md` 的说明，Veltra 技能同步脚本由根 `package.json` 的 `sync-veltra-*` / `sync-skills` 调用。根据 9.1 读到的实际脚本名运行：

```
bun run sync-veltra-compositions       # 具体命令以根 package.json 的 scripts 为准
```

或 `bun run sync-skills`（按实际 scripts 选择）。脚本运行后：

- `skills/veltra-compositions/generated/modules/` 下的产物应已按新目录名刷新为 `use-virtualizer.md`（或等效名称）；
- `skills/veltra-compositions/generated/manifest.json` 的 hash 应已刷新；
- `skills-lock.json`（若该脚本联动刷新）应已更新。

#### 9.4 处理脚本未清理的残留产物

若 9.1 的阅读结论是"脚本不会清理已不存在模块对应的旧产物"，则在 9.3 执行完成后，**显式手动删除 `skills/veltra-compositions/generated/modules/use-virtual.md`** 这一个文件（这是为了让 `generated/` 与现实模块对齐，属于"删除残留"而非"修改生成内容"）。

若 9.1 的阅读结论是"脚本会自动清理"，则 9.4 跳过。

#### 9.5 验证

- `ripgrep "useVirtual\b" skills/ packages/compositions/AGENTS.md` 零命中（`useVirtualizer` 不算）；
- `ripgrep "useVirtual\b" .agent-context/whj/` 的命中仅位于 `done/` 归档目录，不动。

完成标准：以上 9.1-9.5 全部执行；`skills/` 与 `packages/compositions/AGENTS.md` 不再残留 `useVirtual` 旧名（归档目录除外）；`generated/` 产物由脚本刷新，未手动编辑内容。

### 步骤 10：回归验证

- **全仓静态检查**：按 `AGENTS.md` 定义的命令依次执行——
  - `bun run check-types`（turbo run check-types）
  - `bun run lint`（oxlint）
  - `bun run test`（turbo run test，含 playground 的 vitest）

  以上任一步出现错误必须修复，**不得以 `@ts-ignore` / `eslint-disable` 等任何方式规避**（遵守仓库根 `AGENTS.md` 约束）。

- **playgrounds/desktop 手动验证**（以下项均需目测无报错、无视觉退化）：
  - Table：10 行 / 100 行 / 1000 行三档数据量下渲染与滚动无抖动；特别验证滚动途中 `isScrollingRelay` 驱动的固定列阴影/高亮行为与迁移前一致；若 `playgrounds/desktop/src/table-benchmark/` 下的 bench 页存在，也应验证正常渲染（无 `useVirtual` 旧名残留导致的编译失败）；`scrollToIndex` 调用路径（若 demo 页有"滚动到第 N 行"交互）对齐行为仍为 `center`。
  - Tree：展开 / 收起 / 过滤场景下无 DOM 闪烁、无 `[Vue warn]: Duplicate keys detected`；切换数据集后再次滚动无首屏抖动（这是原 `node.key || item.key` 兜底删除后的重点验证项）。
  - Select / MultiSelect：下拉渲染、搜索过滤、键盘导航、滚动到选中项（若 demo 支持）均无退化。

- **静态搜索校验**：`ripgrep "useVirtual\b" packages/ playgrounds/ skills/` 零命中（历史归档 `.agent-context/whj/done/**` 除外）。

完成标准：以上三类检查全部通过，无回归缺陷。

## 影响范围

### 新增

- `packages/compositions/src/use-virtualizer/index.ts`：新的 Vue 薄适配层 hook，仅负责订阅底层 `Virtualizer` 的快照并把 `count` / `scrollEl` 接入 Vue 生命周期；业务语义全部回到消费者侧。
- `skills/veltra-compositions/generated/modules/use-virtualizer.md`：sync 脚本产出的新生成物。

### 删除

- `packages/compositions/src/use-virtual/`：旧 hook 目录（含 `index.ts`）整体移除，`CustomVirtualItem` / `VirtualReturned` / `Options` 等旧类型全部随之删除；`virtualThreshold` / Vue 层 key 组装 / `scrollTo` 对齐模式等业务决策不再由 hook 承担。
- `skills/veltra-compositions/generated/modules/use-virtual.md`：sync 脚本刷新 `generated/` 时自动清理。

### 修改

- `packages/compositions/src/index.ts`：barrel 从 `export * from './use-virtual'` 改为 `export * from './use-virtualizer'`。
- `packages/desktop/src/components/table/di.ts`：移除 `VirtualReturned` 依赖，改用来自 `@veltra/compositions` 的 `VirtualItem`；`TableDIKey` 契约内虚拟化相关字段（`virtualList` / `totalHeight` / `beforeSize` / `afterSize` / `virtualEnabled` / `isScrolling` / `measureElement` / `scrollTo`）就地显式声明，字段名与下游消费者保持一致，避免级联改动。
- `packages/desktop/src/components/table/table.vue`：import 切到 `useVirtualizer`；解构 `{ virtualizer, snapshot }`；消费者侧新增 `virtualEnabled` / `virtualList` / `totalHeight` / `beforeSize` / `afterSize` / `isScrolling` 等 computed，`measureElement` / `scrollTo` 在本文件包一层薄封装保留对下游的签名；`LENGTH_DELTA_RATIO_TO_RESET_SCROLL` 分支未改动。
- `packages/desktop/src/components/tree/tree.vue`：import 切到 `useVirtualizer`；`virtualThreshold: 80` 内化为消费者侧 `computed`；`virtualNodes` 中 `node.key || item.key` 的兜底逻辑删除，身份稳定性由底层 `getItemKey` 保证；`scrollTo` 保持对外 API 不变。
- `packages/desktop/src/components/select/select.vue`：import 切到 `useVirtualizer`；`baseVirtualEnabled` / `virtualEnabled`（叠 `!props.grid`）显式拆分；`virtualOptions` 改由 `snapshot.value.items.map` 产出。
- `packages/desktop/src/components/multi-select/multi-select.vue`：import 切到 `useVirtualizer`；`virtualEnabled` 内化为 `options.length > 80`；`virtualOptions` 改由 `snapshot.value.items.map` 产出。
- `packages/desktop/src/components/table/node/row.ts`：注释中 `useVirtual` 引用更名为 `useVirtualizer`。
- `packages/desktop/src/components/table/table-row.tsx`：`measureElement` 调用点参数顺序翻转为 `(index, el)`（patch-1）。
- `packages/desktop/src/components/tree/tree-node.vue`：`measureElement` 调用点参数顺序翻转为 `(index, el)`（patch-1）。
- `packages/desktop/src/components/multi-select/multi-select-option.vue`：`measureElement` prop 签名与调用点参数顺序翻转为 `(index, el)`（patch-1）。
- `packages/desktop/src/types/tree.ts`：`TreeNodeProps.measureElement` 签名翻转为 `(index, el)`（patch-1）。
- `packages/compositions/AGENTS.md`：组合式函数列表中的 `use-virtual` 条目更新为 `use-virtualizer` 及其新职责描述。
- `skills/veltra-compositions/SKILL.md`：触发词 / 导入示例 / 函数速查表 / 场景选用说明中的 `useVirtual` 全部改为 `useVirtualizer`，并说明其为低阶适配层。
- `skills/veltra-compositions/references/api-map.md`：模块总览和详细条目改为 `useVirtualizer`，补充完整签名、re-export 类型清单、`initialOffset` / `initialViewport` 仅构造期生效的 caveat 以及底层常用方法清单。
- `skills/veltra-compositions/references/usage-patterns.md`：3 段示例（下拉 / 表格 / 树）整段重写为 `useVirtualizer` + 消费者自组 key / `virtualEnabled` / `scrollTo`；新增"为什么业务语义不再封装进 hook"一节解释设计动因。
- `skills/veltra-compositions/references/source-discovery.md`：搜索关键字 `useVirtual(` 替换为 `useVirtualizer(`。
- `skills/veltra-compositions/generated/manifest.json`：sync 脚本自动刷新模块清单与时间戳。

## 历史补丁

- patch-1: 移除 virtualizer 尺寸的 Vue 响应式绑定，改走 DOM 命令式写入
