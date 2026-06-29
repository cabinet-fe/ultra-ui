<template>
  <div ref="rootRef" class="playground-nav-search">
    <u-auto-complete
      ref="autoCompleteRef"
      v-model="query"
      class="playground-nav-search__input"
      :suggestions="searchSuggestions"
      placeholder="搜索组件或页面…"
      clearable
      :allow-custom="false"
      @select="handleSelect"
    >
      <template #prefix>
        <u-icon class="playground-nav-search__icon"><Search /></u-icon>
      </template>

      <template #suffix>
        <kbd v-if="showShortcut" class="playground-nav-search__kbd">⌘K</kbd>
      </template>

      <template #default="{ option: path }">
        <div class="playground-nav-search__option">
          <span class="playground-nav-search__option-title">{{ getItem(path)?.title }}</span>
          <span class="playground-nav-search__option-meta">{{ formatMeta(getItem(path)) }}</span>
        </div>
      </template>
    </u-auto-complete>
  </div>
</template>

<script lang="ts" setup>
import type { AutoCompleteExposed, NavItem } from '@veltra/desktop'
import { Search } from '@veltra/icons/normal'
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

import {
  filterNavSearchItems,
  flattenPlaygroundNavItems,
  isNavGroupPath,
  type NavSearchItem
} from './nav-config'

defineOptions({ name: 'UNavSearch' })

const props = defineProps<{ menus: NavItem[] }>()

const router = useRouter()
const query = shallowRef('')
const focused = shallowRef(false)
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const autoCompleteRef = useTemplateRef<AutoCompleteExposed>('autoCompleteRef')

const navItems = computed(() => flattenPlaygroundNavItems(props.menus))

const itemByPath = computed(() => {
  const map = new Map<string, NavSearchItem>()
  for (const item of navItems.value) {
    map.set(item.path, item)
  }
  return map
})

const showShortcut = computed(() => !focused.value && !query.value)

const searchSuggestions = (modelValue?: string) => {
  return filterNavSearchItems(navItems.value, modelValue).map((item) => item.path)
}

const getItem = (path: string) => itemByPath.value.get(path)

const formatMeta = (item?: NavSearchItem) => {
  if (!item) return ''
  const parts = [item.section]
  if (item.category) parts.push(item.category)
  return parts.join(' · ')
}

const handleSelect = (path: string) => {
  if (path && !isNavGroupPath(path)) {
    router.push(path)
  }
  query.value = ''
}

const focusInput = () => {
  rootRef.value?.querySelector('input')?.focus()
  autoCompleteRef.value?.open()
}

const onFocusIn = () => {
  focused.value = true
}

const onFocusOut = () => {
  focused.value = false
}

const onGlobalKeydown = (event: KeyboardEvent) => {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
  event.preventDefault()
  focusInput()
}

onMounted(() => {
  rootRef.value?.addEventListener('focusin', onFocusIn)
  rootRef.value?.addEventListener('focusout', onFocusOut)
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  rootRef.value?.removeEventListener('focusin', onFocusIn)
  rootRef.value?.removeEventListener('focusout', onFocusOut)
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style lang="scss" scoped>
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--u-#{$basename}#{$suffix});
}

.playground-nav-search {
  flex: 1;
  max-width: 420px;
  min-width: 220px;

  &__input {
    width: 100%;
  }

  &__icon {
    color: use-var(text-color, second);
    font-size: 14px;
  }

  &__kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 1px 6px;
    border-radius: 6px;
    border: 1px solid use-var(border, color);
    background: use-var(bg-color, top);
    color: use-var(text-color, second);
    font-family: inherit;
    font-size: 11px;
    line-height: 1.4;
    pointer-events: none;
    user-select: none;
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 2px 0;
  }

  &__option-title {
    font-size: 13px;
    font-weight: 500;
    color: use-var(text-color, title);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__option-meta {
    font-size: 11px;
    color: use-var(text-color, second);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.u-auto-complete__options) {
    max-height: 320px;
  }

  :deep(.u-auto-complete__option) {
    height: auto;
    line-height: 1.4;
    border-radius: 6px;
  }
}

@media (max-width: 768px) {
  .playground-nav-search {
    max-width: none;
    min-width: 0;

    &__kbd {
      display: none;
    }
  }
}
</style>
