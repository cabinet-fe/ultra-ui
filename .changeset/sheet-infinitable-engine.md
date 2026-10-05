---
'@veltra/sheet': minor
'@veltra/sheet-core': minor
---

- grid 层引擎由 @visactor/vtable 切换为 npm 包 infinitable：sheet-core 门面重写、vtable 消费点改接新门面，源码与构建配置统一走 infinitable 单入口，依赖收敛为 `infinitable@^0.1.0`
- 新增列头覆盖层与类型化编辑器路由机制，支持按字段类型挂接编辑器
- 交互修复收尾：引用拾取手势抬手收敛回交、初挂选区绘制时序等引擎侧问题修复，并补齐配套单测与 e2e 断言
