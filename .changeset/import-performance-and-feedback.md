---
'@veltra/sheet': minor
'@veltra/desktop': patch
---

xlsx 导入性能与交互反馈优化：

- **解析提速**（`core/io/import.ts`）：hucre 稠密行数组空槽快速跳过 + 表格尺寸按实际使用范围收敛。实测 196 sheet / 75 万格预算套表：解析 110s → 3.5s；含「全选设边框」残留（整表 13327 行 × 16384 列空白格式格）的 sheet 不再把渲染尺寸撑到 Excel 极限，切换 30s → 0.3s
- **解析移入 Web Worker**（`vue/popups/import.worker.ts`）：选文件后主线程空闲（loading 动画正常转、页面可交互），解析完成才弹确认框；worker 不可用（构造失败/加载失败）自动降级主线程解析
- **交互反馈**：解析期经 provide/inject 状态在 grid 容器挂 desktop `v-loading`；replaceWorkbook 前「正在导入…」常驻提示（try/catch/finally 兜底，失败明确报错）；等首帧渲染完成再报「导入完成」（导入后立即点单元格/滚动不再撞上 vrender 渲染任务，实测 3~5s → 16ms）
- **desktop message-confirm**：根元素补基础 `transition`——Vue transition-group 检测不到根过渡时 after-leave 同步触发，弹窗关闭动画被 onClosed 同步重活阻塞（点击后卡 1.6s 才关）
