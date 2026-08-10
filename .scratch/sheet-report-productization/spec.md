Status: ready-for-agent

## 问题陈述 (Problem Statement)

Sheet Report 报表示例（设计器 + 渲染引擎 + 数据中枢）整体锁死在 playground 私有模块中，下游无法消费；数据连接是假成功、共享同一套 mock 表的演示道具，无法基于真实数据库演练。同时，sheet-core 作为表格类产品的基础设施，其单元格扩展面存在架构性缺口——VTable 的自定义渲染能力被适配层硬编码挡死，宿主无法改进单元格的形态或渲染方式。

## 解决方案 (Solution)

将报表能力产品化进 `@veltra/sheet`，对下游交付两个组件与一个连接器抽象：

1. **报表设计器（`UReportDesigner`）与报表查看器（`UReportViewer`）**：包装组件形态，下游引入即用；内部以 headless 组合式函数组织。
2. **数据连接器（Data Connector）**：库定义 `DataConnector` 接口与最小 HTTP 契约（test/describe/query），提供 `createHttpConnector({ endpoint })`；真实数据库访问由下游后端以任意语言实现（BYO）。范围收敛为 MySQL / PostgreSQL。
3. **sheet-core 渲染扩展口**：新增 `resolveCellRenderer` hook，与 `resolveDisplayValue` / `resolveCellStyle` 对称；首个消费者为设计器绑定占位符的富渲染徽章。
4. **playground 参考服务**：hono + TS 的 dev-only 契约参考实现（mysql2/pg 真实驱动），随演示一同启动；mock 体系（内存库、假连接、迷你 SQL 执行器、种子模板）整体删除。

决策依据：ADR-0001（角色驱动引擎）、ADR-0002（Dataset = Connection + SQL、`${param}` 参数、Filter Bar 参数来源）、ADR-0003（产品化与 BYO 契约）、ADR-0004（渲染扩展口与 hook 性能契约）。术语遵循 `packages/sheet-core/CONTEXT.md` 词汇表。

## 用户故事 (User Stories)

### 下游开发者（集成方）

1. 作为下游开发者，我希望从 `@veltra/sheet` 引入 `UReportDesigner` 与 `UReportViewer` 两个组件及其样式，以便于用最小成本嵌入报表设计与查看能力。
2. 作为下游开发者，我希望通过 `createHttpConnector({ endpoint })` 创建连接器并作为 prop 传给组件，以便于报表数据流经我自己的后端。
3. 作为下游开发者，我希望契约只有 test/describe/query 三个端点，以便于用任意语言实现后端。
4. 作为下游开发者，我希望请求中的连接对象携带 `type: 'mysql' | 'postgresql'` 标签，以便于后端选择对应驱动与方言。
5. 作为下游开发者，我希望连接配置经 `v-model:connections` 以纯序列化对象流转、只驻留内存，以便于凭据的持久化与安全存储完全由我掌控。
6. 作为下游开发者，我希望调用设计器 expose 的 `getTemplate()` 取回可序列化模板（SheetSnapshot），以便于自行决定模板的存储方式。
7. 作为下游开发者，我希望把已保存的模板经 prop 传回设计器继续编辑、或传给查看器直接运行，以便于模板在我的产品内闭环流转。
8. 作为下游开发者，我希望查看器自动从模板实际绑定的数据集中提取查询参数并生成 Filter Bar，以便于我无需手工维护参数关联。
9. 作为下游开发者，我希望调用查看器 expose 的 `refresh()` 重新取数渲染，以便于外部状态变化后主动刷新报表。
10. 作为下游开发者，我希望前端包不含任何数据库驱动或 Node-only 依赖，以便于浏览器 bundle 保持干净。
11. 作为下游开发者，我希望使用 `resolveCellRenderer` hook 自定义单元格渲染，以便于按产品需要改进单元格形态。
12. 作为下游开发者，我希望 USheet 目录迁移（`vue/` → `components/sheet/`）在 changeset 中有明确 breaking 说明，以便于升级只是一次查找替换。

