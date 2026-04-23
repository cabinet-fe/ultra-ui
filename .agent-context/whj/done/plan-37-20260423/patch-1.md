# review-fix-1：heap interval 泄漏防御与大规模场景验收

## 补丁内容

针对 plan-37 的 review 意见修复：

1. **`runScroll` heap interval 加 try/finally 保护**（`benchmark-panel.vue`）：
   原实现中 `setInterval(heapTimerId)` 的清理与 rAF 步进在同一 async 流里顺序执行；若 rAF 回调内部抛出异常（如 `scrollEl` 在长跑期间被意外卸载导致访问 `.scrollTop` 抛 `TypeError`），interval 会泄漏，下一次压测时两个 interval 同时采样 `performance.memory.usedJSHeapSize` 并叠加到 `heapPeak`，污染指标。
   修复：
   - 将滚动 Promise 包在 `try { ... } finally { clearInterval(heapTimerId) }` 里；
   - `step` 回调自身再包一层 `try/catch` 并调用 `reject(err)`，让异常能被 finally 感知而不是变成 unhandled rejection。
   另外把 `endTime` / `heapEnd` 的声明提前到 try 外部，避免 finally 之后作用域丢失。

2. **plan.md 增加「实现偏差说明」小节**：
   plan-38 的执行者需要理解三处偏离字面规范的决策（首行耗时采集改 rAF 轮询；滚动速度在大数据量下动态缩放；long task observer 的 `type` 单数形式），因此把原先只在代码注释里的依据抬升到 plan.md，便于后续基于本工具做 baseline 采集时正确解读指标语义。

3. **补做 1e5 × 30 列的「不崩」实测**（计划步骤 6 验收条目之一）：
   - 首行渲染 900 ms（大数据量首屏合理范围）
   - 3 loop 滚动压测完整跑完，无 JS 异常、无页面崩溃
   - FPS avg 1.7 / heap peak 250.7 MB（未优化 baseline 值，作为 plan-38 的起点数据）

## 影响范围

- 修改文件：`playgrounds/desktop/src/table-benchmark/benchmark-panel.vue`
