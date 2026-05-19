# Expression Editor 重构设计

## 背景

`packages/desktop/src/components/expression-editor` 当前基于 Lexical 实现，但交互不令人满意，且对 Lexical 系列依赖重而收益少。本次重构在不影响 `rich-text-editor` 的前提下，**完全重写表达式编辑器**：抛弃 Lexical 内核、自研极简 segment 模型，并按用户列出的交互需求重新设计 mention 触发态、变量 chip 与变量选择面板。

## 目标

1. **去 Lexical 化**：`expression-editor` 不再依赖 `lexical`、`@lexical/clipboard`、`@lexical/utils`。
2. **新交互**：mention 风格的 `@` 触发、可悬浮删除 / 点击重选的变量 chip、过滤态侧悬浮路径预览。
3. **代码量减半**：当前 ~1500 行（di / runtime / commands / services / decorators / dnd），重构后目标 800 行以内、文件结构更扁平。
4. **不破坏对外契约**：`v-model` 字符串协议（`{var.path}` 占位符语法）保持不变；现有 props（`variables`、`placeholder`、`disabled`、`readonly`、`size`）保持不变；新增 `selectableLevels`。

## 非目标

- 不动 `rich-text-editor`，它继续使用 Lexical。
- 不引入新的第三方编辑器内核（不引入 ProseMirror / TipTap）。
- 不再支持「变量重排（DnD / 上下移）」能力（用户确认可以删，需要重排可以删了重插）。
- 不暴露内部模型给外部（删掉 `useEditor` 导出）。

## 对外契约（不变）

```ts
interface ExpressionEditorProps extends FormComponentProps {
  modelValue?: string // '你好{form.user.name}, ...'
  placeholder?: string
  variables?: VariableItem[] // 树形变量列表
  /** 新增：是否允许选中任意层级的变量（含中间分支） */
  selectableLevels?: 'leaf' | 'any' // 默认 'leaf'
}

interface VariableItem {
  label: string
  value: string
  type?: string
  children?: VariableItem[]
}
```

序列化：text 段直接拼接，var 段输出 `{value}`。和当前 `parser.ts` 解析的格式完全一致。

## 内核数据模型

```ts
type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'var'; value: string; label: string; type?: string }

type Doc = Segment[] // 顺序代表文档顺序，相邻 text segment 不会出现（归一化）
```

**约束**

- 相邻 text 段总是合并；空 text 段不保留。
- 文档边界两端永远存在 text 段（即使是空字符串），用于光标可停靠。即 `Doc` 的形态总是 `(text, var, text, var, ..., text)`。
- 序列化为字符串：`segments.map(s => s.kind === 'text' ? s.value : `{${s.value}}`).join('')`。
- 反序列化（从 modelValue）：复用现有 `parser.ts` 的正则切分逻辑，输出 `Segment[]`。

## DOM 同构方案

容器为单个 `contenteditable="true"` div。子节点按 segment 顺序铺平：

```html
<div contenteditable="true" class="u-expression-editor__container">
  <span data-seg="text">你好</span>
  <span data-seg="var" data-value="form.user.name" contenteditable="false" class="...chip"
    >用户姓名</span
  >
  <span data-seg="text">, 欢迎来到</span>
  <span data-seg="var" data-value="form.company.name" contenteditable="false" class="...chip"
    >公司名称</span
  >
  ...
</div>
```

要点：

- **chip 是原子单元**：`contenteditable="false"` 让浏览器把它当 atomic，光标自然只能停在 chip 两侧；Backspace 在 chip 边界一次性删掉整个 chip；左右方向键跨 chip 一次跳一个位置。这是省下大量逻辑的关键。
- **text 段使用 `<span data-seg="text">` 包裹**而不是裸 text node：
  - 让「在两个 chip 之间」总有一个 text span 可以承载光标，避免出现「光标贴着 chip 卡住」。
  - 简化 DOM ↔ 模型映射（每个 segment 一个 span，1:1 对应）。
- **对 contenteditable 内文本的修改信任浏览器**：用户在 text span 内键入、删除时，让浏览器原生处理 DOM；编辑器只在 `input` 事件后**做一次归一化**（合并相邻 text span、清理空 span、若 DOM 结构异常则回退到模型重渲染）。
- **粘贴**：`paste` 事件强制 `preventDefault` + 取 `text/plain` + 在光标处插入文本（不需要 `@lexical/clipboard`）。
- **多行**：保留多行；按 Enter 在当前 text 段中插入 `\n`；CSS `white-space: pre-wrap` 渲染换行。

## 关键交互

### 变量 chip