### 报表设计者（设计态终端用户）

13. 作为报表设计者，我希望在数据中枢 drawer 中增删改真实数据连接（mysql/postgresql + host/port/库名/账号）并真实测试连接，以便于确认数据库可达。
14. 作为报表设计者，我希望选择连接并编写 SQL 来定义数据集，`${param}` 占位符自动提取为查询参数，以便于过滤条件有了天然配置位置。
15. 作为报表设计者，我希望在数据集编辑器中覆盖参数元数据（label/类型/默认值/选项），以便于 Filter Bar 控件贴合业务语义。
16. 作为报表设计者，我希望在绑定前预览数据集记录，以便于确认 SQL 与参数正确。
17. 作为报表设计者，我希望从字段面板拖拽字段到单元格完成绑定，以便于快速搭建模板。
18. 作为报表设计者，我希望用布局角色（分组头/明细行/小计/总计/矩阵交叉点）定义扩展结构，以便于无需理解坐标推导。
19. 作为报表设计者，我希望选中单元格时看到拓扑连线，以便于直观识别父子扩展依赖。
20. 作为报表设计者，我希望通过选中格上方的 Action Pill 就地切换角色、配置聚合与条件规则或清除绑定，以便于微调不打断心流。
21. 作为报表设计者，我希望绑定单元格渲染为带角色色彩的富渲染徽章而非纯文本占位符，以便于一眼区分单元格语义。
22. 作为报表设计者，我希望定义条件样式规则（如数值 > 100 标红），以便于渲染时自动高亮关键指标。
23. 作为报表设计者，我希望一键切换预览模式看到真实数据展开的填充报表，以便于立即验证模板。
24. 作为报表设计者，我希望在预览中使用自动生成的 Filter Bar 切换参数值重新取数，以便于验证参数语义。
25. 作为报表设计者，我希望将填充报表导出为样式保真的 XLSX，以便于离线分享。

### 报表查看者（运行态终端用户）

26. 作为报表查看者，我希望 Filter Bar 根据模板参数自动生成合适控件（日期范围/下拉/数字等），以便于直接筛选。
27. 作为报表查看者，我希望取数时有明确的加载状态、后端失败时有可读的错误提示，以便于理解当前状态。
28. 作为报表查看者，我希望以只读方式查看展开后的报表，以便于不被编辑能力干扰。

### 库维护者

29. 作为库维护者，我希望报表纯逻辑（渲染引擎/绑定/规则/参数/连接器）以 headless 测试覆盖、fixtures 内联，以便于重构有回归保护。
30. 作为库维护者，我希望 `resolveCellRenderer` 在 grid 缝隙经 canvas mock 测试，以便于扩展口行为有契约保障。
31. 作为库维护者，我希望查看器全流程在组件级经内存 stub connector 测试，以便于 UI 编排错误尽早暴露。
32. 作为库维护者，我希望 cell hook 性能契约写入工程文档，以便于未来新增 hook 不拖垮渲染热路径。

## 实现决策 (Implementation Decisions)

### 1. 包结构与模块划分（ADR-0003 决策 1）

- 不新建报表包，全部能力并入 `@veltra/sheet`。
- sheet 包新增 `components/` 目录（对齐 desktop 模式），当前两个组件目录：`components/sheet/`（USheet 自 `vue/` 迁入）与 `components/report/`（`UReportDesigner` + `UReportViewer` 同族共置）。
- 纯 TS 报表内核（渲染引擎/binding/rules/params/connector）落 `src/report/` 内部模块；sheet-core 边界不变（Cell Meta 扩展面 + cell hook）。
- `vue/` 目录整体移除，不留兼容导出；breaking 经 changeset 声明，按 minor 发布（内部项目、无外部消费者），fixed 组 sheet-core 随同 bump。

### 2. 组件 API（ADR-0003 决策 2）

