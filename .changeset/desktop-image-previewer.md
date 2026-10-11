---
'@veltra/desktop': minor
---

新增 UImagePreviewer lightbox 图片预览组件并按需独立导出：src 支持 URL（http(s): / blob: / data:）与二进制（File / Blob / ArrayBuffer / Uint8Array），Ctrl/⌘+滚轮与工具按钮缩放、双击 100%/200% 切换、放大后拖拽平移，Esc / 遮罩 / 关闭按钮退出；modal=false 内嵌纯预览面供宿主自组框架。file-viewer 图片页改为复用该组件的适配层
