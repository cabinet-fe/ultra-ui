# ExpandTransition Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `ExpandTransition` to remove module-level WeakMap caching, make `el` a method parameter, and adopt provide/inject pattern in consuming components.

**Architecture:** `ExpandTransition` class holds transition options, all methods take `HTMLElement` as first arg. Parent components instantiate and provide; child components inject and call. Remove `useExpandTransition` wrapper and the WeakMap.

**Tech Stack:** Vue 3, TypeScript, Vitest

---

### Task 1: Refactor ExpandTransition class

**Files:**
- Modify: `packages/utils/src/dom/expand-transition.ts`

- [ ] **Step 1: Rewrite ExpandTransition class**

Remove `el` from constructor, remove `transitionMap` and `useExpandTransition`. Add `el` parameter to all methods. Replace single `cleanup` with instance-level `cleanupMap: Map<HTMLElement, () => void>`.

```ts
import { removeStyles, setStyles } from './style'

export interface ExpandTransitionOptions {
  transition?: string
  enterTransition?: string
  leaveTransition?: string
  opacity?: boolean
}

function readVerticalPadding(el: HTMLElement) {
  const { paddingTop, paddingBottom } = getComputedStyle(el)
  return { paddingTop, paddingBottom }
}

function getTransition(options: ExpandTransitionOptions, type: 'enter' | 'leave') {
  return (
    (type === 'enter' ? options.enterTransition : options.leaveTransition) ??
    options.transition ??
    'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
  )
}

export class ExpandTransition {
  private cleanupMap = new Map<HTMLElement, () => void>()

  constructor(private options: ExpandTransitionOptions = {}) {}

  cancel(el: HTMLElement) {
    this.cleanupMap.get(el)?.()
    this.cleanupMap.delete(el)
  }

  enter(el: HTMLElement) {
    const height = el.scrollHeight
    const { paddingTop, paddingBottom } = readVerticalPadding(el)

    setStyles(el, {
      boxSizing: 'border-box',
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      overflow: 'hidden',
      transition: getTransition(this.options, 'enter'),
      willChange: this.options.opacity ? 'height, opacity' : 'height'
    })

    if (this.options.opacity) {
      el.style.opacity = '0'
    }

    void el.offsetHeight

    setStyles(el, { height: `${height}px`, paddingTop, paddingBottom })

    if (this.options.opacity) {
      el.style.opacity = '1'
    }
  }

  afterEnter(el: HTMLElement) {
    this.resetTransitionStyles(el)
  }

  beforeLeave(el: HTMLElement) {
    const { paddingTop, paddingBottom } = readVerticalPadding(el)

    setStyles(el, {
      boxSizing: 'border-box',
      height: `${el.scrollHeight}px`,
      paddingTop,
      paddingBottom,
      overflow: 'hidden',
      transition: getTransition(this.options, 'leave'),
      willChange: this.options.opacity ? 'height, opacity' : 'height'
    })

    if (this.options.opacity) {
      el.style.opacity = '1'
    }
  }

  leave(el: HTMLElement) {
    void el.offsetHeight

    setStyles(el, { height: 0, paddingTop: 0, paddingBottom: 0 })

    if (this.options.opacity) {
      el.style.opacity = '0'
    }
  }

  afterLeave(el: HTMLElement) {
    this.resetTransitionStyles(el)
  }

  expand(el: HTMLElement) {
    this.animate(el, true)
  }

  collapse(el: HTMLElement) {
    this.animate(el, false)
  }

  setExpanded(el: HTMLElement, expanded: boolean) {
    this.cancel(el)
    this.resetTemporaryStyles(el)
    el.style.overflow = 'hidden'
    el.style.height = expanded ? 'auto' : '0px'
  }

  private animate(el: HTMLElement, expanded: boolean) {
    this.cancel(el)

    const startHeight = el.offsetHeight
    const endHeight = expanded ? el.scrollHeight : 0
    const { paddingTop, paddingBottom } = readVerticalPadding(el)

    if (startHeight === endHeight) {
      this.setExpanded(el, expanded)
      return
    }

    setStyles(el, {
      boxSizing: 'border-box',
      height: `${startHeight}px`,
      paddingTop,
      paddingBottom,
      overflow: 'hidden',
      transition: getTransition(this.options, expanded ? 'enter' : 'leave'),
      willChange: 'height'
    })

    void el.offsetHeight

    setStyles(el, {
      height: `${endHeight}px`,
      paddingTop: expanded ? paddingTop : 0,
      paddingBottom: expanded ? paddingBottom : 0
    })

    const cleanup = () => {
      el.removeEventListener('transitionend', onEnd)
      el.removeEventListener('transitioncancel', onEnd)
      this.cleanupMap.delete(el)
    }

    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'height') return
      cleanup()
      this.resetTemporaryStyles(el)
      el.style.overflow = 'hidden'
      el.style.height = expanded ? 'auto' : '0px'
    }

    el.addEventListener('transitionend', onEnd)
    el.addEventListener('transitioncancel', onEnd)
    this.cleanupMap.set(el, cleanup)
  }

  private resetTransitionStyles(el: HTMLElement) {
    removeStyles(el, [
      'box-sizing',
      'height',
      'padding-top',
      'padding-bottom',
      'overflow',
      'transition',
      'opacity',
      'will-change'
    ])
  }

  private resetTemporaryStyles(el: HTMLElement) {
    removeStyles(el, [
      'box-sizing',
      'padding-top',
      'padding-bottom',
      'transition',
      'opacity',
      'will-change'
    ])
  }
}
```

