# shadcn 风格视觉改版

## 补丁内容

用户反馈：希望 Tabs 的样式像 shadcn/ui 那样。因此在计划 32 的视觉改版基础上，将 Tabs 的视觉语言从「下划线/侧边线指示器」改为 shadcn/ui 的「卡片式 TabsList + 药丸状 active TabsTrigger」风格。

### 1. 视觉语言变更

- **TabsList 容器化**：
  - `position=top/bottom`：`__header-wrap` 承担 TabsList 容器角色，设置 muted 背景（`bg-color.hover`）、圆角（`radius.default`）、内部 padding（4px），`inline-flex + align-self: flex-start` 在不溢出时贴合内容、溢出时 `max-width: 100%` 触发 viewport 滚动；删除原来的 `border-bottom` / `border-top` 分隔线。
  - `position=left/right`：`__header` 自身承担 TabsList 容器角色，同样配置背景/圆角/padding；删除原来的 `border-right` / `border-left`。
- **Active TabsTrigger 风格**：
  - 不再使用 `::after` 伪元素作为下划线/侧边线指示器（整段删除）。
  - 改为「active 时白底（`bg-color.top`） + 轻阴影（近似 shadcn `shadow-sm`） + 深色文字（`text-color.title`）」。
  - `header-item` 圆角 `radius.small`（比 list 容器小一号，与 shadcn TabsTrigger 对 TabsList 的比例一致）。
- **交互反馈**：
  - hover 仅改变文字颜色至 `text-color.title`，不再强染主色。
  - 过渡覆盖 `color` / `background-color` / `box-shadow`（0.2s ease）。
- **Nav 按钮**：与 active item 风格呼应：透明底、hover 时白底 + 阴影，disabled 时 `opacity: 0.4`。
- **容器间距**：`.u-tabs` 设置 `gap: use-var(gap, small)`，让 header 与面板之间留出固定间距（top/bottom/left/right 四向自动生效）。

### 2. 组件实现同步调整（`packages/desktop/src/components/tabs/tabs.vue`）

- 删除两处 `<li>` 上的 `v-ripple` 指令绑定，以及 `import { vRipple } from '@veltra/directives'`。shadcn 风格不使用 ripple，移除后视觉更贴近。
- 保持 `handleClick` / `renderSlots` / `updateNavState` / `ensureActiveVisible` / `scrollByStep` / `handleWheel` 等逻辑不变。

### 3. 已废弃样式清理

- 删除 `__ripple` 规则（组件已不再渲染 ripple 元素）。
- 删除所有 `@include position(...) { ::after { ... } }` 规则（指示器方案已被替换）。
- 删除原先在 `left/right` 下单独的 `header-item` 圆角（shadcn 风格下不需要，改为统一 `$item-radius`）。
- 删除原先 top/bottom 的 `header-wrap` border 迁移规则。

## 影响范围

- 修改文件: `packages/desktop/src/components/tabs/tabs.vue`
- 修改文件: `packages/desktop/src/components/tabs/style.scss`
