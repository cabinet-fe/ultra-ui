# 创建 veltra-desktop 文档型技能

> 状态: 已执行

## 目标

为 `@veltra/desktop`（71 个组件）创建高质量文档型技能，使 AI 代理在项目开发时能自动加载并学会使用组件库。技能需包含完整的组件接口文档（Props/Emits/Exposed）和从 playground 提取的真实使用示例，并通过同步脚本保持与源码一致。该技能同时作为后续其他包技能的参考模板。

## 内容

### 1. 组件分类（已对照 `src/components/index.ts` 的 71 个导出逐一验证）

| 分类 | 数量 | generated 文件 | 组件 |
|------|------|----------------|------|
| 表单 | 25 | `form.md` | form, form-item, input, textarea, password-input, number-input, number-range-input, select, multi-select, cascade, multi-tree-select, tree-select, auto-complete, checkbox, checkbox-group, radio, radio-group, switch, slider, date-picker, date-range-picker, date-panel, file-picker, grid-input, group-input |
| 数据展示 | 12 | `data-display.md` | table, tree, list, grid, paginator, tag, badge, text, number, calendar, gantt-chart, progress-nodes |
| 反馈通知 | 10 | `feedback.md` | message, notification, dialog, drawer, pop-confirm, message-confirm, loading, progress, tip, empty |
| 导航 | 7 | `navigation.md` | menu, breadcrumb, tabs, steps, dropdown, float-button, context-menu |
| 布局容器 | 4 | `layout.md` | layout, card, scroll, watermark |
| 编辑器 | 6 | `editor.md` | code-editor, rich-text-editor, expression-editor, condition-editor, table-editor, batch-edit |
| 通用 | 7 | `general.md` | button, icon, action, check-tag, theme, palette, node-render |

共享类型（非独立组件）：`animation.ts`、`css-transition.ts`、`pop.ts`、`index.ts`（re-export）→ 纳入 `generated/shared-types.md`。

注意：`quick-batch-edit.ts`、`multi-auto-complete.ts`、`text-editor.ts` 是仅在 types 目录中存在的类型文件，不对应独立导出组件，归入 `shared-types.md`。

### 2. 设计技能目录结构

```
skills/veltra-desktop/
├── SKILL.md                          # ≤500 行：分类概览、导入约定、核心开发模式
├── scripts/
│   └── sync-docs.ts                  # 同步脚本
├── generated/                        # 脚本产物，勿手动编辑
│   ├── manifest.json                 # 同步元数据（时间戳、组件数、分类映射）
│   ├── catalog.md                    # 71 组件完整目录表（名称 | 分类 | 导出名 | 一行描述）
│   ├── form.md                       # 25 个表单组件的类型 + 示例
│   ├── data-display.md               # 12 个数据展示组件
│   ├── feedback.md                   # 10 个反馈通知组件
│   ├── navigation.md                 # 7 个导航组件
│   ├── layout.md                     # 4 个布局容器组件
│   ├── editor.md                     # 6 个编辑器组件
│   ├── general.md                    # 7 个通用组件
│   └── shared-types.md               # 共享类型定义（animation, css-transition, pop 等）
└── references/
    └── dev-patterns.md               # 组件使用模式指南（面向页面开发场景）
```

### 3. 创建同步脚本 `scripts/sync-docs.ts`

**解析策略**：完整文件内容拷贝（与 use-cat-kit 镜像 .d.ts 的思路一致），不做 AST 解析。

具体逻辑：

1. **类型提取**：读取 `packages/desktop/src/types/*.ts` 每个文件的完整源码。按预定义的分类映射（组件名 → 分类），将文件内容格式化为对应分类 markdown 文件中的 TypeScript 代码块。组件名通过类型文件名匹配（如 `button.ts` → `button` 组件）。

2. **示例提取**：读取 `playgrounds/desktop/src/{component-name}/` 目录下的所有 `.vue` 文件。将每个文件内容格式化为 Vue 代码块，附带文件名标注。若组件无 playground 目录，在该组件条目下标注"暂无示例"。

3. **组件描述**：从 `packages/desktop/src/components/{component-name}/index.ts` 的导出分析组件导出名（如 `UButton`、`UButtonGroup`），写入 catalog.md。

4. **共享类型**：`animation.ts`、`css-transition.ts`、`pop.ts`、`quick-batch-edit.ts`、`multi-auto-complete.ts`、`text-editor.ts` 写入 `shared-types.md`。`index.ts`（re-export barrel）跳过。

5. **Manifest**：记录同步时间、组件总数、各分类组件列表、共享类型列表。

