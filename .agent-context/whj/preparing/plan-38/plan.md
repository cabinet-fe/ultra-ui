# Table 组件性能优化（基于新虚拟化 API 与压测基线）

> 状态: 未执行

## 目标

在 plan-36（`useVirtual` 新 API、`getItemKey`、`isScrolling`）与 plan-37（playground 压测页与采集控制台）已就位的前提下，对 `packages/desktop/src/components/table/` 做系统性性能优化，用量化报告证实每一项改动的收益：

1. 先在 plan-37 提供的压测页面采集完整 baseline。
2. 按 A/B/C/D/E 五组独立优化项逐一实施、逐一验证；每一项未达达标阈值即回退，不留"改了但不确定有没有用"的代码。
3. 产出最终 `report.md`，记录每项改动的前后指标差值与结论。

本计划关注**可证实的性能收益**，不追求主观代码整洁度。不达标的优化项会被显式回退。

## 内容

### 步骤 0：依赖前置检查

开始前确认：

- plan-36 已 `done`（`useVirtual` 新 API 就绪，`getItemKey` / `isScrolling` 已暴露并在 `table.vue` 中 provide）。
- plan-37 已 `done`（压测页可用，JSON 报告结构稳定）。

若任一未完成，暂停本计划实施并回到 plan 协议调整。

### 步骤 1：采集 baseline 与归档

- 在压测页下列 6 个场景采集 baseline 报告并点击"保存为 baseline"：
  1. `1e4 行 / 10 列 / stripe`
  2. `1e4 行 / 10 列 / stripe + fixedLeft`
  3. `1e4 行 / 10 列 / stripe + checked`
  4. `1e4 行 / 30 列 / stripe + fixedLeft + fixedRight`
  5. `1e5 行 / 10 列 / stripe`
  6. `1e3 行 / 10 列 / tree`
- 将 6 份 baseline JSON 汇总到 `.agent-context/whj/plan-38/baseline.json`（文件为数组形式，仅存档，不进入 git 产物）。

### 步骤 2：优化项 A — 行级渲染开销削减

改动范围：`packages/desktop/src/components/table/table-row.tsx`。

具体动作：

- **a1**：在模块顶层或 `setup` 外缓存 `rowClsBase = cls.e('row')` 等静态字符串常量（cls 本身来自 inject，需在 setup 内一次取出到闭包），避免每次渲染调用 `cls.e`。
- **a2**：`measureRef` 按 `index` 缓存 `Map<number, (el: unknown) => void>`，避免每次 render 新建闭包（需在组件卸载时清 Map；Map 尺寸以当前虚拟渲染行数为上限，不会长期膨胀）。
- **a3**：`cls.e('row')` + `bem.is('current', ...)` + `bem.is('checked', ...)` + `bem.is('expanded', ...)` 字符串拼接从 JSX 层挪到一个独立的派生函数，结果按 `row.isCurrent + row.checked + row.expanded` 组合缓存（3 bit × 8 种组合，静态表），消除动态字符串拼接。

实施约束：

- 每个子动作 a1 / a2 / a3 **独立提交一次压测对比**。
- 判定阈值：`scrollFps.avg` 在任一大数据量场景（1e4 / 1e5 行）提升 ≥ 3%，或 `longTaskCount` 下降 ≥ 10%；否则回退该子动作。

### 步骤 3：优化项 B — 单元格渲染开销削减

改动范围：`packages/desktop/src/components/table/table-cell.vue`、`use-table.ts`。

具体动作：

- **b1**：`getCellClass(column)` 的结果按 `(column.uid, leftFixed.value, rightFixed.value)` 三元组在 `useTable` 内建立 `computed` + Map 缓存；`leftFixed` / `rightFixed` 变化时整张表失效重算。
  - 产出前确认：`column.uid` 或等价稳定标识已存在（`ColumnNode` 当前是否有 uid 需在实施阶段确认；若无需先加）。
- **b2**：`table-cell.vue` 改为**无状态** functional 渲染（`defineComponent({ name, functional... })` 在 Vue 3 以 setup 返回 render 函数实现），取消 cell 内部的 `inject(TableDIKey)`；`class` 由父级 `table-row` 计算后作为 `:class` prop 传入。
  - 这要求 `table-row` 渲染每个 cell 前预先算好 class 字符串；由于 `columns` 变化频率远低于 `rows`，收益来自消除每 cell 的 inject 开销。

实施约束：

- b1 与 b2 独立验证；每项未达阈值（同步骤 2）则回退。
- 必须通过现有的 `packages/desktop` 组件测试（如存在）；若测试缺失，**不**因本计划新增测试，仅手动在压测页与 playground 主 demo 页做回归。

### 步骤 4：优化项 C — stripe 与行态类名下沉

改动范围：`packages/desktop/src/components/table/table-body.vue`。

