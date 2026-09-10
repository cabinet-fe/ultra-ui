---
"@veltra/desktop": patch
---

- 按钮（Button）：不再注入默认 `aria-label="button"`，可访问名恢复为默认插槽文本，或调用方透传的 `aria-label`（纯图标按钮需自行传 `aria-label`）
- 抽屉（Drawer）：补上 `title` 的标题栏渲染；`closed` 改为在抽屉与遮罩退出动画结束、节点已移除后触发（`close` 仍为点击时触发）；移除 `DrawerProps` 上并未生效的 `closable` 默认值