6. **产物格式**：每个分类 markdown 文件的结构为：
   ```
   # {分类名}

   ## {组件名} (U{PascalName})

   ### 类型定义
   ```typescript
   // 来源: packages/desktop/src/types/{name}.ts
   {完整文件内容}
   ```

   ### 使用示例
   ```vue
   <!-- 来源: playgrounds/desktop/src/{name}/index.vue -->
   {完整文件内容}
   ```
   ```

7. **注册命令**：在根 `package.json` 的 `scripts` 中添加 `"sync-veltra-desktop": "bun skills/veltra-desktop/scripts/sync-docs.ts"`。

### 4. 编写 SKILL.md（目标 ≤300 行）

内容结构：
- **frontmatter**：`name: veltra-desktop`，`description` 包含触发词：组件库、UI 组件、表单、表格、对话框、选择器等
- **分类概览**：7 个分类 × 2 行（分类名 + 组件计数 + 指向 `generated/` 文件的链接），~20 行
- **导入约定**：自动按需导入（resolver 配置，模板中用 `u-kebab-case` 或 `UPascalCase`）、手动导入场景（类型 `import type { XxxProps } from '@veltra/desktop'`、图标 `@veltra/icons/normal`、工具类 `FormModel` 等），~30 行
- **核心开发模式**（精简要点，每个 5-8 行）：
  - v-model 双向绑定
  - 表单集成（FormModel + useFormComponent）
  - 插槽用法（作用域插槽 v-slot）
  - 事件处理约定（update:xxx）
  - 组件 ref（Exposed 类型）
  ~40 行
- **渐进式引导**：简单组件（button, tag）→ 表单组件（input, select）→ 复合数据组件（table, tree）→ 编辑器组件，每级给出典型代码片段，~60 行
- **参考文件索引**：指向 generated/ 和 references/ 的完整文件列表，~15 行

### 5. 编写 references/dev-patterns.md

聚焦 **desktop 组件使用模式**（不涉及 styles/compositions 的内容，那些属于对应技能）：
- **表单场景**：FormModel 创建、字段校验规则、表单提交流程、嵌套表单
- **表格场景**：defineTableColumns 列定义、行展开、单元格合并、虚拟滚动大数据
- **树组件场景**：多选/单选切换、节点过滤、禁用节点、自定义内容插槽
- **对话框/抽屉**：声明式 vs 命令式调用、confirm 模式
- **消息通知**：Message.success/error 函数式调用

每个场景从 playground 提取真实代码片段作为示例基础。

### 6. 执行同步脚本并验证

- 运行 `bun run sync-veltra-desktop`
- 验证 `generated/manifest.json` 中组件数 = 71
- 抽检 3 个分类文件（form.md、data-display.md、general.md）确认类型定义和示例都已正确填充
- 检查无 playground 示例的组件是否标注了"暂无示例"

### 7. 按 create-skill 规范自检

- [ ] SKILL.md ≤ 500 行
- [ ] description 具体且包含触发词
- [ ] description 第三人称
- [ ] references 一层深度
- [ ] 无时效性内容
- [ ] 术语一致（统一用"组件"而非混用"控件"/"部件"）

## 影响范围

### 新增文件
- `skills/veltra-desktop/SKILL.md` — 技能主文件（226 行）
- `skills/veltra-desktop/scripts/sync-docs.ts` — 同步脚本
- `skills/veltra-desktop/references/dev-patterns.md` — 组件使用模式指南（268 行）
- `skills/veltra-desktop/generated/catalog.md` — 71 组件完整目录表
- `skills/veltra-desktop/generated/form.md` — 25 个表单组件类型 + 示例
- `skills/veltra-desktop/generated/data-display.md` — 12 个数据展示组件
- `skills/veltra-desktop/generated/feedback.md` — 10 个反馈通知组件
- `skills/veltra-desktop/generated/navigation.md` — 7 个导航组件
- `skills/veltra-desktop/generated/layout.md` — 4 个布局容器组件
- `skills/veltra-desktop/generated/editor.md` — 6 个编辑器组件
- `skills/veltra-desktop/generated/general.md` — 7 个通用组件
- `skills/veltra-desktop/generated/shared-types.md` — 共享类型定义
- `skills/veltra-desktop/generated/manifest.json` — 同步元数据

### 修改文件
- `package.json` — 添加 `sync-veltra-desktop` 脚本命令
- `skills/AGENTS.md` — skills 目录级约束文件

## 历史补丁
- `patch-1`: 修正 `use-desktop` 技能目录到 `skills/use-desktop`
- `patch-2`: 将技能内容替换到 `skills/veltra-desktop`
- `patch-3`: 为 skills/ 目录添加 AGENTS.md 约束