- **视觉**：圆角 tag 风格（继续视觉上等价 `UTag` `type="primary"`），但**不再用 Vue Teleport 渲染** —— 直接由编辑器内核生成 DOM，简化运行时。
- **hover**：右侧渐显 `×` 删除图标。
- **点击 chip 主体**：在该 chip 位置打开变量选择面板（**重选模式**）—— 选中后替换该 chip。
- **点击 ×**：直接删除该 chip（位置上不留任何痕迹）。
- **被光标"选中"**（光标停在 chip 紧邻位置且方向键标记的"焦点 chip"）：chip 边框高亮；Backspace / Delete 删之。
- **左右方向键**：跨 chip 一次跳一个位置（浏览器自带行为，无需特殊处理）。

### `@` 触发与过滤态

状态机：

```
idle ──[键入 @]──→ triggered { panel opens, filter='' }
                       │
                       ├─[键入字符 c (非 @、非空格)]→ filter += c, refresh
                       ├─[键入 @]                  → 重置 filter='', 起点改为新 @
                       ├─[键入空格]                → 退出 (保留 `@filter ` 为文本)
                       ├─[Backspace 删过滤字]      → filter = filter.slice(0,-1)
                       ├─[Backspace 删到 @ 之前]   → 退出 (`@filter` 一并被删掉)
                       ├─[Esc]                    → 退出 (保留 `@filter` 为文本)
                       ├─[← / →]                  → 退出 (保留 `@filter`)，光标正常移动
                       ├─[↑ / ↓]                  → 面板内导航 (光标不动)
                       ├─[Enter (在叶子或 selectableLevels='any' 的分支)]
                       │                            → 替换 `@filter` 文本为 var chip
                       └─[失焦]                   → 退出 (保留 `@filter`)
```

实现要点：

- 用一个内核状态 `mention: { active: boolean; anchorOffset: number; filter: string }` 跟踪触发态。
- `anchorOffset` 是 `@` 在文档中的偏移；`filter` 是 `@` 之后到光标之间的字符。
- 退出态时不修改 DOM（`@filter` 文本本来就是用户在 text 段里键入的内容，不需要回滚）。
- Enter 选中后：用一次模型变更 + 重渲染，把当前 text 段中 `@filter` 子串替换为 var chip。
- 「光标位置变化检测」：监听 `selectionchange`，如果光标离开了 `@` 之后的连续区，自动退出。

### 变量选择面板

**两种模式（同一组件）**

```
filter === '' ────► 逐级模式
filter !== '' ────► 扁平模式
```

**逐级模式**

```
┌─────────────────────────────────┐
│ 全部变量 / 表单数据 / 用户信息  │ ← 面包屑（仅多层时显示）
├─────────────────────────────────┤
│ ▸ 姓名                          │
│   年龄                          │
│   邮箱                          │
└─────────────────────────────────┘
```

- 键盘：↑↓ 移动焦点；← 返回上一级。
- → 与 Enter 的语义按 `selectableLevels` 切换：
  - `selectableLevels='leaf'`（默认）：
    - 在分支项上：→ 与 Enter 都是「进入下一级」
    - 在叶子项上：→ 与 Enter 都是「选中并替换 chip」
  - `selectableLevels='any'`：
    - 在分支项上：→ = 进入下一级；**Enter = 选中分支本身**（这是该模式下最自然的区分）
    - 在叶子项上：→ 与 Enter 都是「选中并替换 chip」
- 当前层级若全是叶子且无 children，则不显示面包屑、不显示 → 进入图标。

**扁平模式**

```
              ┌─────── 主面板 ─────────┐         ┌──────────────┐
              │ ▸ 公司名称              │ ───────▶│ 路径预览       │
              │   公司地址              │         │  表单数据      │
              │   部门名称              │         │   └─ 公司信息  │
              │   邮箱                  │         │       └─ 公司名称 │← 高亮
              └─────────────────────────┘         └──────────────┘
```

- `selectableLevels='leaf'`：扁平结果只列出叶子节点。
- `selectableLevels='any'`：扁平结果包含所有节点（叶子 + 分支）；分支与叶子在视觉上不区分，统一作为可选项。
- 不显示面包屑（用户已经在搜索）。
- **路径预览悬浮框**（缩进树形）始终跟随当前 active 项；优先显示在主面板右侧，空间不够则左侧。

**通用键盘**

- ↑ / ↓ 在当前面板内移动焦点。
- Enter 选中（在扁平模式下永远选中、不存在「进入下级」概念）。
- Esc 关闭面板，编辑器维持「保留 `@filter` 为文本」的退出语义。
- 鼠标 hover 也会更新 active 项（同时联动路径预览）。

**过滤匹配**

- 仅匹配 `label`、不区分大小写、子串包含。
- 多层 `label` 不再用「父/子」拼接（避免误匹配）；路径信息走右侧悬浮预览。

## 文件结构

