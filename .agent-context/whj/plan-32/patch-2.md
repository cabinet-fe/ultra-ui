# patch-2：交付调试 + 新增 rounded/closable + 拆分独立标签栏组件

## 背景

计划 `plan-32` 在 patch-1 引入 shadcn 风格视觉改版后，仍未达到交付标准；用户追加以下需求：

1. 新增 `rounded` 属性（布尔，默认 `true`）控制圆角开关。
2. 新增 `closable` 能力，允许关闭 tab。
3. 为减少独立使用场景（如后台系统标签栏）的运行时负担，从 `UTabs` 抽出 `UTabsHorizontal`、`UTabsVertical` 两个可独立使用、不依赖 `UScroll` 的子组件，样式复用。

用户通过 AskQuestion 明确的决策：

- `rounded`：布尔开关，`true` 启用 shadcn 风格的容器/项圆角，`false` 关闭。
- `closable`：组件级 `closable?: boolean` 全局控制；`TabItem` 支持 `closable?: boolean` 覆盖；`disabled` 项不显示关闭按钮。
- 组件拆分后 `UTabs` 作为薄壳委托器，根据 `position` 内部选择 `UTabsHorizontal` / `UTabsVertical`，保持向后兼容。
- 关闭行为只 `emit('close', item, index)`，不内置移除项的副作用，交由消费侧处理。

## 变更

### 1. 类型 API（`packages/desktop/src/types/tabs.ts`）

- `TabItem` 新增字段：`closable?: boolean`（覆盖组件级 closable）。
- `TabsProps` 新增：`rounded?: boolean`（默认 `true`）、`closable?: boolean`（默认 `false`）。
- `TabsEmits` 新增：`(e: 'close', item: TabItem, index: number): void`。
- 新增 `TabsHorizontalProps` / `TabsHorizontalEmits`（仅 `top`/`bottom`），`TabsVerticalProps` / `TabsVerticalEmits`（仅 `left`/`right`）。

### 2. 共享组合式（新增 `packages/desktop/src/components/tabs/use-tabs-bar.ts`）

将水平标签栏的溢出滚动逻辑抽离为 `useTabsBar({ viewportRef, headerRef, items, model })`：

- 返回 `showNav` / `canPrev` / `canNext` / `updateNavState` / `scrollByStep` / `ensureActiveVisible`
- 内部封装 `useResizeObserver`、`wheel`（passive: false）、`scroll`（passive）事件绑定与解绑
- `UTabsHorizontal` 与 `UTabs` 共享此逻辑，保持行为一致。

### 3. 拆分的两个独立组件

**`packages/desktop/src/components/tabs/tabs-horizontal.vue`**（新增）

- 仅渲染标签栏（`header-wrap` + `nav` + `viewport` + `ul` + `li`）与一个默认 `<slot />`（供 `UTabs` 注入内容，独立使用时无需填充）。
- 使用 `useTabsBar` 处理水平溢出与滚动。
- `closable` 支持 per-item 覆盖；`disabled` 项不显示关闭按钮；点击关闭按钮 `emit('close', item, index)`。
- 提供 `name:<key>` 具名插槽，支持单个标签文本自定义。

**`packages/desktop/src/components/tabs/tabs-vertical.vue`**（新增）

- 仅渲染竖直标签栏（`ul` + `li`）与一个默认 `<slot />`。
- 无溢出滚动逻辑（已知限制，与 patch-1 保持一致）。
- `closable`/`disabled` 规则同上。

> 由于 Vue 3.5.32 SFC 编译器对跨文件类型继承（`extends ComponentProps`）的解析限制，两个子组件的 `defineProps`/`defineEmits` 使用内联字面量类型，与导出的 `TabsHorizontalProps` / `TabsVerticalProps` 结构一一对应。

### 4. `UTabs` 改为委托器（`packages/desktop/src/components/tabs/tabs.vue`）

- 根据 `position` 渲染 `UTabsHorizontal` 或 `UTabsVertical`，以 `v-model` 双向绑定、`:items` / `:rounded` / `:closable` 透传、`@click` / `@close` 透传。
- 继续承担内容面板渲染（`UScroll` + `transition` + `keep-alive` + 动态 slot）职责，通过默认插槽注入子组件。
- 将 `name:<key>` 具名插槽透传给子组件。

### 5. 样式补充（`packages/desktop/src/components/tabs/style.scss`）

- `&__header-item` 改用 `inline-flex` + `gap`，新增 `&__header-item-label` 元素 class。
- 新增 `&__close` 元素：小尺寸（`12px`），半透明灰色，hover 高亮，`disabled`/`not-closable` 时不渲染。
- 新增修饰符 `&.is-not-rounded`：取消容器级与 `header-item` 级圆角（`border-radius: 0`）。
- 新增修饰符 `&.is-bar-only`：仅当 `UTabsHorizontal` / `UTabsVertical` 独立使用（未提供 default slot）时生效，取消主容器 `gap` 与 content 相关规则。

