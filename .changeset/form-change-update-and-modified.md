---
"@veltra/desktop": patch
---

- 表单（Form）：拆分 `field:change` 与 `field:update`。`field:change` 改为仅由控件 `change` 触发（用户操作，参数透传控件参数，可用 `...args` 接收），`field:update` 监听 `model[field]` 更新（含编程写入与快速编辑回写）
- 表单（Form）：新增 `showModified` / `modifiedLabel` / `initialModel`，开启后字段值与基准值不同时在控件下方展示「变更前」内容
- 表单项（FormItem）：通过 `cloneVNode` 拦截内部控件 `change`，统一向上透出 `change` 事件
- 批量编辑（BatchEdit）：适配 `field:change` / `field:update` 拆分
