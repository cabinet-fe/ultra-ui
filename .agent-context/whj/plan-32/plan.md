# 优化 Tabs 组件样式与水平溢出处理

> 状态: 已执行

## 目标

- 解决 `UTabs` 在 `position=top/bottom` 时，`items` 过多导致标签头水平溢出容器的视觉裁剪问题。通过「滚动 + 左右箭头按钮 + 鼠标滚轮水平滚动」的交互模式，保证所有标签可达、活动标签自动可见。
- 对组件做较大幅度的视觉改版：活动指示器加厚并增加圆角、hover/active 反馈、字重与字距优化、过渡时长统一。
- 简化组件 API：移除 `editable` 动态增删标签的功能（+/× 按钮、`create`/`delete`/`update:items`/`update:active` 事件），让组件专注于「标签导航」核心职责；并清理模板未消费的 `markStyle` 死代码。

## 内容

### 1. 类型 API 清理（`packages/desktop/src/types/tabs.ts`）

1.1. 从 `TabsProps` 中删除字段 `editable?: boolean`。

1.2. `TabItem` 保持现状（保留 `name` / `key` / `disabled`）。

1.3. 从 `TabsEmits` 删除以下三条签名：

- `(e: 'update:items', items: TabItem[]): void`
- `(e: 'delete', item: TabItem, index: number): void`
- `(e: 'create'): void`
- `(e: 'update:active', active: string | number): void`（当前代码从未 emit，属遗留，与 `update:modelValue` 语义重叠）

  1.4. `TabsEmits` 最终保留（重要：此处是完整集合，实施时严格按此清单）：

- `(e: 'update:modelValue', value: string | number): void`
- `(e: 'click', item: TabItem, index: number): void`

  1.5. `TabsExposed` 清理：

- 删除 `delete(key: number | string): void` 方法。
- `_TabsExposed` / `TabsExposed` 最终内容均为 `{}`（保留类型名以保持导出签名稳定）。

### 2. 组件实现改造（`packages/desktop/src/components/tabs/tabs.vue`）

2.1. **模板重构**（采用「ul 始终渲染，wrap/nav 仅在水平布局下 v-if 额外包裹」的方案，避免代码重复）：

```vue
<template>
  <div :class="[cls.b, cls.m(position!), cls.m(size)]">
    <!-- 水平布局（top/bottom）：wrap 包含 prev-nav + viewport + next-nav -->
    <div v-if="isHorizontal" :class="[cls.e('header-wrap'), cls.em('header-wrap', position!)]">
      <button
        type="button"
        :class="[cls.e('nav'), cls.em('nav', 'prev')]"
        :disabled="!canPrev"
        v-show="showNav"
        @click="scrollByStep(-1)"
      >
        <u-icon><ArrowLeft /></u-icon>
      </button>

      <div :class="cls.e('viewport')" ref="viewportRef">
        <ul :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
          <li v-for="(item, index) in tabItems" :key="item.key" ... >
            <slot :name="`name:${item.key}`">{{ item.name }}</slot>
          </li>
        </ul>
      </div>

      <button
        type="button"
        :class="[cls.e('nav'), cls.em('nav', 'next')]"
        :disabled="!canNext"
        v-show="showNav"
        @click="scrollByStep(1)"
      >
        <u-icon><ArrowRight /></u-icon>
      </button>
    </div>

    <!-- 垂直布局（left/right）：直接渲染 ul（本次不处理溢出） -->
    <ul v-else :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
      <li v-for="(item, index) in tabItems" :key="item.key" ... >
        <slot :name="`name:${item.key}`">{{ item.name }}</slot>
      </li>
    </ul>

    <transition name="fade" mode="out-in">
      <KeepAlive v-if="keepAlive">
        <component :key="model" :is="renderSlots()" />
      </KeepAlive>
      <component v-else :key="model" :is="renderSlots()" />
    </transition>
  </div>
</template>
```

关键点：

