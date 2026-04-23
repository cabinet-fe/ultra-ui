# Table 性能基线：playground 压测页与内置采集控制台

> 状态: 未执行

## 目标

为 `u-table` 的性能优化建立**可重复、可量化**的基线工具。本计划交付一个 playground 页面，具备：

1. 多档数据规模与典型场景组合切换；
2. 页内自动化采集 FPS、首次渲染耗时、long task 计数、内存占用；
3. 一键导出结构化 JSON 报告，并支持「保存为 baseline / 与 baseline 对比」。

plan-38（Table 组件优化）将依赖本计划提供的工具采集 baseline、对每项优化做前后对比，并以此判定是否采纳该项。

本计划**不**修改 `u-table` 源码，也**不**引入新的生产依赖。

## 内容

### 步骤 1：页面骨架

在 `playgrounds/desktop/src/pages/` 下新增 `table-benchmark.vue`（或按现有路由命名规范微调；实施前先读取 `playgrounds/desktop/AGENTS.md` 与现有页面目录确认风格）。

顶部控制区字段：

- 数据规模单选：`1e3` / `1e4` / `1e5`（默认 `1e4`）。
- 列规模单选：`10 列` / `30 列`（默认 `10 列`）。
- 场景开关（多选）：`stripe` / `border` / `fixed 左列` / `fixed 右列` / `开启勾选` / `tree 模式（仅 1e3 可用）`。
- 操作按钮：`重建数据` / `开始滚动压测` / `拷贝报告` / `保存为 baseline` / `对比 baseline`。

主体区：`u-table` 实例，props 跟随上方开关。

右侧抽屉：`BenchmarkPanel`（见步骤 3）。

### 步骤 2：数据生成器

在同页面内以纯函数形式提供：

```ts
function createRows(count: number, cols: number): Record<string, any>[]
function createColumns(cols: number): TableColumn[]
```

要求：

- 行对象必有稳定 `id`（从 1 递增），作为 `rowKey`。
- 列以 `col0` ~ `colN` 命名；至少包含 1 列 number、1 列字符串、1 列日期（字符串形式）、1 列 bool。
- 数据生成不使用 `Math.random()`；使用种子伪随机（页面内自实现简单 LCG），保证两次相同参数生成的数据一致。

### 步骤 3：`BenchmarkPanel` 子组件（同页文件 or 相邻独立文件）

功能与实现细节：

**(a) FPS 采集**

- 基于 `requestAnimationFrame` 循环统计每帧 delta，窗口 `1000ms`。
- 输出 `min`、`avg`、`p95`；`p95` 用窗口内所有帧 delta 排序取分位数。
- 面板常驻显示当前 `avg fps`，但**仅在点击"开始滚动压测"时**才开启采样窗口记录历史值；未压测时 rAF 循环仅用于实时展示，不写入历史，避免干扰 devtools 观察。

**(b) 初次渲染耗时**

- 页面「重建数据」按钮按下时，先 `performance.clearMarks()` + `performance.mark('table-rebuild-start')`。
- 利用 `useVirtual` 的 `measureElement` 对首个可见行 ref 的首次触发作为 `table-first-row` 标记。
  - 实现方式：包一层自定义 directive 或 ref 函数，仅在首次被调用时执行 `performance.mark('table-first-row')`；再次重建时由 BenchmarkPanel 重置 flag。
- 产出字段 `firstRowMs = measure('table-rebuild-start', 'table-first-row').duration`。

**(c) 滚动压测**

- 点击「开始滚动压测」后，按如下过程驱动滚动：
  - 读取当前 `scrollEl.scrollHeight - scrollEl.clientHeight` 得到 `maxTop`。
  - 以固定速度 `2000 px/s` 线性匀速从 `scrollTop=0` 滚动到 `maxTop`，再回到 0，记为一次 loop，共跑 3 个 loop。
  - 滚动采用 rAF 内修改 `scrollTop`（不走 `scrollTo({ behavior: 'smooth' })` 以避免被浏览器节流）。
- 期间同步采集：FPS（步骤 3a）、长任务数（`PerformanceObserver({ entryTypes: ['longtask'] })`）、内存峰值（`performance.memory.usedJSHeapSize`，每 250ms 采一次）。

**(d) 报告结构**

导出 JSON（按钮「拷贝报告」），结构固定：

```ts
interface BenchmarkReport {
  timestamp: number
  scenario: {
    rowCount: number
    columnCount: number
    stripe: boolean
    border: boolean
    fixedLeft: boolean
    fixedRight: boolean
    checked: boolean
    tree: boolean
  }
  metrics: {
    firstRowMs: number
    scrollFps: { min: number; avg: number; p95: number }
    longTaskCount: number
    longTaskTotalMs: number
    usedJSHeap: { start: number; peak: number; end: number } | null  // null 表示 Chromium 外环境不可用
  }
  ua: string
}
```

**(e) baseline 机制**

- 保存 baseline：按场景 key（`JSON.stringify(scenario)`）写入 `localStorage`，storage key 前缀 `ultra-ui:table-bench:baseline:`；值为 `BenchmarkReport`。
- 对比 baseline：读取当前场景的 baseline；输出 diff 面板，逐项显示 `baseline → current (+/- %)`。
- 若当前场景没有 baseline，给出提示。

**(f) UI 要求**

- 面板以右侧固定宽度 `360px` 抽屉形式存在，不挤压 `u-table` 的 scroll 容器宽度（通过 `position: fixed` 独立层级）。
- 不使用 `u-table` 自身展示报告，以免互相干扰。

### 步骤 4：路由注册

在 `playgrounds/desktop` 的路由配置中注册 `/table-benchmark` 路径指向该页面，并在侧边菜单（若有）中添加入口。实施前先读取路由定义文件确认现有风格，不自行引入路由库。

### 步骤 5：AGENTS 对齐与依赖检查

- 阅读 `playgrounds/desktop/AGENTS.md`，遵守该目录的命名与组织约定。
- 确认未新增生产依赖；`performance.memory` 等浏览器 API 使用前做可选检查。
- 本页面**仅**依赖 `@veltra/desktop`、`vue`、已存在的 playground 工具；不引入图表库。

### 步骤 6：自检与验收

- 在 Chrome 最新稳定版下，1e4 行 / 10 列 / stripe 场景可完成完整滚动压测并产出 JSON。
- 「保存为 baseline」「对比 baseline」在不同场景组合下互不串扰。
- 关闭压测按钮后，无持续 rAF 记录开销（通过 devtools Performance 抽查 5s 内 rAF 回调不写入任何结构）。
- 报告 JSON schema 与上文一致；字段齐全。
- 1e5 行 + 30 列不能导致页面崩溃或 JS 异常（即便 FPS 很低）。

## 影响范围

## 历史补丁