- `UReportDesigner`：props 为 `connector`（必填）、`v-model:connections`、`template`（可选，载入既有模板）；不提供 save 事件，经 expose 的 `getTemplate()` 返回 `SheetSnapshot` 供下游取回模板。设计态包含数据中枢 drawer、字段面板拖拽、拓扑连线、Action Pill、条件规则对话框、内部预览切换。
- `UReportViewer`：props 为 `connector` 与 `template`（均必填）；内部完成"参数提取 → Filter Bar → 取数 → `renderReport` 展开 → 只读展示"；expose `refresh()`。
- 两组件内部以 headless 组合式函数组织逻辑，组件为薄 UI 壳。
- 不做 ToolRegistry 注册式插件（注册表全局共享，不适合按实例挂载）。

### 3. 数据连接器与 HTTP 契约（ADR-0003 决策 3）

- 接口形状（类型级决策，精确签名随实施钉死）：

```ts
interface DataConnector {
  test(connection: DataConnection): Promise<Result<void>>
  describe(connection: DataConnection, sql: string): Promise<Result<DatasetField[]>>
  query(connection: DataConnection, sql: string, values: ParamValues): Promise<Result<DatasetRecords>>
}
```

- 契约端点镜像三方法，无版本段，随库版本演进：

```
POST {endpoint}/test     ← { connection }              → { ok: true } | { ok: false, error: { code, message } }
POST {endpoint}/describe ← { connection, sql }         → { ok: true, fields: [{ name, type? }] } | { ok: false, error }
POST {endpoint}/query    ← { connection, sql, values } → { ok: true, fields, rows: Record<string, unknown>[] } | { ok: false, error }
```

- `${param}` 查询参数提取留在前端纯函数（ADR-0002 决策 2 不变），`describe` 只返回字段 schema，服务端职责最薄。
- 错误模型：传输层错误用 HTTP 状态码；业务错误（连接失败、SQL 报错）一律 200 + `{ ok: false, error }`。
- Dataset 模型保持 `Data Connection + SQL`；连接类型仅 `mysql` / `postgresql`。
- 连接器边界（词汇表架构约束 4）：前端包严禁引入数据库驱动或 Node-only 依赖。

### 4. 凭据与状态模型（ADR-0003 决策 4）

- 连接配置为纯序列化对象，经 props / v-model 流转，仅驻留内存；库不提供 localStorage 或服务端落库等任何持久化。

### 5. 渲染扩展口（ADR-0004）

- `SheetGridOptions` 与 `SheetProps` 新增对称 hook：`resolveCellRenderer(addr, base) => renderer | undefined`；`buildColumns` 在每列安装 customLayout 分发器按格回调，返回 `undefined` 回落默认渲染。
- 独立对称形态，不与既有 hook 合并（三者调用节奏不同：record 构建 / 每次重绘 / 布局）。
- 首个消费者：设计器绑定占位符由纯文本升级为带角色色彩的富渲染徽章。
- editor 注册口与声明式单元格类型系统记为长期方向，按消费驱动逐个开，本期不动工。
- cell hook 性能契约（纯函数、同步、O(1) 查找、禁异步与大对象分配）写入 `packages/sheet-core/AGENTS.md`。

### 6. 既有行为保持不变项

- `renderReport` 保持纯函数（模板 + records → 填充快照），从 playground 平移，无行为变更。
- Cell Meta namespace `'report'` 的绑定存储格式不变；绑定表达式 ≠ `CellData.f` 公式（CONTEXT-MAP 红线）。
- 布局角色体系、拓扑连线、Action Pill、条件规则、Filter Bar 参数并集逻辑（ADR-0002 决策 4）、XLSX 导出打平均按现状迁移。
- USheet 迁移为纯移动，行为零变化。

### 7. mock 删除项（ADR-0003 决策 5）

- 内存 mock 数据库、模拟 `testConnection`、自实现迷你 SQL 执行器、种子模板全部删除。
- `dataset-hub` 专属测试随 mock 删除；纯逻辑测试（render/binding/rules/topology/filter-bar 等）随代码迁入 sheet 包并改写为内联 fixtures。
- playground 旧 `sheet-report` 模块整体删除，演示页重写为新组件的薄消费页。

