# 弱化附件列表与内层容器感

## 补丁内容

进一步削弱 `UFileViewer` modal 形态的边界感：让 `.u-file-viewer__inner` 在模态下回到 `display: contents`，不再承担 padding、裁剪、过渡缩放等容器职责，sidebar 与 stage 直接作为全屏查看器的布局层参与渲染。左侧文件列表去掉彩色文件类型胶囊和卡片式行边框，改为低噪声文件 rail：文件名与大小为主体，右侧保留轻量类型标记，当前项用细竖线和弱背景表达。同步弱化 modal 顶部栏和预览 body 的边界阴影，使整体更接近无界暗场预览。

## 影响范围

- 修改文件: `packages/desktop/src/components/file-viewer/file-viewer.vue`
- 修改文件: `packages/desktop/src/components/file-viewer/style.scss`
