<template>
  <div :class="[cls.b, cls.m(position)]">
    <div :class="barClassList">
      <div ref="viewportRef" :class="barCls.e('viewport')">
        <div ref="listRef" :class="barCls.e('list')">
          <button
            v-for="(item, index) in items"
            :key="item.key"
            type="button"
            role="tab"
            :class="[
              barCls.e('item'),
              bem.is('active', model === item.key),
              bem.is('disabled', item.disabled === true)
            ]"
            @click.stop="handleClick(item, index)"
          >
            <slot v-bind="{ item, index }">
              <span :class="barCls.e('item-label')">{{ item.name ?? item.key }}</span>
            </slot>

            <span
              v-if="isItemClosable(item)"
              role="button"
              tabindex="0"
              :class="barCls.e('close')"
              :aria-label="`close ${item.name ?? item.key}`"
              @click.stop="handleClose(item, index)"
            >
              <Close />
            </span>
          </button>
        </div>
      </div>
    </div>

    <transition name="fade" mode="out-in">
      <KeepAlive v-if="keepAlive">
        <component :key="model" :is="renderContent()" />
      </KeepAlive>
      <component v-else :key="model" :is="renderContent()" />
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, createVNode, nextTick, onMounted, shallowRef, watch } from 'vue'

import type { TabItem, TabsEmits, TabsProps } from '../../types/tabs'

defineOptions({ name: 'UTabs' })

const props = withDefaults(defineProps<TabsProps>(), {
  position: 'top',
  closable: false,
  block: false,
  rounded: false,
  keepAlive: false
})

const emit = defineEmits<TabsEmits>()

const slots = defineSlots<Record<string, (props: any) => any>>()

const cls = bem('tabs')
const barCls = bem('tabs-bar')

const model = defineModel<string>()

const isHorizontal = computed(() => props.position === 'top' || props.position === 'bottom')

const barClassList = computed(() => [
  barCls.b,
  barCls.m(isHorizontal.value ? 'horizontal' : 'vertical'),
  barCls.m(props.position),
  barCls.m(props.size ?? 'default'),
  bem.is('block', props.block),
  bem.is('rounded', props.rounded)
])

const isItemClosable = (item: TabItem) => {
  if (item.disabled) return false
  return item.closable ?? props.closable
}

const handleClick = (item: TabItem, index: number) => {
  if (item.disabled) return
  model.value = item.key
  emit('click', item, index)
}

const handleClose = (item: TabItem, index: number) => {
  if (item.disabled) return
  emit('close', item, index)
}

const renderContent = () => {
  const key = model.value
  if (!key) return null
  const nodes = slots[key]?.({ key })
  if (!nodes) return null
  return createVNode('div', { class: cls.e('content') }, nodes)
}

const viewportRef = shallowRef<HTMLElement>()
const listRef = shallowRef<HTMLElement>()

/** 活动标签自动滚入视野：触屏滑动替代 desktop 的溢出导航按钮 */
const ensureActiveVisible = async () => {
  await nextTick()
  const list = listRef.value
  if (!list) return
  const index = props.items.findIndex((i) => i.key === model.value)
  const el = list.children[index] as HTMLElement | undefined
  if (!el) return
  el.scrollIntoView({
    behavior: 'smooth',
    // 滚动轴居中展示活动标签，非滚动轴 nearest 避免带动页面滚动
    inline: isHorizontal.value ? 'center' : 'nearest',
    block: isHorizontal.value ? 'nearest' : 'center'
  })
}

watch([model, () => props.items], ensureActiveVisible)

onMounted(ensureActiveVisible)
</script>
