<template>
  <div :class="classList" ref="rootRef">
    <!-- Card Header -->
    <div :class="cls.e('header')">
      <div :class="cls.e('header-left')">
        <!-- Render dynamic icon if provided -->
        <u-icon v-if="icon" :class="cls.e('header-icon')">
          <component :is="icon" />
        </u-icon>
        <slot name="title">
          <span :class="cls.e('title')">{{ title }}</span>
        </slot>
      </div>
      <div v-if="$slots.extra" :class="cls.e('extra')">
        <slot name="extra" />
      </div>
    </div>

    <!-- Card Content -->
    <div :class="cls.e('content')">
      <slot />
    </div>

    <!-- Card Footer -->
    <div v-if="$slots.footer" :class="cls.e('footer')">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, shallowRef } from 'vue'
import type { Component } from 'vue'

// Define Options for SFC Component Name (U prefix is automatically mapped on consumer side)
defineOptions({ name: 'UDemoCard' })

// Interface definitions conforming to <Name>Props convention
export interface DemoCardProps {
  size?: 'small' | 'default' | 'large'
  title?: string
  icon?: Component
  bordered?: boolean
  hoverable?: boolean
}

// Props defining with fallbacks
const props = withDefaults(defineProps<DemoCardProps>(), {
  size: 'default',
  bordered: true,
  hoverable: false
})

// Initialize BEM utility
const cls = bem('demo-card')

// Leverage compositions for dynamic multi-level fallback
const { size } = useFallbackProps([props], { size: 'default' })

// Computed classes obeying standard BEM
const classList = computed(() => [
  cls.b,
  cls.m(size.value),
  cls.is('bordered', props.bordered),
  cls.is('hoverable', props.hoverable)
])

// Expose standard template element reference
const rootRef = shallowRef<HTMLElement>()
defineExpose({
  el: rootRef
})
</script>

<style lang="scss">
@use 'pkg:@veltra/styles/src/mixins' as *;
@use 'pkg:@veltra/styles/src/functions' as fn;

// BEM styling conforming to Ultra UI rules
@include b(demo-card) {
  // Use core CSS variables mapped via fn.use-var
  background-color: fn.use-var('bg-color', 'middle');
  border-radius: fn.use-var('radius', 'default');
  transition: fn.use-var('transition', 'base', all 0.2s ease);
  color: fn.use-var('text-color', 'main');
  box-shadow: fn.use-var('shadow-emboss');

  // Modifier styles
  @include m(bordered) {
    border: 1px solid fn.use-var('border-color', 'default', #e5e7eb);
  }

  @include m(hoverable) {
    cursor: pointer;
    &:hover {
      box-shadow: fn.use-var('shadow');
      transform: translateY(-2px);
    }
  }

  // Size Modifiers
  @include m(small) {
    padding: fn.use-var('gap', 'small');
    --u-demo-card-font-size: fn.use-var('font-size-main', 'small');
  }

  @include m(default) {
    padding: fn.use-var('gap', 'default');
    --u-demo-card-font-size: fn.use-var('font-size-main', 'default');
  }

  @include m(large) {
    padding: fn.use-var('gap', 'large');
    --u-demo-card-font-size: fn.use-var('font-size-main', 'large');
  }

  // Elements
  @include e(header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: fn.use-var('gap', 'default');
    border-bottom: 1px solid fn.use-var('border-color', 'default', #e5e7eb);
    padding-bottom: fn.use-var('gap', 'small');
  }

  @include e(header-left) {
    display: flex;
    align-items: center;
    gap: fn.use-var('gap', 'small');
  }

  @include e(header-icon) {
    font-size: 1.2em;
    color: fn.use-var('color', 'primary');
  }

  @include e(title) {
    font-size: fn.use-var('font-size-title', 'default');
    color: fn.use-var('text-color', 'title');
    font-weight: 600;
  }

  @include e(content) {
    font-size: var(--u-demo-card-font-size);
    line-height: 1.5;
  }

  @include e(footer) {
    margin-top: fn.use-var('gap', 'default');
    padding-top: fn.use-var('gap', 'small');
    border-top: 1px dashed fn.use-var('border-color', 'default', #e5e7eb);
  }
}
</style>
