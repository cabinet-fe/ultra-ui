# ADR-0004: 单元格渲染扩展口 —— resolveCellRenderer 与单元格扩展面的长期方向

* **状态**: Accepted (已通过)
* **日期**: 2026-08-10
* **领域 Context**: Sheet Report (`packages/sheet-core/CONTEXT.md`) / Spreadsheet Core
* **关联**: ADR-0001 决策 2（`resolveCellStyle` hook 先例）、ADR-0003（报表产品化）

---

## 背景与问题 (Context & Problem Statement)

2026-08-10 对 sheet-core 单元格级扩展面的盘点结论：

- **已有正式扩展面**：`resolveDisplayValue`（显示文本，`grid/sheet-grid.ts:40`）、`resolveCellStyle`（条件样式，`grid/grid-style-resolver.ts:44`）、Cell Meta（可序列化数据附着，走命令系统可 undo、随快照持久化）、命令注册、公式函数注册。
- **被封死的能力**：VTable 的 `customLayout`/`customRender` 被 `buildColumns` 硬编码（`grid/sheet-grid.ts:267-273` 每列仅生成 `{ field, title, style }`）；`veltra-sheet-input` 编辑器全局单例硬接线（`grid/sheet-grid.ts:316`）；VTable `columnType` 未暴露，值通道只认标量。

sheet-core 是表格类产品的基础设施，"任意改进单元格形态或渲染方式"要求扩展面有明确的演进方向，而不是临时堆砌。

---

## 决策事项 (Decision Drivers & Choices)

### 决策 1：开自定义渲染口子 `resolveCellRenderer`

- `SheetGridOptions` 与 `SheetProps` 新增对称 hook：`resolveCellRenderer(addr, base) => renderer | undefined`（精确类型随实施钉死），`buildColumns` 在每列安装 customLayout 分发器，按格回调该 hook。
- 与现有 hook 保持**独立对称**形态，不合并为单一 `resolveCell`：三者调用节奏不同（display 在 record 构建时、style 在每次重绘、renderer 在布局时），合并会迫使全部按最热路径执行，且破坏现有 props。
- **首个真实消费者**：报表设计器的绑定占位符由纯文本升级为富渲染徽章（带角色色块），API 形状当场被真实场景验证。

### 决策 2：editor 注册口与单元格类型系统按消费驱动逐个开

不为没有消费者的能力开口子。以下两项作为长期方向记录，待真实消费者出现时实施：

- 自定义编辑器注册口（替代 `veltra-sheet-input` 全局单例硬接线）。
- 声明式单元格类型系统（Cell Meta 声明 renderer id + `registerCellRenderer(id, impl)` 注册表）。

### 决策 3：cell hook 性能契约

所有 cell hook（现有两个 + 未来新增）必须遵守：**纯函数、同步返回、O(1) 查找（Cell Meta 为稀疏 Map）、禁止异步操作与大对象分配**。`resolveCellStyle` 是无缓存真热路径（视口可见格 × 每次场景图重绘 × facing 边溯源最多 4 倍放大）；`resolveCellRenderer` 同属渲染热路径。契约随实施写入 `packages/sheet-core/AGENTS.md`。

---

## 后续影响 (Consequences)

### 正向影响 (Positive)

- "改显示、改样式、挂数据、挂命令"之外补齐"改渲染形态"，单元格扩展面闭环；口子由真实消费者（报表徽章）验证，不是臆测 API。
- 扩展面演进有档可查，editor/单元格类型的开口时机有明确判据（消费驱动）。

### 潜在风险与应对 (Risks & Mitigation)

- **customLayout 透传意味着宿主可能破坏虚拟化性能**（在渲染器里做重活）。应对：决策 3 的性能契约 + 文档警示。
- **hook 与 ImageLayer 覆盖层两条嵌入路线并存**。应对：文档明确分工——格内内容走 renderer hook，跨格浮动内容走 ImageLayer。