- `isHorizontal` 为 `computed(() => props.position === 'top' || props.position === 'bottom')`。
- `<li>` 内部不再包含 close 按钮、close-placeholder、+新增按钮；仅保留 slot 内容。
- 由于 `v-if` 两支都包含 `<ul ref="headerRef">`，`headerRef` 始终可访问（两分支仅出现其一，不冲突）。
- `<li>` 的 class 与 `v-ripple` / `@click.stop="handleClick(item, index)"` 绑定保持不变：
  ```
  :class="[
    cls.e('header-item'),
    bem.is('active', model === item.key),
    bem.is('disabled', item.disabled === true)
  ]"
  v-ripple="item.disabled ? false : cls.e('ripple')"
  @click.stop="handleClick(item, index)"
  ```

  2.2. **Script 清理与改造**：

- **Import 调整**：
  - 删除：`import { Close, Plus } from '@veltra/icons/normal'`
  - 新增：`import { ArrowLeft, ArrowRight } from '@veltra/icons/normal'`
  - 新增：`import { onBeforeUnmount, onMounted } from 'vue'`（若已有则合并）
  - 新增：`import { useResizeObserver } from '@veltra/compositions'`（与 scroll.vue 同源）
- **删除的变量与函数**：
  - `handleClose`、`handleAdd` 函数整体删除
  - `index` 的 `shallowRef<number>(-1)` 删除
  - `changedByEvent` 标记删除
  - `markStyle` 的 `shallowRef<CSSProperties>({})` 删除
  - `watch([model, () => props.items], ...)` 删除（其存在仅为同步 `index.value`）
  - `watch([index, () => props.position, () => props.editable], ...)` 整个块删除（markStyle 计算为死代码）
- **`handleClick` 修正**：
  ```ts
  const handleClick = (item: TabItem, index: number) => {
    if (item.disabled) return
    model.value = item.key
    emit('click', item, index)
  }
  ```
- **`renderSlots` 保持不变**。
- **新增 ref**：
  ```ts
  const viewportRef = shallowRef<HTMLElement>()
  const showNav = shallowRef(false)
  const canPrev = shallowRef(false)
  const canNext = shallowRef(false)
  const isHorizontal = computed(
    () => props.position === 'top' || props.position === 'bottom'
  )
  ```

  2.3. **溢出滚动逻辑（新增）**：

- **`updateNavState()`**：
  ```ts
  const updateNavState = () => {
    const vp = viewportRef.value
    if (!vp) return
    const { scrollLeft, scrollWidth, clientWidth } = vp
    const overflowing = scrollWidth - clientWidth > 1
    showNav.value = overflowing
    canPrev.value = overflowing && scrollLeft > 0
    canNext.value = overflowing && scrollLeft + clientWidth < scrollWidth - 1
  }
  ```
- **`scrollByStep(dir: 1 | -1)`**：
  ```ts
  const scrollByStep = (dir: 1 | -1) => {
    const vp = viewportRef.value
    if (!vp) return
    vp.scrollTo({ left: vp.scrollLeft + dir * vp.clientWidth * 0.8, behavior: 'smooth' })
  }
  ```
- **`ensureActiveVisible()`**：
  ```ts
  const ensureActiveVisible = () => {
    const header = headerRef.value
    if (!header || !isHorizontal.value) return
    const activeKey = model.value
    if (!activeKey) return
    const activeIndex = tabItems.value.findIndex((i) => i.key === activeKey)
    if (activeIndex < 0) return
    const el = header.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }
  ```
- **触发时机**：
  - `useResizeObserver({ targets: [viewportRef, headerRef], onResize: updateNavState })` —— 自动覆盖首次挂载、父容器尺寸变化、`u-dialog` 由 0→可见时的尺寸变化。
  - `watch(model, async () => { await nextTick(); ensureActiveVisible() })`
  - `watch(() => props.items, async () => { await nextTick(); updateNavState(); ensureActiveVisible() }, { deep: false })`
  - `watch(() => props.position, async () => { await nextTick(); updateNavState() })`
  - viewport 的滚动事件（`passive`）：通过原生 `addEventListener('scroll', updateNavState, { passive: true })` 在 `onMounted` 绑定，`onBeforeUnmount` 解绑。
