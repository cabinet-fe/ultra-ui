# 修复移动端内嵌布局

## 补丁内容

修复 `UFileViewer` 在 720px 以下的内嵌模式布局：由于内嵌模式下 `inner` 使用 `display: contents`，原先 media query 只调整 modal 的 `inner`，导致 sidebar 改为 100% 宽后 stage 仍按横向 flex 被挤压。本补丁为非 modal 根容器补充纵向 flex 布局，使 embedded 和 modal 两种模式在窄屏下都保持稳定。

## 影响范围

- 修改文件: `packages/desktop/src/components/file-viewer/style.scss`
