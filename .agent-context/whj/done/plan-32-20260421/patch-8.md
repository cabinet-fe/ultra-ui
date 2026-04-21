# 语义化重命名 + 解耦 tabs 组件结构 + 修复垂直圆角与关闭按钮

## 补丁内容

### 1. 类名语义化（全量重命名，统一 BEM 结构）

将原先拧在一块的 `tabs` 单 block 拆分为两个职责清晰的 block，并将元素命名改为更接近 shadcn TabsList 语义的短名：

- 新增 block `u-tabs-bar`：面向独立使用的标签栏组件（水平 / 垂直），携带 `u-tabs-bar--horizontal` / `u-tabs-bar--vertical` / `u-tabs-bar--{position}` 等修饰符；
- 保留 block `u-tabs`：仅用于复合组件（bar + content 布局容器），保留 `u-tabs--{position}` 修饰符与 `u-tabs__content` 元素。

元素名映射：

| 旧                    | 新                    | 说明                                                                               |
| --------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `__header-wrap`       | _（并入 bar 根）_     | 水平布局的外壳，合并到 `u-tabs-bar` 根元素（承担 TabsList 的背景 / padding / 圆角） |
| `__header` (水平内层) | `__list`              | 视口内的弹性项容器（`flex-wrap: nowrap; width: max-content`）                      |
| `__header` (垂直外层) | _（并入 bar 根）_     | 垂直 bar 本身即列表容器                                                            |
| `__header-item`       | `__item`              | 单个标签                                                                           |
| `__header-item-label` | `__item-label`        | 标签内的文本封装                                                                   |
| `__viewport`          | `__viewport`          | 保留                                                                               |
| `__nav`               | `__nav`               | 保留                                                                               |
| `__close`             | `__close`             | 保留                                                                               |
| `__content`           | `__content`           | 语义不变，迁移到 `u-tabs` block                                                    |
| 修饰符 `is-bar-only`  | _（删除）_            | 由于独立组件本身即为 bar-only，不再需要该修饰符                                    |

### 2. 避免在 Vue 模板中使用类型断言

`packages/desktop/src/components/tabs/tabs.vue` 中原有 `:position="position as 'top' | 'bottom'"` / `:position="position as 'left' | 'right'"`。改为通过脚本里的 `computed` 将 union 值收敛到对应子集：

- 新增 `horizontalPosition: ComputedRef<'top' | 'bottom'>`
- 新增 `verticalPosition: ComputedRef<'left' | 'right'>`

模板直接绑定 computed 结果，不再出现 `as` 断言。

### 3. 拆解职责：`UTabsHorizontal` / `UTabsVertical` 不再使用插槽

此前两个子组件通过 `<slot />`（default）与 `<slot name="name:${key}" />` 暴露插槽，并被 `UTabs` 以 `<template #[name]>` 透传；此次调整：

- 两个子组件移除 `defineSlots` 与所有 `<slot />` 用法，变成纯粹的数据驱动 bar 组件：输入 `items`、`size`、`position`、`closable`、`rounded`、`block`，输出 `update:modelValue` / `click` / `close`。
- 内容面板渲染与插槽逻辑全部收敛到 `UTabs`：新增 `u-tabs__content` 包裹 `<transition>` + `<component :is="renderContent()">`；当用户未提供任何面板插槽时 `hasContentSlots` 为 false，不再渲染内容区域，`UTabs` 只作为一层极薄的 bar 容器。
- `UTabs` 不再需要 `nameSlots` 计算 / `<template #[name]>` 透传逻辑，代码更直白。

### 4. 移除冗余代码

- `tabs.vue`：删除 `nameSlots` 计算、`bar-only` 修饰符相关判定；`renderContent` 不再为 `UScroll` 注入已失效的 `cls.e('content')` 类名（因为外层已有 `.u-tabs__content`）。
- `tabs-horizontal.vue` / `tabs-vertical.vue`：删除 `defineSlots`、默认 `<slot />`、`name:${key}` 具名 slot；精简 import（水平组件不再需要从父级转发槽）。
- `use-tabs-bar.ts`：参数 `headerRef` 统一重命名为 `listRef`，名称与新的元素命名对齐，避免新旧术语混用。
- `style.scss`：删除旧的 `position()` 局部 mixin（原来仅服务于 `header-wrap/header-item` 等名字），边框相关死规则（`border-bottom/top` 已在之前版本被移除）不再重建；全部样式按 `u-tabs` / `u-tabs-bar` 两个 block 整齐组织。

### 5. 修复垂直 tabs 因 `rounded` 产生的容器形变

此前 `is-rounded` 无脑对 `header-wrap` / `header` / `header-item` / `nav` 都套了 `border-radius: 9999px`，导致垂直布局下（容器是较高的矩形）胶囊半径在上下边形成奇怪的弧线。修复：

- 水平（`u-tabs-bar--horizontal.is-rounded`）：容器仍然变为 9999px 胶囊，与 shadcn 的 pill 风格一致。
- 垂直（`u-tabs-bar--vertical.is-rounded`）：容器保持默认 `radius` 变量（常规圆角矩形），仅让内部 `__item` / `__nav` 变成 9999px 胶囊。视觉上为"圆角容器 + pill 项"的组合，消除形变。

### 6. 垂直 tabs 可关闭时关闭按钮常显

按用户明确要求："可关闭状态下，垂直 tabs 的关闭默认且只能一直显示"。实现：

- 旧逻辑通过 `opacity: 0; pointer-events: none` + `:hover` 切换至 `opacity: 1`，属于"悬浮可见"而非"始终可见"；现已删除。
- 新逻辑：垂直布局下 `__close` 不再施加 `opacity: 0`，保持基础样式的 `opacity: 1` / `width: 16px` / `margin-left: 6px`，从而只要 `closable` 开启就始终显示。
- 水平布局保留原有"hover 渐显"行为（交互语境不同）。

## 影响范围

- 修改文件: `/packages/desktop/src/types/tabs.ts`
- 修改文件: `/packages/desktop/src/components/tabs/tabs.vue`
- 修改文件: `/packages/desktop/src/components/tabs/tabs-horizontal.vue`
- 修改文件: `/packages/desktop/src/components/tabs/tabs-vertical.vue`
- 修改文件: `/packages/desktop/src/components/tabs/use-tabs-bar.ts`
- 修改文件: `/packages/desktop/src/components/tabs/style.scss`