- **鼠标滚轮水平滚动（完整明确的绑定方式，仅此一种）**：
  ```ts
  const handleWheel = (e: WheelEvent) => {
    if (!showNav.value) return
    const vp = viewportRef.value
    if (!vp) return
    // 若已有水平滚动意图（触控板横向），不拦截
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    if (e.deltaY === 0) return
    e.preventDefault()
    vp.scrollLeft += e.deltaY
  }
  onMounted(() => {
    const vp = viewportRef.value
    if (!vp) return
    vp.addEventListener('wheel', handleWheel, { passive: false })
    vp.addEventListener('scroll', updateNavState, { passive: true })
    updateNavState()
  })
  onBeforeUnmount(() => {
    const vp = viewportRef.value
    if (!vp) return
    vp.removeEventListener('wheel', handleWheel)
    vp.removeEventListener('scroll', updateNavState)
  })
  ```
  > 注：**模板上不绑定 `@wheel`**，避免与此处手动绑定冲突。

  2.4. **活动指示器**：继续使用 `::after` 伪元素 + `scaleX/scaleY` 动画（在 active LI 上），不使用 JS 计算位置，已删除 markStyle 相关死代码。

### 3. 样式重构（`packages/desktop/src/components/tabs/style.scss`）

3.1. **新增结构样式**：

- `&__header-wrap`（仅 top/bottom 布局）：

  ```scss
  @include m.e(header-wrap) {
    display: flex;
    align-items: stretch;
    position: relative;
    flex-shrink: 0;
  }
  ```

- `&__viewport`：

  ```scss
  @include m.e(viewport) {
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  ```

  > 不设 `scroll-behavior: smooth`，由 JS 侧 `scrollTo({ behavior: 'smooth' })` 控制，避免每次 scrollLeft 赋值也使用动画（鼠标滚轮应立即响应）。

- `&__header` 在水平布局下调整（将 `flex-wrap: nowrap` 与 `width: max-content` 仅应用于 top/bottom）：

  ```scss
  @include position((top, bottom), header) {
    @include m.flex;
    flex-wrap: nowrap;
    width: max-content;
  }
  ```

  （替换当前 `@include position((top, bottom), header) { @include m.flex; }`。`left/right` 分支保持原逻辑不受影响。）

- `&__nav`：
  ```scss
  @include m.e(nav) {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    color: fn.use-var(text-color, main);
    cursor: pointer;
    user-select: none;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      opacity 0.2s ease;
    &:hover:not(:disabled) {
      color: fn.use-var(color, primary);
      background-color: fn.use-var(bg-color, hover);
    }
    &:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
  }
  ```
- nav 按钮的宽度使用 size 变量（在 size mixin 中设置，见 3.5）。

  3.2. **边框位置迁移**：

- 删除：
  ```scss
  @include position(top, header) {
    border-bottom: fn.use-var(border);
  }
  @include position(bottom, header) {
    border-top: fn.use-var(border);
  }
  ```
- 替换为（边框挂在 wrap 上，避免被 nav 按钮切断）：
  ```scss
  @include position(top, header-wrap) {
    border-bottom: fn.use-var(border);
  }
  @include position(bottom, header-wrap) {
    border-top: fn.use-var(border);
  }
  ```
- left/right 的 header 边框保持不变（不使用 wrap）。

  3.3. **视觉改版细节**：

- 字重：`font-weight: 600` → `font-weight: 500`
- 字距：`letter-spacing: 1px` → `letter-spacing: 0.25px`
- 为 `header-item` 添加 color 过渡：`transition: color 0.2s ease`
- hover 反馈（新增）：
  ```scss
  @include m.e(header-item) {
    /* ...existing... */
    &:not(.is-active):not(.is-disabled):hover {
      color: fn.use-var(color, primary);
    }
  }
  ```
