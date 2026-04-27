# 改造无界遮罩式预览

## 补丁内容

将 `UFileViewer` 的模态预览从居中弹框式容器改为全屏遮罩内的无界查看器：移除 modal inner 的白底、边框、圆角和投影，改为透明全屏布局；侧栏、标题栏与工具栏调整为深色半透明 glass 层，预览舞台直接融入遮罩暗场，避免文件被白色弹框包裹。图片、PDF、DOCX 等真实文件内容保留自身页面/图像实体感，并加强暗场中的投影和边界对比。

## 影响范围

- 修改文件: `packages/desktop/src/components/file-viewer/style.scss`
