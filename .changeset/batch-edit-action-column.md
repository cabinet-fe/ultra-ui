---
'@veltra/desktop': patch
---

UBatchEdit：编辑/查看入口改为操作列「编辑」按钮（点击行不再打开表单），操作列按钮顺序固定为「编辑 → 添加子级 → 删除 → 在上方插入 → 在下方插入」；只读模式操作列仅保留由 `update` 控制的「查看」入口。保存/删除增加重入保护，进行中重复触发（按钮连点或 `Ctrl/Cmd + S` 快捷键）被忽略。移除未消费的 `title` prop 与 `BatchEditFormStatus` 类型。
