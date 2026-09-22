---
'@veltra/desktop': minor
---

选择类组件补齐远程搜索体验：

- `TreeSelect` / `MultiTreeSelect` 的 `data` 支持传入函数 `(qs) => Promise<TreeData[]> | TreeData[]`，输入触发远程查询（200ms 防抖），初始以空串调用一次，此时 `filterable` 强制开启，与 `Select` / `MultiSelect` 的 `options` 函数形态对齐
- 四个组件远程搜索期间在面板内显示加载态，请求返回空不再显示空白（`TreeSelect` 系由树内空态承接）
- 远程请求加入竞态守卫，慢的旧响应不再覆盖新查询的结果