### 6. 导出与 resolver

- `packages/desktop/src/components/tabs/index.ts` 导出 `UTabsHorizontal`、`UTabsVertical`。
- `packages/vite/src/resolver.ts` 的 `SHARED_STYLE_DIR` 新增：

  ```ts
  'tabs-horizontal': 'tabs',
  'tabs-vertical': 'tabs'
  ```

  使 `unplugin-vue-components` 自动引入 `@veltra/desktop/components/tabs/style` 作为 sideEffect（复用同一份样式入口）。

- 重新 `bun run build @veltra/vite`，playground dev server 重启后 auto-import 正确。

### 7. Playground 演示（`playgrounds/desktop/src/tabs/index.vue`）

- 配置面板新增「圆角」「可关闭」两个开关。
- 新增一组模拟「后台系统标签栏」的数据 `barItems` / `barActive`。
- 新增两个独立演示区：
  - `UTabsHorizontal`（`closable=true`）+ onClose 动态移除
  - `UTabsVertical`（`closable=true`）+ 左/右位置随 position 切换
- `UTabs` 关闭行为接入 `onClose`：消费侧维护 `items` 并在关闭当前激活项时自动 fallback。

## 交付验证

类型检查：

```
bun run check-types   # @veltra/desktop、@veltra/vite 均通过
bun run build         # playgrounds/desktop 生产构建通过
```

Playground（浏览器实测，位于 `/tabs`）：

- `UTabs` 默认 3 项，Tab B 为 disabled（无关闭按钮），Tab C `closable: true`（始终显示 ×）。
- 勾选全局「可关闭」后，Tab A 出现关闭按钮，Tab B 仍不出现（disabled）。
- 点击 Tab A × 后，Tab A 被 onClose 消费侧移除。
- 切换 position 至 `左`：`UTabs` 切换为 vertical，内容在右侧；`UTabsHorizontal` 保持水平；`UTabsVertical` 正常渲染。
- 勾选「溢出演示」（15 项）+ position=上：出现 `<` / `>` 导航按钮，`<` 初始禁用；点 `>` 后滚动到 04-07 并平滑过渡。
- `UTabsHorizontal` 独立版：5 项全部带 × 关闭按钮，点击后消费侧移除。
- `UTabsVertical` 独立版：垂直排列 5 项，× 关闭按钮，点击后消费侧移除。
- 「圆角」关闭后，容器与 item 圆角被关闭，shadcn 小圆角消失。
- 已验证无 Vite 编译错误、无运行时控制台报错。

## 已知限制

- `position=left` / `right` 时垂直溢出仍由父容器裁剪，未引入滚动（与 plan 一致）。
- Vue SFC 编译器限制：子组件无法直接 `defineProps<TabsHorizontalProps>()`；目前采用内联字面量类型并通过 `TabsHorizontalProps`/`TabsVerticalProps` 对外导出以便消费侧使用。如后续 Vue 升级修复此限制，可切换为 `defineProps<TabsHorizontalProps>()`。

## 影响范围

- `packages/desktop/src/types/tabs.ts`：`TabItem.closable`；`TabsProps.rounded` / `TabsProps.closable`；`TabsEmits` 新增 `close`；新增 `TabsHorizontalProps` / `TabsHorizontalEmits` / `TabsVerticalProps` / `TabsVerticalEmits`。
- `packages/desktop/src/components/tabs/use-tabs-bar.ts`：新增文件，抽离溢出滚动逻辑。
- `packages/desktop/src/components/tabs/tabs-horizontal.vue`：新增文件。
- `packages/desktop/src/components/tabs/tabs-vertical.vue`：新增文件。
- `packages/desktop/src/components/tabs/tabs.vue`：重构为委托器。
- `packages/desktop/src/components/tabs/style.scss`：新增 `__close` / `__header-item-label` / `is-not-rounded` / `is-bar-only` 等规则；`__header-item` 结构改为 `inline-flex` + `gap`。
- `packages/desktop/src/components/tabs/index.ts`：新增 `UTabsHorizontal` / `UTabsVertical` 导出。
- `packages/vite/src/resolver.ts`：`SHARED_STYLE_DIR` 新增 `tabs-horizontal`/`tabs-vertical` → `tabs` 映射，并重新 `bun run build`。
- `playgrounds/desktop/src/tabs/index.vue`：新增配置项、两个独立演示区、`onClose` 处理。
