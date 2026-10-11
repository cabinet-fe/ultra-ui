---
'@veltra/sheet': major
---

USheet 移除原生滚动条档，`scrollbar` 回退 boolean 形态

- `SheetProps.scrollbar` 类型从 `boolean | ScrollbarOptions` 收窄为 `boolean`：`{ mode: 'native' }` 原生档与对象形态（`mode: 'canvas'` 及 `visibility` / `hideDelay` / `reserve` 显示策略）不再从组件暴露。引擎 `infinitable` 的原生滚动条能力不受影响，确有需要的宿主可直连 `SheetGrid` 配置
- 缺省 `true`（画布常驻档）与 `false`（整体关闭）语义不变；变化触发网格重建
- 历史沿革：对象形态由原生缺省档提交（scrollbar 扩为全形态透传）引入，组件内除切换原生档外无使用方，随原生档一并移除