### 8. playground 参考服务

- hono + TS 实现三端点，`mysql2`/`pg` 真实驱动，作为 playground devDependencies，不进任何发布产物。
- 演示时随 dev 联动启动；前端经 vite proxy 访问；playground 不内置任何默认连接（演示者自行在 UI 输入）。

### 9. 工具链与文档收尾

- `resolver:gen`（sheet 组件表新增 report 组件）、`skill:gen` 与 `skills/veltra-ui` 更新、根及 `packages/sheet/AGENTS.md` 目录结构同步、changeset（minor）。

## 测试决策 (Testing Decisions)

### 测试准则

- 只测外部行为，不测实现细节（不断言内部 DOM 结构、场景图节点、私有状态）。
- 复用现有缝隙，不新开缝隙；尽可能在最高层级测试。

### 缝隙 1 — 纯 TS 报表内核（headless，无 DOM）

- 对象：`@veltra/sheet` 的 report 模块公开函数——`renderReport`（模板 + records → 填充快照，含分组/小计/总计/矩阵展开与条件样式打平）、binding 角色推导、`${param}` 参数提取、`createHttpConnector`。
- `createHttpConnector` 经 mock fetch 断言三端点请求形状与 `{ ok: false, error }` 业务错误分叉。
- 先例：playground `sheet-report/__test__` 的 render/binding/rules/topology/filter-bar-helpers 等测试随迁至此缝隙，fixtures 改内联。

### 缝隙 2 — SheetGrid 渲染扩展口（canvas mock）

- 对象：`resolveCellRenderer` hook——给了 hook 则列挂上 customLayout 分发、按格回调正确地址、返回 `undefined` 回落默认渲染；hook 不进快照、不进模型。
- 先例：`grid-style-resolver.test.ts`（`resolveCellStyle` 同款测试形态）+ 既有 `canvas-mock.ts`/`setup.ts`。

### 缝隙 3 — 组件级（happy-dom + 内存 stub connector）

- 对象：`UReportViewer` 全流程（template + stub connector → 参数提取 → Filter Bar → 取数 → 展开结果断言）；`UReportDesigner` 的 headless 组合式函数与关键交互（拖拽落格写入 Cell Meta、`getTemplate()` 吐出快照）；USheet 迁移后行为回归。
- stub connector 是实现 `DataConnector` 接口的内存测试夹具，不是复活的 mock hub。
- 先例：`sheet-component.test.ts`（USheet 组件级测试）与 desktop 每组件 `__test__/` 模式。

### 不测项

- playground hono 参考服务不写自动化测试（dev-only；契约形状已被缝隙 1 的 mock-fetch 测试覆盖；真实连接由演示者手动演练验证）。

## 范围外 (Out of Scope)

- MongoDB / Redis 连接器（ADR-0003 决策 3 收敛为 MySQL / PostgreSQL）。
- 库发布服务端包；凭据持久化（localStorage / 服务端加密落库）能力。
- 自定义编辑器注册口、声明式单元格类型系统（ADR-0004 决策 2，消费驱动）。
- ToolRegistry 注册式报表插件形态。
- 多 sheet 报表模板与多报表工作区（原 playground 预置 Tab 随 mock 一并删除）。
- 模板版本迁移机制；契约版本段。
- 大数据量分页/流式取数（query 一次性返回全量行）。

## 附注 (Further Notes)

- 领域文档：`docs/adr/0001` ~ `0004`、`CONTEXT-MAP.md`、`packages/sheet-core/CONTEXT.md`（词汇表 + 连接器边界约束）已更新完毕，实现时须使用词汇表术语。
- 实施任务拆分将按 issue-tracker 约定落 `.scratch/sheet-report-productization/issues/`。
- 最终验收：`bun run lint` / `bun run test` / `bun run build` 全绿；由项目负责人出真实 MySQL/PG 数据库完成连接演练。
