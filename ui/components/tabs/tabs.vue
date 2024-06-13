<template>
  <div :class="[cls.b, cls.m(position!), cls.m(size)]">
    <ul :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
      <li
        v-for="(item, index) in tabItems"
        :key="item.key"
        :class="[
          cls.e('header-item'),
          bem.is('active', model === item.key),
          bem.is('disabled', item.disabled === true)
        ]"
        ref="tabItemsRef"
        @click="handleClick(item, index)"
      >
        <slot :name="`name:${item.key}`">
          {{ item.name }}
        </slot>

        <template v-if="closable">
          <u-icon
            v-if="!item.disabled"
            :class="cls.e('close')"
            @click.stop.native="handleClose(item, index)"
          >
            <Close />
          </u-icon>
          <i v-else :class="cls.e('close-placeholder')"></i>
        </template>
      </li>

      <li :class="cls.e('marker')" v-if="!closable" :style="markStyle"></li>
    </ul>

    <transition name="fade" mode="out-in">
      <KeepAlive v-if="keepAlive">
        <component :key="model" :is="renderSlots()" />
      </KeepAlive>
      <component v-else :key="model" :is="renderSlots()" />
    </transition>
  </div>
</template>

<script lang="ts" setup>
import type { TabItem, TabsProps, TabsEmits } from '@ui/types/components/tabs'
import { bem } from '@ui/utils'
import {
  KeepAlive,
  computed,
  createVNode,
  nextTick,
  shallowRef,
  watch,
  type CSSProperties
} from 'vue'
import { Close } from 'icon-ultra'
import { useFallbackProps } from '@ui/compositions'
import { UIcon } from '../icon'
import type { ComponentSize } from '@ui/types/component-common'
import { UScroll } from '../scroll'
// import { useTabsSort } from './use-sort'

defineOptions({
  name: 'Tabs'
})

const props = withDefaults(defineProps<TabsProps>(), {
  position: 'top'
})

const emit = defineEmits<TabsEmits>()

const slots = defineSlots<{
  [key: string]: (props: { key: string }) => any
  [key: `name:${string}`]: () => any
}>()

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const tabItems = computed(() => {
  return props.items
})

const cls = bem('tabs')

const tabItemsRef = shallowRef<HTMLLIElement[]>()
const headerRef = shallowRef<HTMLElement>()

/** 当前活动标签 */
const index = shallowRef(-1)
const model = defineModel<string>()

const markStyle = shallowRef<CSSProperties>({})

watch(
  [tabItemsRef, index, () => props.position, () => props.closable],
  async ([items, index, position]) => {
    await nextTick()
    if (!items || index === -1 || props.closable) return
    const headerRect = headerRef.value!.getBoundingClientRect()
    const rect = items[index]!.getBoundingClientRect()

    if (position === 'top' || position === 'bottom') {
      markStyle.value = {
        width: rect.width + 'px',
        transform: `translate3d(${rect.left - headerRect.left}px, 0, 0)`
      }
    } else {
      markStyle.value = {
        height: rect.height + 'px',
        transform: `translate3d(0, ${rect.top - headerRect.top}px, 0)`
      }
    }
  }
)

let changedByEvent = false
watch(
  model,
  model => {
    if (changedByEvent) return
    index.value = props.items.findIndex(item => item.key === model)
  },
  { immediate: true }
)

const handleClick = (item: TabItem, _index: number) => {
  if (item.disabled) return
  changedByEvent = true
  index.value = _index
  model.value = item.key
  nextTick(() => {
    changedByEvent = false
  })
}

const renderSlots = () => {
  const key = model.value
  if (!key) return null
  const nodes = slots[key]?.({ key })
  if (Array.isArray(nodes)) {
    return createVNode(
      UScroll,
      { class: cls.e('content') },
      { default: () => nodes }
    )
  }
  return nodes
}

/** 关闭标签 */
const handleClose = (item: TabItem, index: number) => {
  const { items } = props
  if (model.value === item.key) {
    model.value = (items[index + 1] ?? items[index - 1])!.key
  }

  emit('update:items', [...items.slice(0, index), ...items.slice(index + 1)])

  emit('delete', item, index)
}

/** 排序 */

// useTabsSort({
//   props,
//   emit,
//   target: headerRef
// })
</script>