- [ ] **Step 2: Update re-exports if needed**

Check `packages/utils/src/index.ts` — it re-exports from `./dom/expand-transition`. Verify it still exports `ExpandTransition` and `ExpandTransitionOptions`, and no longer exports `useExpandTransition`.

---

### Task 2: Update ExpandTransition tests

**Files:**
- Modify: `packages/utils/src/dom/__test__/expand-transition.test.ts`

- [ ] **Step 1: Rewrite tests for new API**

All `new ExpandTransition(el, options)` → `new ExpandTransition(options)`. All method calls add `el` as first arg.

```ts
// @vitest-environment happy-dom
import { ExpandTransition } from '../expand-transition'

function createPanel() {
  const el = document.createElement('div')

  el.style.paddingTop = '2px'
  el.style.paddingBottom = '2px'
  document.body.appendChild(el)

  Object.defineProperties(el, {
    offsetHeight: { configurable: true, value: 16 },
    scrollHeight: { configurable: true, value: 44 }
  })

  return el
}

function fireHeightTransitionEnd(el: HTMLElement) {
  const event = new Event('transitionend') as TransitionEvent
  Object.defineProperty(event, 'propertyName', { configurable: true, value: 'height' })
  el.dispatchEvent(event)
}

describe('ExpandTransition', () => {
  it('drives Vue transition hooks with a measured border-box height', () => {
    const el = createPanel()
    const transition = new ExpandTransition({
      enterTransition: 'height 0.25s ease, padding-top 0.25s ease, padding-bottom 0.25s ease',
      leaveTransition: 'height 0.2s ease, padding-top 0.2s ease, padding-bottom 0.2s ease',
      opacity: true
    })

    try {
      transition.enter(el)

      expect(el.style.height).toBe('44px')
      expect(el.style.paddingTop).toBe('2px')
      expect(el.style.paddingBottom).toBe('2px')
      expect(el.style.boxSizing).toBe('border-box')
      expect(el.style.opacity).toBe('1')

      transition.beforeLeave(el)
      transition.leave(el)

      expect(el.style.height).toBe('0px')
      expect(el.style.paddingTop).toBe('0px')
      expect(el.style.paddingBottom).toBe('0px')
      expect(el.style.boxSizing).toBe('border-box')
      expect(el.style.opacity).toBe('0')
    } finally {
      el.remove()
    }
  })

  it('keeps expanded imperative panels at auto height after transition end', () => {
    const el = createPanel()
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })

    try {
      transition.expand(el)

      expect(el.style.height).toBe('44px')
      expect(el.style.overflow).toBe('hidden')

      fireHeightTransitionEnd(el)

      expect(el.style.height).toBe('auto')
      expect(el.style.transition).toBe('')
      expect(el.style.willChange).toBe('')
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })

  it('keeps collapsed imperative panels at zero height after transition end', () => {
    const el = createPanel()
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })

    try {
      transition.collapse(el)

      expect(el.style.height).toBe('0px')
      expect(el.style.paddingTop).toBe('0px')
      expect(el.style.paddingBottom).toBe('0px')

      fireHeightTransitionEnd(el)

      expect(el.style.height).toBe('0px')
      expect(el.style.transition).toBe('')
      expect(el.style.willChange).toBe('')
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })
})
```

- [ ] **Step 2: Run tests**

Run: `cd /Users/whj/codes/ultra-ui && bun run test -- --filter @veltra/utils --reporter=verbose`
Expected: All tests pass.

---

### Task 3: Update collapse component

