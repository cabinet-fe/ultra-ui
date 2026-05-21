# Collapse 组件优化与样式精简实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 Collapse 组件的样式以提高显示密度（方案 A），并移除 iconPosition（左侧图标）和 hideIcon（隐藏图标）属性支持，同步更新 Playground。

**Architecture:** 通过修改 `packages/desktop/src/types/collapse.ts` 定义，移除 `iconPosition` 和 `hideIcon`，在 `collapse.vue`、`collapse-item.vue` 和 `di.ts` 中精简相关代码逻辑，优化 `packages/desktop/src/components/collapse/style.scss` 中的 padding 样式，并同步修整 playgrounds 中的用法。

**Tech Stack:** Vue 3 (Composition API), SCSS, TypeScript, Bun

---

### Task 1: 移除和修改类型定义

**Files:**
- Modify: `packages/desktop/src/types/collapse.ts`
- Modify: `packages/desktop/src/components/collapse/di.ts`

- [ ] **Step 1: 修改 `packages/desktop/src/types/collapse.ts`**
  编辑 [collapse.ts](file:///Users/whj/codes/ultra-ui/packages/desktop/src/types/collapse.ts)：
  - 移除 `export type CollapseIconPosition = 'left' | 'right'` 类型。
  - 移除 `CollapseProps` 中的 `iconPosition?: CollapseIconPosition` 属性。
  - 移除 `CollapseItemProps` 中的 `hideIcon?: boolean` 属性。

  修改后代码片段：
  ```typescript
  export interface CollapseProps extends ComponentProps {
    /** 当前展开项的 value（单个或多个） */
    modelValue?: CollapseModelValue

    /**
     * 是否手风琴模式（一次只能展开一项）
     * @default false
     */
    accordion?: boolean

    /**
     * 是否显示外层与项之间的分隔线（设为 false 时为 ghost 风格）
     * @default true
     */
    bordered?: boolean

    /**
     * 自定义展开图标组件，活动态会自动旋转 90°。
     * 接受任意 Vue 组件（SFC、Functional Component 等）。
     */
    expandIcon?: Component
  }

  export interface CollapseItemProps {
    /** 唯一标识 */
    value: CollapseValue

    /** 标题文本（也可使用 #title 插槽） */
    title?: string

    /** 是否禁用 */
    disabled?: boolean
  }
  ```

- [ ] **Step 2: 修改 `packages/desktop/src/components/collapse/di.ts`**
  编辑 [di.ts](file:///Users/whj/codes/ultra-ui/packages/desktop/src/components/collapse/di.ts)：
  - 移除 `CollapseIconPosition` 导入。
  - 从 `CollapseContext` 中移除 `iconPosition` 定义。

  修改后的 `di.ts`：
  ```typescript
  import { type BEM, type ComponentSize, ExpandTransition } from '@veltra/utils'
  import type { Component, ComputedRef, InjectionKey } from 'vue'

  import type { CollapseValue } from '../../types'

  export interface CollapseContext {
    cls: BEM<'collapse'>
    size: ComputedRef<ComponentSize>
    expandIcon: ComputedRef<Component | undefined>
    activeValues: ComputedRef<CollapseValue[]>
    toggle: (value: CollapseValue) => void
    expandTransition: ExpandTransition
  }

  export const CollapseDIKey: InjectionKey<CollapseContext> = Symbol('Collapse')
  ```

- [ ] **Step 3: 运行类型检查验证报错（验证 API 修改）**
  运行: `bun run check-types`
  预期: 遇到 `collapse.vue` / `collapse-item.vue` 使用 `iconPosition` 报错。

---

### Task 2: 优化主组件逻辑 (`collapse.vue`)

**Files:**
- Modify: `packages/desktop/src/components/collapse/collapse.vue`

- [ ] **Step 1: 修改 `collapse.vue`**
  编辑 [collapse.vue](file:///Users/whj/codes/ultra-ui/packages/desktop/src/components/collapse/collapse.vue)：
  - 移除 `CollapseProps` 导入中的 `CollapseIconPosition`（如果类型里有的话）。
  - 移除 `withDefaults` 定义中的 `iconPosition: 'right'`。
  - 移除 `const iconPosition = computed(() => props.iconPosition ?? 'right')`。
  - 移除 `classList` 中针对 `iconPosition` 的 BEM class 绑定：`cls.m(\`icon-\${iconPosition.value}\`)`。
  - 移除 `provide(CollapseDIKey)` 中提供的 `iconPosition`。

  修改后代码片段：
  ```typescript
  const props = withDefaults(defineProps<CollapseProps>(), {
    accordion: false,
    bordered: true
  })
  
  // ...

  const expandIcon = computed(() => props.expandIcon)

  const classList = computed(() => [
    cls.b,
    cls.m(size.value),
    bem.is('bordered', props.bordered)
  ])

  // ...

  provide(CollapseDIKey, {
    cls,
    size,
    expandIcon,
    activeValues,
    toggle,
    expandTransition
  })
  ```

- [ ] **Step 2: 运行类型检查**
  运行: `bun run check-types`
  预期: 剩下 `collapse-item.vue` 报错。

---

### Task 3: 优化子组件逻辑 (`collapse-item.vue`)

**Files:**
- Modify: `packages/desktop/src/components/collapse/collapse-item.vue`

- [ ] **Step 1: 修改 `collapse-item.vue` 模板与逻辑**
  编辑 [collapse-item.vue](file:///Users/whj/codes/ultra-ui/packages/desktop/src/components/collapse/collapse-item.vue)：
  - 移除 `iconPosition`、`showLeftIcon`、`showRightIcon` 的定义。
  - 简化 `<template>` 中的 header 内容，直接去掉左侧 icon `<span v-if="showLeftIcon" ...>`。
  - 无条件在标题右侧渲染展开图标 `<span :class="cls.e('icon')">...</span>`。

  修改后完整代码：
  ```html
  <template>
    <div :class="classList">
      <div
        :class="headerClassList"
        role="button"
        :aria-expanded="isActive"
        :aria-disabled="disabled"
        :tabindex="disabled ? -1 : 0"
        @click="handleClick"
        @keydown.enter.prevent="handleClick"
        @keydown.space.prevent="handleClick"
      >
        <span :class="cls.e('title')">
          <slot name="title">{{ title }}</slot>
        </span>

        <span :class="cls.e('icon')">
          <slot name="icon" :is-active="isActive">
            <UIcon><component :is="iconComponent" /></UIcon>
          </slot>
        </span>
      </div>
      <div ref="wrapperEl" :class="cls.e('content-wrapper')" :aria-hidden="!isActive">
        <div :class="cls.e('content')">
          <slot />
        </div>
      </div>
    </div>
  </template>

  <script lang="ts" setup>
  import { ArrowRight } from '@veltra/icons/normal'
  import { bem } from '@veltra/utils'
  import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

  import type { CollapseItemProps } from '../../types'
  import { UIcon } from '../icon'
  import { CollapseDIKey } from './di'

  defineOptions({
    name: 'CollapseItem'
  })

  const props = defineProps<CollapseItemProps>()

  const context = inject(CollapseDIKey)!

  const cls = context?.cls ?? bem('collapse')

  const isActive = computed(() => !!context?.activeValues.value.includes(props.value))

  const iconComponent = computed(() => context?.expandIcon.value ?? ArrowRight)

  const classList = computed(() => [
    cls.e('item'),
    bem.is('active', isActive.value),
    bem.is('disabled', props.disabled)
  ])

  const headerClassList = computed(() => [
    cls.e('header'),
    bem.is('disabled', props.disabled),
    bem.is('active', isActive.value)
  ])

  const handleClick = () => {
    if (props.disabled) return
    context?.toggle(props.value)
  }

  const wrapperEl = ref<HTMLElement>()

  const { expandTransition } = context

  onMounted(() => {
    if (!wrapperEl.value) return
    expandTransition.setExpanded(wrapperEl.value, isActive.value)
  })

  watch(isActive, (active) => {
    if (!wrapperEl.value) return
    active ? expandTransition.expand(wrapperEl.value) : expandTransition.collapse(wrapperEl.value)
  })

  onBeforeUnmount(() => {
    if (!wrapperEl.value) return
    expandTransition.cancel(wrapperEl.value)
  })
  </script>
  ```

---

### Task 4: 样式优化 (`style.scss`)

**Files:**
- Modify: `packages/desktop/src/components/collapse/style.scss`

- [ ] **Step 1: 调整 padding 变量值以提升显示密度**
  编辑 [style.scss](file:///Users/whj/codes/ultra-ui/packages/desktop/src/components/collapse/style.scss)：
  将 `$header-padding-x` 与 `$header-padding-y` 替换为方案 A 对应的缩减数值。

  修改后代码片段：
  ```scss
  $header-padding-x: (
    small: 10px,
    default: 12px,
    large: 16px
  );
  $header-padding-y: (
    small: 6px,
    default: 10px,
    large: 14px
  );
  ```

---

### Task 5: 优化演示页面 (`playgrounds/desktop/src/collapse/index.vue`)

**Files:**
- Modify: `playgrounds/desktop/src/collapse/index.vue`

- [ ] **Step 1: 修改 Demo 文件，移除被删除 API 的演示与属性使用**
  编辑 [index.vue](file:///Users/whj/codes/ultra-ui/playgrounds/desktop/src/collapse/index.vue)：
  - 移除「图标位置」Card Demo。
  - 移除 `const iconLeftValue = ref(...)` 定义。
  - 修改「禁用与隐藏图标」Card 为「禁用状态」Card，移除第三项 `<u-collapse-item hide-icon ...>`。
  - 移除「嵌套使用」Demo 内部的 `icon-position="left"`。

  修改后代码片段（“禁用状态” 部分）：
  ```html
      <CustomCard title="禁用状态">
        <u-collapse v-model="disabledValue">
          <u-collapse-item value="1" title="正常项">
            <p>该项可以正常展开 / 收起。</p>
          </u-collapse-item>
          <u-collapse-item value="2" title="禁用项" disabled>
            <p>禁用状态下点击与键盘均不会触发切换。</p>
          </u-collapse-item>
        </u-collapse>
      </CustomCard>
  ```

  修改后代码片段（“嵌套使用” 部分）：
  ```html
      <CustomCard title="嵌套使用">
        <u-collapse v-model="nestValue">
          <u-collapse-item value="n1" title="@veltra/desktop">
            <u-collapse v-model="nestInner1" :bordered="false">
              <u-collapse-item value="n1-1" title="组件目录">
                <p>
                  每个组件位于 <code>src/components/&lt;name&gt;</code>，独立
                  <code>style.scss</code>。
                </p>
              </u-collapse-item>
  ```

---

### Task 6: 编译、类型检查与集成验证

- [ ] **Step 1: 运行全局类型检查**
  运行: `bun run check-types`
  预期: 类型检查通过，无任何报错。

- [ ] **Step 2: 运行编译构建**
  运行: `bun run build`
  预期: packages 编译成功且各 package 打包无任何输出错误。