具体动作：

- **c1**：`getStripeCls` 改为两个常量字符串查找表：`STRIPE_CLS = [bem.is('stripe', false), bem.is('stripe', true)]`，按 `stripeIndex & 1` 取值。
- **c2**：`bem.is('current', row.isCurrent)` 与 `bem.is('checked', row.checked)` 的拼接挪到 `TableRowNode` 派生属性，或通过 CSS 属性选择器 `[data-current][data-checked]` 配合 `data-*` attr 替代 class 拼接。
  - 二选一，实施阶段先做 A 方案（派生属性）；若性能数据未变化再尝试 B 方案（data-*）。

实施约束：c1 与 c2 独立验证；不达标回退。

### 步骤 5：优化项 D — 滚动期间的抑制

依赖：plan-36 已 provide `isScrolling`。

改动范围：`packages/desktop/src/components/table/use-fixed-columns.ts`、`table.vue`、`use-rows.ts`（如涉及 `currentRow` hover）。

具体动作：

- **d1**：`useFixedColumns` 的 shadow 切换（`leftFixed` / `rightFixed` 的 boolean 派生）在 `isScrolling === true` 时跳过更新，`isScrolling` 恢复 false 时做一次性补算。
- **d2**：`handleCellClick` / `handleRowClick` 的 `currentRow` 高亮写入，在 `isScrolling === true` 时整体跳过（滚动中点击本来也不符合预期）；滚动结束后恢复。

实施约束：

- 需在压测页额外测试：滚动结束后 300ms 内 shadow / 高亮状态必须正确。
- 不达标或引入视觉滞后（shadow 切换肉眼可见延迟 > 200ms）则回退。

### 步骤 6：优化项 E — 数据更新路径

改动范围：`packages/desktop/src/components/table/table.vue`、`use-rows.ts`。

具体动作：

- **e1**：删除 `table.vue` 中的 `watch(() => props.data, () => scrollRef.value?.scrollTo({ y: 0 }))` 无条件置顶逻辑。改为：仅当 `props.data` **引用替换且前后长度差值 / max(前后长度) ≥ 0.5**（即数据集发生显著变化，如翻页）时才置顶；其他场景（局部增删、排序）保留滚动位置。
- **e2**：配合 plan-36 的 `getItemKey = row => row.uid`，新增一条 assertion（开发构建下）：`TableRowNode.uid` 在整个实例生命周期内稳定；`use-rows.ts` 的 `row.copy()` 路径若会生成不同的 uid，需确认对虚拟化测量缓存的影响并调整（要么保持同 uid，要么接受每次复制后重测）。

实施约束：

- e1 的阈值逻辑要写成常量 + 注释说明选择 0.5 的理由。
- e2 需在 expandable 行 + 虚拟化组合场景下做回归（压测页内增加 expandable 开关，如未覆盖则在 plan-37 完成后 patch 一次）。

### 步骤 7：每一项改动的标准流程

对步骤 2 ~ 6 中每个原子子动作，严格按以下流程：

1. 在干净 baseline 的基础上**仅**实施一个子动作。
2. 在压测页对步骤 1 的 6 个场景全部跑一遍，导出 6 份 JSON；用「对比 baseline」记录差值。
3. 汇总子动作的全部差值到 `.agent-context/whj/plan-38/results/<子动作编号>.json`（例：`a1.json`）。
4. 判定：
   - 达标（按每项声明的阈值）→ 保留改动并推进。
   - 未达标或出现回归 → `git restore` 该子动作涉及的改动；在 `plan.md` 的 `## 历史补丁` 区域（或独立记录文件）记录「未采纳：<原因摘要>」。
5. 进入下一子动作。

### 步骤 8：产出汇总报告

所有子动作完成后，在 `.agent-context/whj/plan-38/report.md` 产出：

- 表格 1：场景 × 指标 × (baseline / final / Δ / Δ%)。
- 表格 2：每个子动作的采纳结论（采纳 / 未采纳 + 原因）。
- 段落：最终的整体性能改善摘要，以及遗留问题 / 后续可探索方向。

本文件留在 `.agent-context/whj/plan-38/`，不进入 git 产物。

### 步骤 9：收尾与 PR 组织

- 确认主代码 diff 不包含 `.agent-context/` 下任何文件。
- 按步骤 2~6 子动作划分 commit，每个 commit 标题形如 `perf(table): <子动作简述>`。

### 自检清单

- [ ] 所有子动作均有 baseline-vs-current 对比数据。
- [ ] 所有"未采纳"子动作的改动已完全回退，仓库中零残留。
- [ ] `report.md` 完整覆盖 6 个场景 × 5 组优化项的矩阵。
- [ ] Table 在现有 demo / 使用场景下无功能回归。

## 影响范围

## 历史补丁
