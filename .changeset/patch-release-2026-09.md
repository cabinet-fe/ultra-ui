---
'@veltra/desktop': patch
'@veltra/sheet': patch
'@veltra/sheet-core': patch
---

- 表格编辑器（TableEditor）：新增只读模式（`readonly` 下控件只读，操作列与空态「添加」不渲染）；表头列级错误指示（文字标红 + 感叹号气泡展示各行明细）；单元格校验（控件 `change` 懒触发）与 Enter/Tab 键盘导航；新增/复制行后自动聚焦新行首个可编辑单元格；取消编辑态/文本态二分，输入控件常驻渲染；单元格与表头渲染迁移至列 `render` / `nameRender` 通道，修复只读切换后单元格滞留纯文本，新增 `#header:key` 表头插槽
- 批量编辑（BatchEdit）：表单支持弹框交互模式；透传根节点 attrs 并补齐弹框样式
- 文件预览（FileViewer）：支持 OFD 文件预览（peer 依赖新增 `@veltra/ofd-core`，可选）
- 文字提示（UTip）：新增 `type` 主题配色（primary/info/success/warning/danger，实色背景 + 白色文字）
- 表格（Sheet）：新增 fx 按钮与分类函数弹框；引用选择与函数弹框期间保持目标格高亮
- 公式内核（SheetCore）：新增公式函数分类元数据与求值上下文，补充 32 个公式函数