- 活动指示器厚度与圆角：
  - top/bottom 位置下 `::after` 从 `height: 2px` → `height: 3px`，并根据位置加圆角：
    - top：`border-radius: 2px 2px 0 0`
    - bottom：`border-radius: 0 0 2px 2px`
  - left/right 位置下 `::after` 从 `width: 2px` → `width: 3px`，并加圆角：
    - left：`border-radius: 2px 0 0 2px`（挂右边）
    - right：`border-radius: 0 2px 2px 0`（挂左边）

  3.4. **删除 close 相关样式**：

- 删除 `@include m.e(close) { ... }` 块
- 删除 `@include m.e(close-placeholder) { ... }` 块
- 删除 size mixin 内 `&:hover { @include m.bem($root-name, close) { ... } }` 规则
- 删除 `@include m.m(left, right) { @include m.bem($root-name, close) { width: auto; } }` 块

  3.5. **size mixin 中新增 nav 宽度**：

  ```scss
  @include m.size using ($size) {
    @include m.bem($root-name, header-item) {
      height: fn.use-var(form-component-height, $size);
      padding: 0 fn.use-var(gap, $size);
    }
    @include m.bem($root-name, nav) {
      width: fn.use-var(form-component-height, $size);
      height: fn.use-var(form-component-height, $size);
    }
  }
  ```

  3.6. **保持不变**：

- `&__content`、`&__ripple` 规则保留
- left/right 位置下 `&__header` 的 border-right/left 保留
- 圆角规则（bottom/left/right 的 `border-radius`）保留

### 4. Playground 同步清理（`playgrounds/desktop/src/tabs/index.vue`）

4.1. **移除 editable 相关代码**：

- `configList` 中删除 `{ label: '可编辑', key: 'editable' }`。
- `config` 删除 `editable: false` 字段。
- 删除 `onTabCreate` 函数。
- 两处 `<u-tabs>` 删除 `:editable="config.editable"` 和 `@create="onTabCreate"`。

  4.2. **新增「溢出演示」开关**：

- `configList` 新增 `{ label: '溢出演示', key: 'overflowDemo' }`。
- `config` 新增 `overflowDemo: false`。
- 新增演示数据（放在 `<script setup>` 顶部）：
  ```ts
  const overflowItems = Array.from({ length: 15 }, (_, i) => ({
    key: `t${i + 1}`,
    name: `标签页 ${String(i + 1).padStart(2, '0')} - 示例`
  }))
  ```
- 新增 `computed`：
  ```ts
  import { computed } from 'vue'
  const displayItems = computed(() => (config.overflowDemo ? overflowItems : items.value))
  ```
- 两处 `<u-tabs>` 将 `v-model:items="items"` 改为 `:items="displayItems"`（单向绑定，因 `update:items` 事件已移除）。

### 5. 已知限制（本次不处理，显式记录）

- `position=left` / `position=right` 时，若 items 过多导致垂直溢出，仍会被容器裁剪（经用户决策确认，本次不处理）。
- 无障碍改进（ARIA role=tablist/tab、键盘 ArrowLeft/Right 切换）不在本次范围。

### 6. 验证步骤

6.1. 类型检查：`bun run check-types`（必须无错）。
6.2. 代码风格：`bun run lint`（必须无错）。
6.3. Playground 手工验证（`cd playgrounds/desktop && bun dev`，端口 7788，打开 `/tabs`）：

