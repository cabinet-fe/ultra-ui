---
'@veltra/sheet': patch
---

修复 xlsx 导入/导出 worker 在宿主生产构建下必失败的问题（`Failed to resolve module specifier 'infinitable/sheet'`）。

- **根修**：主构建的 worker 产物含裸说明符（`infinitable` 是 peer），宿主 Vite 生产构建只把 worker 当静态资源拷贝、不做依赖解析，浏览器原生执行必失败（dev 下因 onerror 走主线程回退被掩盖）。新增 `scripts/build-workers.ts`，`vp pack` 后对两个 worker 入口各跑一次无 external 打包，把 `infinitable` + `@cat-kit/core` inline 进 `dist/**/popups/import.worker.js` 与 `dist/tools/export.worker.js`（文件名与相对位置不变；各约 700KB 原始 / 172KB gzip——引擎 dist 为预打包单文件，无法按导出裁剪）。
- **兜底**：`import-file.ts` / `download.ts` 收到 worker `{ ok: false }` 时改为回退主线程（原先直接 reject 弹错），worker 产物在任何宿主环境下最多退化为一次主线程卡顿。
- 新增 worker `{ ok: false }` 回退单测；修复 `import-file.test.ts` 在 happy-dom 自带 Worker 下的既有不稳定（统一替换为可编程 worker 替身）。
