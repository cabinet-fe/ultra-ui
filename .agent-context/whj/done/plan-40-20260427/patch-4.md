# 修正关闭过渡时序

## 补丁内容

修正 `UFileViewer` modal 关闭动画的层级时序：原样式只让 backdrop、sidebar、stage header 淡出，预览 stage 本体没有参与离场，导致外层视觉先消失而文件内容最后才被移除。本补丁改为让 modal 根节点执行真实 opacity 过渡，使背景、侧栏、工具栏和预览内容作为整体同步淡出，并在离场期间禁用 pointer 事件，避免关闭过程中的残留交互。

## 影响范围

- 修改文件: `packages/desktop/src/components/file-viewer/style.scss`