```
packages/desktop/src/components/expression-editor/
├── expression-editor.vue        # 主组件（薄壳）
├── index.ts                     # 默认 export
├── style.ts                     # 依赖样式聚合
├── style.scss                   # BEM 样式
├── di.ts                        # DIKey + variableMap helper
├── core/
│   ├── model.ts                 # Segment 类型、归一化、parse / serialize
│   ├── editor.ts                # 内核：DOM 渲染 + selection 映射 + 命令
│   ├── mention.ts               # @ 触发态状态机（依附 editor）
│   └── chip.ts                  # 变量 chip DOM 工厂
├── components/
│   ├── variable-picker.vue      # 变量选择面板（逐级 / 扁平双模式）
│   └── path-preview.vue         # 路径预览悬浮框（扁平模式专用）
└── __test__/
    ├── model.test.ts            # parse / serialize round-trip
    ├── mention.test.ts          # 触发态状态机
    └── chip.test.ts             # chip DOM 渲染 / 删除 / 重选
```

> 现有的 `internal/` 目录、`use-context.ts`、`use-decorators.tsx`、`use-editor.ts`、`use-expression-drag-drop.ts`、`plain-text.ts`、`parser.ts`、`nodes/variable-node.tsx` **整体删除**。`parser.ts` 的正则逻辑迁移到 `core/model.ts`。

## 依赖变化

**删除（仅对 expression-editor）**

- `lexical` 主包对该组件的引入路径全部移除（rich-text-editor 仍在用）
- `@lexical/clipboard`：仅 expression-editor 在用，可从 `package.json` 中移除
- `@lexical/utils`：仅 expression-editor 在用，可从 `package.json` 中移除
- `@tanstack/vue-virtual`、`@floating-ui/dom`：检查是否仍被其他组件使用；变量选择面板复用现有 `UTip`（floating-ui 已被它用），不新增依赖

**保留**

- `UTip`、`UInput`（搜索框）、`UScroll`、`UEmpty`、`UIcon`、`UTag`（仅作为 chip 视觉参考，不再 Teleport）

## 错误处理与边界

- **空 `variables`**：编辑器仍可工作（仅作为纯文本输入）；`@` 触发面板显示空状态。
- **`modelValue` 中 `{xxx}` 在 `variables` 中找不到**：仍生成 chip，`label` 回退为 `xxx`，无 type；保持现有行为。
- **disabled / readonly**：容器 `contenteditable="false"`；chip × 与点击重选不响应；`@` 不触发面板。
- **粘贴**：剪贴板 plaintext 直接插入；如果文本里包含 `{xxx}`，**初版不做识别**（仅当模型同步时识别）。
- **复制**：复制选区内容时，chip 序列化为 `{value}` 文本（保持往返）。
- **IME**：`compositionstart` 期间记录、`compositionend` 后归一化；mention 状态在 composition 期间不更新（防止中文输入打字过程中的过滤抖动）。

## 测试策略

- **model.test.ts**（必须）
  - parse / serialize round-trip：覆盖空、单 var、相邻 var、未闭合 `{`、混合等
- **mention.test.ts**（必须）
  - 状态机：每个跃迁都有断言（输入 @、空格、Esc、← →、↑↓、Backspace 各种情况）
- **chip.test.ts**
  - hover 出 ×、点击 × 删除、点击主体打开重选面板、键盘选中状态
- **picker 集成测试**（推荐，但可后置）
  - 逐级模式 → 进入下级；扁平模式路径预览跟随 active

测试入口仍走根目录的 `bun run test`。

## 迁移影响

- 外部使用方（playgrounds 演示、其他业务）**只感知**：`useEditor` 不再导出（破坏性，但属内部 API）；新增 `selectableLevels` prop（向后兼容）。
- 现有 `playgrounds/desktop/src/expression-editor/index.vue` 演示页保留，更新文案以反映新交互（`@` 触发、hover ×、点击 chip 重选）。
- 现有的 4 个测试文件（`parser.test.ts` 保留并迁移，其余 3 个删除）。

## 实施顺序（落地参考，不在本设计阶段执行）

1. 写 `core/model.ts`（最纯）+ `model.test.ts`，确认 parse/serialize 与现有 `parser.ts` 输出完全一致
2. 写 `core/chip.ts`（DOM 工厂 + hover/点击事件）
3. 写 `core/editor.ts`（contenteditable 渲染 + selection 映射 + 归一化）
4. 写 `core/mention.ts`（状态机）+ `mention.test.ts`
5. 重写 `expression-editor.vue` 主壳，集成内核 + variable-picker
6. 重写 `components/variable-picker.vue`（双模式）+ `path-preview.vue`
7. 删旧目录文件、更新 `package.json` 移除 lexical 子包依赖
8. 更新 playground 演示页文案
