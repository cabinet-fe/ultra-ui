# 同步 skills 文档并加固 estimateSize 首次校准锚点

## 补丁内容

review 指出 patch-3 实施后存在两处残留隐患，需在不改变对外契约的前提下补齐：

### 1. skills 生成文档未同步（主要问题）

patch-3 将 `useVirtual.measureElement` 签名从 `(el: any) => void` 改为 `(el: Element | null, index: number) => void`，并把 `TreeNodeProps.measureElement` 等对外类型同步刷新，但漏跑 `bun tools/skills-sync/sync-veltra-compositions.ts` 与 `bun tools/skills-sync/sync-veltra-desktop.ts`，导致：

- `skills/veltra-compositions/generated/modules/use-virtual.md` L47、L126 仍展示旧签名 `measureElement: (el: any) => void` 与旧的 `dataset.index` 解析实现；
- `skills/veltra-desktop/generated/components/tree.md` L84 仍展示 `measureElement?: (el: any) => void`。

这些镜像文档是协作者阅读 skills 时的唯一来源，与实际 `packages/` 源代码脱节会误导后续在此基础上的消费者改造。本补丁重新执行两条同步脚本：

- `bun tools/skills-sync/sync-veltra-compositions.ts`：刷新 13 个 `use-*` 模块镜像，`use-virtual.md` 的类型注释与实现代码现在与 `packages/compositions/src/use-virtual/index.ts` 完全一致（包含 `beforeSize / afterSize`、`Element | null` 签名、ResizeObserver 解绑说明、estimateSize 首次校准说明）。
- `bun tools/skills-sync/sync-veltra-desktop.ts`：刷新 71 个组件镜像；`tree.md` 的 `TreeNodeProps` 更新为 `index?: number` + `measureElement?: (el: Element | null, index: number) => void`；其余组件产生的是代码块前后空行等格式化层面的规范化差异，属同步器本轮一致性输出范畴。

### 2. estimateSize 首次校准锚点加固（防御性改进）

patch-3 引入的「首次真实测量后一次性调用 `v.setOptions({ estimateSize })` 做校准」逻辑，在**表格 expand 行、分组行**等异形行被首帧渲染顺序捕获时，存在把 `estimateSize` 锁定到不代表普通行的值的理论风险（expand 行需要用户点击才出现，实际命中概率极低，但此前补丁未对该边界做防御）。本补丁把 `useVirtual` 的 `measureElement` 校准策略调整为：

- **首选索引 0 作为校准锚点**：索引 0 在初次挂载（`scrollTop = 0`）时几乎必然落在首屏渲染范围内，且通常就是「普通行」，因此作为首选校准对象最能代表常规行高。测量到 `index === 0` 时立即以其真实高度完成校准并 lock。
- **降级阈值**：对于「初始 `scrollTop > 0`」（如 keep-alive 恢复、外部设置滚动位置）的边界场景，索引 0 可能整轮渲染都不会出现。为避免 `estimateSize` 永远停留在调用方初值上，新增 `MAX_CALIBRATION_ATTEMPTS = 5` 次「非零索引跳过」计数；累计跳过 5 次后对下一次测量无条件完成校准。阈值 5 是一个在「防止首测异形行污染」与「避免永久停留在初值」之间的保守折中。
- **不新增对外 API**：`Options` / `VirtualReturned` / `CustomVirtualItem` 保持不变；`measureElement` 对消费者侧（`u-table` / `u-tree` / `u-select` / `u-multi-select`）仍以 `(el, index)` 形式被调用，零改动。

相关注释同步扩写 `estimateCalibrated` 文档块，完整记录「为什么优先用索引 0」与「阈值降级」的动机，避免后续协作者误以为原始行为。

### 3. 验证

- `bun run check-types`（`packages/compositions` + `packages/desktop`）：仅剩 `@cat-kit/core@1.0.7` 自身的 `Buffer / process` 上游告警（与本补丁无关、与 patch-2 记录一致），无新增类型错误。
- Playground 运行时回归（dev server `http://localhost:7790`，通过浏览器 MCP）：
  - `/tree/index`（1000 节点，虚拟分支）：渲染正常，无虚拟相关 console 错误。
  - `/select/index`（80 选项，触发 `count > virtualThreshold` 边界，走非虚拟分支）：下拉展开渲染 80 项正常，无错误。
  - `/multi-select/index`（200 选项，虚拟分支）：下拉展开渲染正常，选中项回填正确。
  - `/table/index`（200 行，虚拟分支）：列宽稳定、滚动条无抖动，无新增错误。
- 四个页面的 console 过滤后（排除预先存在的 `@veltra/styles` 主题变量弃用警告），均无虚拟列表相关错误。

### 4. 关于「重复防御」

review 亦指出 `tree-node.vue` / `multi-select-option.vue` 的 `measureRef` 内 `typeof props.index !== 'number'` 守卫与 `useVirtual.measureElement` 内部 `Number.isInteger(index) || index < 0` + `enabled` 守卫属重复防御。**本补丁未做代码合并**：子组件端的守卫用于在「非虚拟分支不传 `index`」时完全短路 ref 回调，避免在未挂载场景下产生无意义调用；适配层端守卫则是最后一道数据护栏。两层守卫职责不同（调用方短路 vs 适配层兜底），冗余成本低、收益清晰，按 review 结论「非严重问题，冗余防御可接受」处理。

## 影响范围

- 修改文件: `packages/compositions/src/use-virtual/index.ts`
- 修改文件: `skills/veltra-compositions/generated/manifest.json`
- 修改文件: `skills/veltra-compositions/generated/modules/use-virtual.md`
- 修改文件: `skills/veltra-compositions/generated/modules/use-fallback-props.md`
- 修改文件: `skills/veltra-compositions/generated/modules/use-user-action.md`
- 修改文件: `skills/veltra-desktop/generated/manifest.json`
- 修改文件: `skills/veltra-desktop/generated/catalog.md`
- 修改文件: `skills/veltra-desktop/generated/categories/*.md`（7 个分类索引）
- 修改文件: `skills/veltra-desktop/generated/components/tree.md`
- 修改文件: `skills/veltra-desktop/generated/components/*.md`（其余 70 个组件镜像的格式化规范化）
