---
'@veltra/desktop': patch
---

file-viewer PDF 预览的 pdfium wasm 改为经 `@embedpdf/pdfium/pdfium.wasm?url` 随消费方构建产物本地分发，替换 jsdelivr CDN 默认地址，企业离线环境可正常渲染；同时修复 wasm 相对地址在 blob: worker 内无法解析导致的引擎静默初始化失败
