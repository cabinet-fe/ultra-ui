# use-virtual 对接新 Virtualizer API（破坏性升级）

> 状态: 未执行

## 目标

`@cat-kit/fe` 的 `Virtualizer` 发生了显著 API 升级（`mount/unmount → connect/disconnect`、`overscan → buffer`、新增 `useMeasuredAverage`、`getItemKey`、`measureMany`、`isScrolling` 等），而 `packages/compositions/src/use-virtual/` 仍对接旧 API 并自行维护了 `estimateCalibrated` 首帧校准。本计划对 `useVirtual` 做破坏性升级，达成：

1. 内部切换到新 `Virtualizer` 方法名与字段名（`connect/disconnect`、`buffer`）。
2. 去除 `useVirtual` 内的 `estimateCalibrated` / `calibrationSkipped` / `MAX_CALIBRATION_ATTEMPTS` 校准逻辑，改由上游 `useMeasuredAverage: true` 接管。
3. 新增可选 `getItemKey` 参数，让 `table` / `tree` 在数据增删/排序时保留未变动行的真实测量值，从根因消除"数据更新后再次滚动首屏抖动"。
4. 暴露 `isScrolling` 给调用方，为后续 `table` 在滚动期间抑制非必要计算提供基础。
5. 同步升级全部 4 处调用方（`table` / `tree` / `select` / `multi-select`），保证不出现回归。

本计划是 plan-37（压测页）、plan-38（Table 性能优化）的前置基础设施。

## 内容

### 步骤 1：改造 `packages/compositions/src/use-virtual/index.ts` 的 `Options` 与默认值

修改点：

- 字段更名：`overscan?: number`（默认 `3`）→ `buffer?: number`（默认 `4`，对齐上游）。
- **保留** `scrollEl: ShallowRef<HTMLElement | null>` 原命名（不改为 `scrollElement`），仅减少调用方改动面；内部绑定走 `v.connect(el)`。
- 新增可选字段 `getItemKey?: (index: number) => number | string`。
- 新增可选字段 `horizontal?: boolean`（默认 `false`），直接透传给 `Virtualizer`；当前四处调用方不传。
- `estimateSize?`、`gap?`、`paddingStart?`、`paddingEnd?`、`virtualThreshold?`、`count`、`scrollEl` 保持不变。

产出物验收：编译通过；`Options` 类型定义与上述字段集合完全一致。

### 步骤 2：改造 `useVirtual` 内部实例化

- 构造参数：`new Virtualizer({ count: count.value, buffer, horizontal, paddingStart, paddingEnd, gap, estimateSize: estimateSize ?? defaultEstimateSize, getItemKey, useMeasuredAverage: true })`。
- 绑定滚动容器：旧 `v.mount(el)` → `v.connect(el)`；解绑：`v.unmount()` → `v.disconnect()`。
- `v.subscribe(snapshot => ...)` 读取 `snapshot.totalSize / beforeSize / afterSize / items / isScrolling`；结构性变化策略维持不变。

产出物验收：不再出现 `v.mount(`、`v.unmount(`、`overscan` 字样。

### 步骤 3：删除冗余的首帧校准代码

删除 `useVirtual` 内下列片段：

- `let estimateCalibrated = false`
- `let calibrationSkipped = 0`
- 常量 `MAX_CALIBRATION_ATTEMPTS`
- `measureElement` 内对 `offsetHeight` 的读取与 `v.setOptions({ estimateSize })` 的回写

`measureElement` 重写为：

```ts
function measureElement(el: Element | null, index: number) {
  if (!enabled.value) return
  if (!Number.isInteger(index) || index < 0) return
  v.measureElement(index, el)
}
```

产出物验收：`use-virtual/index.ts` 内不再出现 `estimateCalibrated`、`calibrationSkipped`、`MAX_CALIBRATION_ATTEMPTS` 标识符；文件行数应减少至少 25 行。

### 步骤 4：暴露 `isScrolling`

