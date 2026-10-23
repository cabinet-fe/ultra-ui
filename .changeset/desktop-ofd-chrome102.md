---
'@veltra/desktop': patch
---

- 修复 `UFileViewer` OFD 预览在 Chrome 102 内核上整份文件解析失败、误显示「该文件没有可预览的页面」：deflate 条目此前依赖 Chrome 103 才支持的 `DecompressionStream('deflate-raw')`，102 上构造即抛错；现按 fflate 方式内置 raw deflate 解码兜底，103+ 仍走原生解压。
- OFD 解析或单页渲染失败时在控制台输出错误原因，不再完全静默（`error` 事件行为不变）。