- 默认 3 个标签：无左右箭头；position=top/bottom/left/right 切换均正常。
- 开启「溢出演示」：position=top 出现左右箭头；左箭头初始禁用，点击右箭头后左箭头可用；
- 点击箭头平滑滚动；`canPrev`/`canNext` 随 scrollLeft 正确更新。
- 鼠标滚轮在 viewport 上滚动 deltaY，可水平滚动。
- 触控板横滑（deltaX）不受影响（不拦截）。
- 选中一个不在视野内的标签（如 t15）后切换，活动标签自动滚入视野。
- position=bottom：header-wrap 上边框完整贯穿（未被箭头切断）。
- position=left/right：保持现有行为（不渲染 wrap/nav，不处理溢出）。
- Dialog 内 tabs：打开 dialog 后，若开启溢出演示，`useResizeObserver` 能正确触发，箭头按钮 `showNav` 为 true。
- disabled 项不可点击、活动指示器动画自然。

## 影响范围

- `packages/desktop/src/types/tabs.ts`：移除 `TabsProps.editable`；从 `TabsEmits` 删除 `update:items` / `update:active` / `delete` / `create`；`TabsExposed` 与 `_TabsExposed` 清空为 `{}`；新增 `block?: boolean`（`TabsProps` 与 `TabsHorizontalProps`，默认 `false`，仅水平布局生效）。
- `packages/desktop/src/components/tabs/tabs.vue`：模板重构为水平布局额外包裹 `header-wrap`（prev-nav + viewport + next-nav）、垂直布局保留原 `ul`；移除 close/add 相关 DOM、`handleClose` / `handleAdd` / `index` / `markStyle` / `changedByEvent` 及两段 watch；新增 `viewportRef` / `showNav` / `canPrev` / `canNext` / `isHorizontal`，以及 `updateNavState` / `scrollByStep` / `ensureActiveVisible` / `handleWheel`；通过 `useResizeObserver` 监听 viewport 与 header 尺寸，并在 `onMounted` / `onBeforeUnmount` 手动绑定 viewport 的 `wheel`（passive: false）与 `scroll` 事件；`handleClick` 精简为仅写入 model 并 emit `click`；将 `block` prop 透传给 `<u-tabs-horizontal>`。
- `packages/desktop/src/components/tabs/tabs-horizontal.vue`：新增 `block?: boolean` prop（默认 `false`）并在根 div 上输出 `is-block` 修饰符。
- `packages/desktop/src/components/tabs/style.scss`：新增 `__header-wrap` / `__viewport` / `__nav` 样式；水平布局下 `__header` 加 `flex-wrap: nowrap; width: max-content;` 允许溢出；top/bottom 边框迁移到 `header-wrap`；活动指示器厚度 2px→3px 并增加圆角；`header-item` 字重 600→500、字距 1px→0.25px，新增 color 过渡与非 active/disabled 的 hover 反馈；删除 `__close` / `__close-placeholder` 相关规则；size mixin 中新增 nav 宽高；`$list-radius` / `$item-radius` / `__close` 圆角统一改为 `9999px` 胶囊状，`__close` 追加 `opacity` / `transform` 过渡并由水平专属规则在 `header-item:hover / :focus-visible / :focus-within` 时渐显，`is(not-rounded)` 追加 `__close { border-radius: 0 }`；新增 `is(block)` 让水平布局 `__header-wrap` 占满父容器宽度。
- `playgrounds/desktop/src/tabs/index.vue`：移除「可编辑」配置项、`editable` 字段、`onTabCreate` 以及两处 `<u-tabs>` 的 `:editable` / `@create` 绑定；新增「溢出演示」开关及 `overflowItems` / `displayItems`，`<u-tabs>` 改为单向 `:items="displayItems"`；新增「填充宽度」配置项与 `config.block`，`<u-tabs>` / `<u-tabs-horizontal>` 绑定 `:block="config.block"`。

## 历史补丁

- patch-1: shadcn 风格视觉改版
- patch-2: 交付调试 + 新增 rounded/closable 属性 + 拆出 UTabsHorizontal / UTabsVertical 独立组件
- patch-3: 水平 tabs 胶囊圆角 + hover 出现的 close 按钮 + 填充宽度
