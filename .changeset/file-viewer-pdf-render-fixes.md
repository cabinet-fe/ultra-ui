---
'@veltra/desktop': patch
---

修复 FileViewer PDF 预览渲染缺陷，并按规范重构组件结构

- 修复快速缩放/滚动时同一 canvas 并发渲染导致 pdfjs 抛错并向宿主误报 error 的问题
- 新增 `pdfResourceUrl` 属性：指向随 dist 分发的 pdfjs 资源目录（`cmaps/`、`standard_fonts/`、`wasm/`，构建期自动拷贝到 `dist/components/file-viewer/previewers/`）即可启用中文 CMap 与 JPEG2000 解码；未传时行为不变
- PDF 加载失败（URL 不可达、文件损坏、worker 被 CSP 拦截）不再停留加载态，显示错误态并触发 `error` 事件
- 超大页面 × 高 dpr 渲染自动降采样，避免超出 Chrome canvas 上限静默白屏
- 滑出可视窗口的 PDF 页自动释放渲染资源，长文档滚动不再内存常驻；fit-page 在容器 0 尺寸时不再误降为 50%；滚轮缩放按帧合批
- file-viewer 拆分工具栏子组件，图片缩放/平移下沉至图片预览器并与其余格式统一缩放通路；预览器改为按 `src` 判断重载；样式全面接入主题 token 并补齐键盘焦点态
