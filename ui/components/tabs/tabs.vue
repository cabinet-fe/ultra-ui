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
        @click.stop="handleClick(item, index)"
        v-ripple="item.disabled ? false : cls.e('ripple')"
      >
        <slot :name="`name:${item.key}`">
          {{ item.name }}
        </slot>

        <template v-if="editable">
          <u-icon
            v-if="!item.disabled"
            :class="cls.e('close')"
            @click.stop="handleClose(item, index)"
            @mousedown.stop
          >
            <Close />
          </u-icon>
          <i v-else :class="cls.e('close-placeholder')"></i>
        </template>
      </li>

      <li
        v-if="editable"
        :class="[cls.e('header-item'), cls.e('add')]"
        @click="handleAdd"
      >
        <u-icon>
          <Plus />
        </u-icon>
      </li>

      <li v-else :class="cls.e('marker')" :style="markStyle"></li>
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
  computed,
  createVNode,
  nextTick,
  shallowRef,
  watch,
  type CSSProperties
} from 'vue'
import { Close, Plus } from 'icon-ultra'
import { useFallbackProps } from '@ui/compositions'
import { UIcon } from '../icon'
import type { ComponentSize } from '@ui/types/component-common'
import { UScroll } from '../scroll'
import { vRipple } from '@ui/directives'

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

const headerRef = shallowRef<HTMLElement>()

/** 当前活动标签 */
const index = shallowRef(-1)
const model = defineModel<string>()

const markStyle = shallowRef<CSSProperties>({})

watch(
  [index, () => props.position, () => props.editable],
  async ([index, position, editable]) => {
    await nextTick()
    if (index === -1 || editable) return

    const headerEl = headerRef.value!

    const headerRect = headerEl.getBoundingClientRect()
    const el = headerEl.children[index]! as HTMLLIElement
    const { offsetWidth, offsetHeight } = el

    const rect = el.getBoundingClientRect()

    if (position === 'top' || position === 'bottom') {
      markStyle.value = {
        width: offsetWidth + 'px',
        transform: `translate3d(${rect.left - headerRect.left}px, 0, 0)`
      }
    } else {
      markStyle.value = {
        height: offsetHeight + 'px',
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

const handleAdd = () => {
  emit('create')
}
</script>
