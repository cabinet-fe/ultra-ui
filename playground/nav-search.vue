<template>
  <div
    ref="trigger"
    class="playground-nav-search"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @click="onTriggerClick"
    @keydown="onKeydown"
  >
    <u-input
      ref="input"
      v-model="query"
      class="playground-nav-search__input"
      placeholder="搜索组件或页面…"
      clearable
      @focus="open"
    >
      <template #prefix>
        <u-icon class="playground-nav-search__icon"><Search /></u-icon>
      </template>

      <template #suffix>
        <kbd v-if="showShortcut" class="playground-nav-search__kbd">⌘K</kbd>
      </template>
    </u-input>
  </div>

  <Teleport :to="`#${popperContainerId}`">
    <div
      v-if="panelOpen"
      ref="contentRef"
      class="playground-nav-search__panel"
      :style="{ zIndex: zIndex() }"
      v-click-outside="onClickOutside"
      @mousedown.prevent
    >
      <nav-search-panel
        :groups="groups"
        :query="query"
        :active-index="activeIndex"
        @select="selectPath"
      />
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { usePop } from '@veltra/compositions'
import type { InputExposed, NavItem } from '@veltra/desktop'
import { vClickOutside } from '@veltra/directives'
import { Search } from '@veltra/icons/normal'
import { zIndex, setStyles } from '@veltra/utils'
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { flattenPlaygroundNavItems, isNavGroupPath, searchNavItems } from './nav-config'
import NavSearchPanel from './nav-search-panel.vue'

defineOptions({ name: 'UNavSearch' })

const props = defineProps<{ menus: NavItem[] }>()

const router = useRouter()
const query = shallowRef('')
const panelOpen = shallowRef(false)
const focused = shallowRef(false)
/** 扁平 active 下标：跨分组连续编号，-1 无高亮 */
const activeIndex = shallowRef(0)

const inputRef = useTemplateRef<InputExposed>('input')
const triggerRef = useTemplateRef<HTMLElement>('trigger')
const contentRef = shallowRef<HTMLElement>()

const navItems = computed(() => flattenPlaygroundNavItems(props.menus))
const groups = computed(() => searchNavItems(navItems.value, query.value))
const flatItems = computed(() => groups.value.flatMap((group) => group.items))

const showShortcut = computed(() => !focused.value && !query.value)

const { popperContainerId } = usePop({
  triggerRef,
  contentRef,
  direction: 'bottom',
  alignment: 'start',
  onBeforeUpdate(triggerEl, contentEl) {
    setStyles(contentEl, { width: `${triggerEl.offsetWidth}px` })
  }
})

function open() {
  panelOpen.value = true
  activeIndex.value = 0
}

/** 任何关闭路径都清空查询并复位高亮，⌘K 徽标随空查询恢复 */
function close() {
  panelOpen.value = false
  query.value = ''
  activeIndex.value = 0
}

function selectPath(path: string) {
  if (!isNavGroupPath(path)) router.push(path)
  close()
  // 选中即完成搜索，把焦点还给页面；否则路由跳转后焦点残留输入框，再点击无法重新展开
  inputRef.value?.el?.blur()
}

/** 点击已聚焦的触发器（focus 事件不会再来）也要能重新展开 */
function onTriggerClick() {
  if (!panelOpen.value) open()
}

function onFocusIn() {
  focused.value = true
}

/** 焦点移出触发器与面板整体时关闭（点击面板选项由 mousedown.prevent 保住焦点，走 click 选中） */
function onFocusOut(event: FocusEvent) {
  focused.value = false
  const next = event.relatedTarget as Node | null
  if (next && (triggerRef.value?.contains(next) || contentRef.value?.contains(next))) return
  close()
}

function onClickOutside(event: MouseEvent) {
  // 点击触发器自身是聚焦展开路径，不算外部
  if (triggerRef.value?.contains(event.target as Node)) return
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (!panelOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const count = flatItems.value.length
    if (!count) return
    const delta = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + delta + count) % count
    return
  }

  if (event.key === 'Enter') {
    const item = flatItems.value[activeIndex.value]
    if (item) selectPath(item.path)
  }
}

/** 查询变化后结果列表重建，高亮回到第一项；关闭清空产生的 '' 不重开面板，随后的非空输入仍自动展开 */
watch(query, (value) => {
  activeIndex.value = 0
  if (value && focused.value && !panelOpen.value) panelOpen.value = true
})

function onGlobalKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
  event.preventDefault()
  inputRef.value?.el?.focus()
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
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

  // usePop 定位壳：left/top 由 usePop 写入，宽度对齐触发器
  &__panel {
    position: absolute;
    top: 0;
    left: 0;
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
