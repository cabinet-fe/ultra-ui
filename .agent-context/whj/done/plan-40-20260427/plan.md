# FileViewer 预览体验升级

> 状态: 已执行

## 目标

提升 `UFileViewer` 的视觉完成度和附件预览操作能力，使文件列表、预览舞台、顶部工具栏形成清晰的产品型工作界面，并为图片、PDF、DOCX 三类可视预览提供放大、缩小、拖拽平移和重置能力。

## 内容

1. 梳理 `packages/desktop/src/components/file-viewer/file-viewer.vue` 的结构，把文件元信息、切换操作、下载/关闭操作和变换控制组织为更清晰的 header toolbar，保留现有 props、emits 和 expose 行为。
2. 新增组件内部的 viewport transform 状态与方法：针对 `image`、`pdf`、`docx` 启用缩放控制，缩放范围固定为 `50%` 到 `300%`，步进为 `25%`，切换文件时重置为 `100%`、平移归零。
3. 为可缩放预览实现拖拽平移：在主预览区域监听 pointer 事件，只有缩放比例大于 `100%` 时进入 grab/grabbing 交互，拖拽仅修改当前 transform offset，不影响视频、文本、表格的原生滚动和控件操作。
4. 调整 `image-previewer.vue`、`pdf-previewer.vue`、`docx-previewer.vue` 的外层结构，使其接收并应用父组件传入的 `style` / `class`，并在统一 transform layer 内渲染内容。
5. 重写 `packages/desktop/src/components/file-viewer/style.scss` 的视觉层级：侧栏改为更精细的列表信息密度，预览舞台使用深色画布与内容阴影，工具按钮使用 icon-first 的紧凑控制，modal 和 embedded 两种模式都保持稳定尺寸和过渡。
6. 运行定向校验，至少执行 `bun run check-types`，若命令因环境或既有问题失败，需要记录具体失败点。

## 影响范围

- `packages/desktop/src/components/file-viewer/file-viewer.vue`
- `packages/desktop/src/components/file-viewer/style.scss`
- `packages/desktop/src/components/file-viewer/previewers/image-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/pdf-previewer.vue`
- `packages/desktop/src/components/file-viewer/previewers/docx-previewer.vue`

## 历史补丁

- patch-1: 修复移动端内嵌布局
- patch-2: 改造无界遮罩式预览
- patch-3: 弱化附件列表与内层容器感
- patch-4: 修正关闭过渡时序