**Files:**
- Modify: `packages/desktop/src/components/collapse/di.ts`
- Modify: `packages/desktop/src/components/collapse/collapse.vue`
- Modify: `packages/desktop/src/components/collapse/collapse-item.vue`

- [ ] **Step 1: Add ExpandTransition to CollapseContext in di.ts**

```ts
import { ExpandTransition } from '@veltra/utils'
import type { BEM, ComponentSize } from '@veltra/utils'
import type { Component, ComputedRef, InjectionKey } from 'vue'

import type { CollapseIconPosition, CollapseValue } from '../../types'

export interface CollapseContext {
  cls: BEM<'collapse'>
  size: ComputedRef<ComponentSize>
  iconPosition: ComputedRef<CollapseIconPosition>
  expandIcon: ComputedRef<Component | undefined>
  activeValues: ComputedRef<CollapseValue[]>
  toggle: (value: CollapseValue) => void
  expandTransition: ExpandTransition
}

export const CollapseDIKey: InjectionKey<CollapseContext> = Symbol('Collapse')
```

- [ ] **Step 2: Create ExpandTransition in collapse.vue and provide it**

In `collapse.vue`, import `ExpandTransition`, create instance, add to provide object:

```ts
import { ExpandTransition } from '@veltra/utils'

const expandTransition = new ExpandTransition({
  transition: 'height 0.24s cubic-bezier(0.4, 0, 0.2, 1)'
})

// In provide:
provide(CollapseDIKey, {
  cls,
  size,
  iconPosition,
  expandIcon,
  activeValues,
  toggle,
  expandTransition
})
```

- [ ] **Step 3: Refactor collapse-item.vue to use injected ExpandTransition**

```vue
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

const iconPosition = computed(() => context?.iconPosition.value ?? 'right')

const iconComponent = computed(() => context?.expandIcon.value ?? ArrowRight)

const showLeftIcon = computed(() => !props.hideIcon && iconPosition.value === 'left')
const showRightIcon = computed(() => !props.hideIcon && iconPosition.value === 'right')

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

onMounted(() => {
  if (!wrapperEl.value) return
  context.expandTransition.setExpanded(wrapperEl.value, isActive.value)
})

watch(isActive, (active) => {
  if (!wrapperEl.value) return
  active
    ? context.expandTransition.expand(wrapperEl.value)
    : context.expandTransition.collapse(wrapperEl.value)
})

onBeforeUnmount(() => {
  if (!wrapperEl.value) return
  context.expandTransition.cancel(wrapperEl.value)
})
</script>
```

---

### Task 4: Update menu component

**Files:**
- Modify: `packages/desktop/src/components/menu/di.ts`
- Modify: `packages/desktop/src/components/menu/menu.vue`
- Modify: `packages/desktop/src/components/menu/menu-sub.vue`
- Delete: `packages/desktop/src/components/menu/use-menu-transition.ts`
- Delete: `packages/desktop/src/components/menu/__test__/use-menu-transition.test.ts`

- [ ] **Step 1: Add ExpandTransition to MenuContext in di.ts**

Add `expandTransition: ExpandTransition` to the `MenuContext` interface.

- [ ] **Step 2: Create ExpandTransition in menu.vue and provide it**

Define transition config and create instance, add to provide object.

- [ ] **Step 3: Refactor menu-sub.vue to use injected ExpandTransition**

Remove `useMenuTransition` import. Use `expandTransition` from context directly in template:
```vue
<transition
  @enter="(el) => expandTransition.enter(el)"
  @after-enter="(el) => expandTransition.afterEnter(el)"
  @before-leave="(el) => expandTransition.beforeLeave(el)"
  @leave="(el) => expandTransition.leave(el)"
  @after-leave="(el) => expandTransition.afterLeave(el)"
>
```

- [ ] **Step 4: Delete use-menu-transition.ts and its test**

Remove `packages/desktop/src/components/menu/use-menu-transition.ts` and `packages/desktop/src/components/menu/__test__/use-menu-transition.test.ts`.

---

### Task 5: Verify exports and run checks

- [ ] **Step 1: Check `@veltra/utils` exports for `useExpandTransition` removal**

Verify `packages/utils/src/index.ts` no longer re-exports `useExpandTransition`.

- [ ] **Step 2: Search for any other `useExpandTransition` usage across the codebase**

Ensure no other files import `useExpandTransition`.

- [ ] **Step 3: Run type checking**

Run: `bun run check-types`

- [ ] **Step 4: Run tests**

Run: `bun run test`

- [ ] **Step 5: Run lint**

Run: `bun run lint`