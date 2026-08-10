# ADR-0003: Sheet 报表产品化 —— 组件并入 @veltra/sheet，连接器走 BYO HTTP 契约

* **状态**: Accepted (已通过)
* **日期**: 2026-08-10
* **领域 Context**: Sheet Report (`packages/sheet-core/CONTEXT.md`)
* **替代关系**: 替代 ADR-0002 决策 1 中的 mock 语义（"所有连接共享同一套 mock 表"、模拟测试连接）与决策 3 整体（"抽象留在 playground"）；CONTEXT-MAP 中"首期渲染引擎放 playground"约定同步失效。ADR-0002 决策 2（`Dataset = Data Connection + SQL`、`${param}` 自动提取查询参数）与决策 4（Filter Bar 参数来源 = 实际绑定的数据集）继续有效。

---

## 背景与问题 (Context & Problem Statement)

`playground/src/sheet-report/` 已完成产品形态验证（ADR-0001/0002），但存在两个产品化缺口：

1. **报表能力锁在 playground**：渲染引擎、数据中枢、设计器 UI 约 50 个文件全部为 playground 私有模块，下游无法消费。
2. **数据连接是假的**：`testConnection` 为 `setTimeout` 假成功，所有连接共享同一套 mock 表；数据集不基于真实连接。

目标：下游可以简单使用报表能力；数据集基于真实数据库连接演练。

---

## 决策事项 (Decision Drivers & Choices)

### 决策 1：不新建报表包，全部能力并入 `@veltra/sheet`

- sheet 包结构变更：新增 `src/components/` 目录（对齐 desktop 模式），当前两个组件目录——`components/sheet/`（USheet 自 `vue/` 迁入）与 `components/report/`（`UReportDesigner` + `UReportViewer` 同族共置一个目录）。
- 渲染引擎、数据集模型等纯 TS 模块落 `src/report/` 内部模块；`sheet-core` 依然只提供 Cell Meta 扩展面，边界不变。
- `vue/` 目录整体移除，**不留兼容导出**；破坏性变更按 minor 发布（内部项目、无外部消费者），不产 major。

### 决策 2：消费形态 = 包装组件 + 内部 headless

- 对外交付**报表设计器**（`UReportDesigner`）与**报表查看器**（`UReportViewer`）两个组件，下游引组件即用。
- 设计器不提供 save 事件，经 `defineExpose` 暴露 `getTemplate()` 供下游取回模板（`SheetSnapshot`，可序列化）；查看器接收 `connector` + `template` 两个必填 props，内部完成"参数提取 → Filter Bar → 取数 → 展开渲染"，暴露 `refresh()`。
- 组件内部以组合式函数组织逻辑（headless 内核 + 薄 UI 壳）。
- **不做** ToolRegistry 注册式"插件"：现有工具注册表全局共享、作用于所有 USheet 实例，不适合按实例挂载的报表能力。

### 决策 3：真实连接 = BYO 后端 + HTTP 契约

- 浏览器无 TCP 栈，无法直连 MySQL/PostgreSQL；库**不发布**服务端包。
- 库定义 `DataConnector` TS 接口（`test` / `describe` / `query`）与对应 HTTP 契约，并提供 `createHttpConnector({ endpoint })`；真实数据库访问由下游后端以任意语言实现。
- 数据库范围收敛为 **MySQL / PostgreSQL**：Dataset 模型保持 `Connection + SQL` 不变（ADR-0002 决策 2 无须改动）；MongoDB / Redis 移出范围。
- 契约参考实现为 playground 内置 **hono + TS** 服务（`mysql2`/`pg` 驱动，playground devDependencies），演示时随 dev 一同启动，不进发布产物。

契约形状（端点镜像 `DataConnector` 三方法；无版本段，随库版本演进）：

```
POST {endpoint}/test     ← { connection }              → { ok: true } | { ok: false, error: { code, message } }
POST {endpoint}/describe ← { connection, sql }         → { ok: true, fields: [{ name, type? }] } | { ok: false, error }
POST {endpoint}/query    ← { connection, sql, values } → { ok: true, fields, rows: Record<string, unknown>[] } | { ok: false, error }
```

- `${param}` 查询参数提取留在前端纯函数（ADR-0002 决策 2 不变），`describe` 只返回字段 schema，服务端职责最薄。
- 错误模型：传输层错误用 HTTP 状态码；业务错误（连接失败、SQL 报错）一律 200 + `{ ok: false, error }`。

### 决策 4：凭据只驻留内存

- 连接配置为纯序列化对象，经 props / v-model 流转；库不提供任何持久化（无 localStorage、无服务端落库）。持久化与安全存储是下游责任。

### 决策 5：mock 全部移除

- 内存 mock 数据库、模拟 `testConnection`、自实现迷你 SQL 执行器、种子模板全部删除；dataset-hub 专属测试随之删除，纯逻辑测试（render/binding/rules 等）随代码迁入 sheet 包并改写为内联 fixtures；playground 演示要求真实连接。

---

## 后续影响 (Consequences)

### 正向影响 (Positive)

- 下游无强制后端形态：任何语言/框架实现契约端点即可接入；前端 bundle 永远不含数据库驱动。
- sheet 包获得多组件结构，与 desktop 模式对齐，后续组件有统一落点。
- ADR-0002 的 Dataset / Query Parameter 模型原样保留，设计器 UI 与渲染引擎平移成本低。

### 潜在风险与应对 (Risks & Mitigation)

- **playground 无后端即不可用**：由决策 3 的 hono 参考实现承担演练与契约活体文档职责。
- **`@veltra/sheet/vue/style` 导入路径变化**：内部项目无外部消费者，直接 breaking 并在 changeset 中声明，不留兼容代码。
- **下游后端实现质量参差**：契约保持最小面（`test`/`describe`/`query`），并以 hono 参考实现为对齐基准。