- 新增 `const isScrolling = shallowRef(false)`。
- 在 `v.subscribe` 回调中同步 `isScrolling.value = snapshot.isScrolling`。
- `VirtualReturned` 接口新增字段 `isScrolling: ShallowRef<boolean>`。
- `useVirtual` 返回值中加入 `isScrolling`。

产出物验收：`VirtualReturned` 类型包含 `isScrolling`；消费方可通过解构直接拿到。

### 步骤 5：`watch` 重组

- `watch(count, c => v.setCount(c))` 保持。
- 增加 `watch(() => options.getItemKey, fn => v.setOptions({ getItemKey: fn }))`，仅当 `getItemKey` 是 `Ref` 或 `getter` 时才 watch；传入普通函数时构造期一次性生效即可。（实现时明确区分两类入参）
- `watch([scrollEl, enabled], ...)` 内部 `v.mount` / `v.unmount` 全部替换为 `v.connect` / `v.disconnect`。

产出物验收：`count` 变化、`getItemKey` 变化、`scrollEl` 变化、`enabled` 切换均能正确驱动 `Virtualizer`。

### 步骤 6：同步升级 `packages/desktop/src/components/table/table.vue`

- `useVirtual({...})` 传入 `getItemKey: (i) => rows.value[i]?.uid ?? i`。
- 从 `virtualCtx` 解构 `isScrolling` 并 `provide` 给后代（为 plan-38 使用；本计划仅提供，不消费）。
- 保持原有 `estimateSize: () => 41` 与 `virtualThreshold` 参数不变。

### 步骤 7：同步升级 `packages/desktop/src/components/tree/tree.vue`

- `useVirtual({...})` 传入 `getItemKey: (i) => nodes.value[i]?.key ?? i`。
- 其他字段不变。

### 步骤 8：同步升级 `packages/desktop/src/components/select/select.vue` 与 `multi-select/multi-select.vue`

- 不传 `getItemKey`（数据较稳定，不做强制要求）。
- 仅确认 `useVirtual` 破坏性字段（`overscan` 未使用）不影响这两个文件，**无需改动即应能继续工作**；若 TypeScript 编译报错，再按最小改动修复。
- 两个文件各手动打开对应 playground demo 页验证下拉渲染与滚动行为无退化。

### 步骤 9：同步更新 `@veltra/compositions` skill 文档

受影响的 skill 资产：

- `skills/veltra-compositions/generated/modules/use-virtual.md`（覆盖式重新生成或手动同步）
- `skills/veltra-compositions/references/api-map.md`（检索 `useVirtual` 条目并更新签名）
- `skills/veltra-compositions/references/usage-patterns.md`（若含 `useVirtual` 示例则更新 `getItemKey` 新用法）
- `skills/veltra-compositions/generated/manifest.json`（按 `skills/AGENTS.md` 要求刷新 hash）
- `skills-lock.json`（若扫描任务会触发则同步更新）

实施时严格按 `skills/AGENTS.md` 的生成/校验流程操作，不自行编造文件格式。

### 步骤 10：自检与回归

- `pnpm -w -r tsc --noEmit` 全仓 TS 编译通过（或对应等价命令，按仓库 CI 配置来定）。
- `pnpm -w lint` 通过。
- 启动 `playgrounds/desktop`，逐项手动验证：
  - Table：10 行、100 行、1000 行下渲染无报错，滚动无抖动。
  - Tree：展开/收起、虚拟化开启/关闭切换正常。
  - Select / MultiSelect：下拉渲染、搜索、滚动正常。
- 本计划**不**要求提供量化性能数据（留待 plan-37、plan-38）。

### 步骤 11：自测清单

在 `implement` 阶段收尾前，逐条勾选：

- [ ] `use-virtual/index.ts` 内零 `mount(` / `unmount(` / `overscan` 残留。
- [ ] `VirtualReturned` 暴露 `isScrolling`。
- [ ] 4 处调用方 TS 编译通过。
- [ ] Table 传入了 `getItemKey`，Tree 传入了 `getItemKey`。
- [ ] Select / MultiSelect 手动 demo 无回归。
- [ ] skill 文档已同步。

## 影响范围

## 历史补丁
