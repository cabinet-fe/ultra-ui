<template>
  <div
    :class="[
      cls.b,
      cls.m(position!),
      cls.m(size),
      bem.is('not-rounded', !rounded),
      bem.is('block', block),
      bem.is('bar-only', !$slots.default)
    ]"
  >
    <div :class="[cls.e('header-wrap'), cls.em('header-wrap', position!)]">
      <button
        v-show="showNav"
        type="button"
        :class="[cls.e('nav'), cls.em('nav', 'prev')]"
        :disabled="!canPrev"
        @click="scrollByStep(-1)"
      >
        <u-icon>
          <ArrowLeft />
        </u-icon>
      </button>

      <div ref="viewportRef" :class="cls.e('viewport')">
        <ul ref="headerRef" :class="[cls.e('header'), cls.em('header', position!)]">
          <li
            v-for="(item, index) in items"
            :key="item.key"
            :class="[
              cls.e('header-item'),
              bem.is('active', model === item.key),
              bem.is('disabled', item.disabled === true)
            ]"
            @click.stop="handleClick(item, index)"
          >
            <span :class="cls.e('header-item-label')">
              <slot :name="`name:${item.key}`">{{ item.name ?? item.key }}</slot>
            </span>
            <button
              v-if="isItemClosable(item)"
              type="button"
              :class="cls.e('close')"
              :aria-label="`close ${item.name ?? item.key}`"
              @click.stop="handleClose(item, index)"
            >
              <u-icon>
                <Close />
              </u-icon>
            </button>
          </li>
        </ul>
      </div>

      <button
        v-show="showNav"
        type="button"
        :class="[cls.e('nav'), cls.em('nav', 'next')]"
        :disabled="!canNext"
        @click="scrollByStep(1)"
      >
        <u-icon>
          <ArrowRight />
        </u-icon>
      </button>
    </div>

    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { ArrowLeft, ArrowRight, Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, shallowRef } from 'vue'

import type { ComponentSize, TabItem } from '../../types'
import { UIcon } from '../icon'
import { useTabsBar } from './use-tabs-bar'

defineOptions({ name: 'TabsHorizontal' })

const props = withDefaults(
  defineProps<{
    /** 组件尺寸 */
    size?: ComponentSize
    /** 当前激活的标签 key */
    modelValue?: string
    /** 标签项 */
    items: TabItem[]
    /** 是否应用圆角 */
    rounded?: boolean
    /** 是否可关闭 */
    closable?: boolean
    /** 是否填充父容器宽度 */
    block?: boolean
    /** 位置 */
    position?: 'top' | 'bottom'
  }>(),
  {
    position: 'top',
    rounded: true,
    closable: false,
    block: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}>()

defineSlots<{
  /** 内容区域（由 UTabs 注入；独立使用时一般留空） */
  default?: () => any
  /** 自定义某个 tab 的名称 */
  [key: `name:${string}`]: () => any
}>()

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('tabs')

const model = defineModel<string>()

const viewportRef = shallowRef<HTMLElement>()
const headerRef = shallowRef<HTMLElement>()

const itemsRef = computed(() => props.items)

const { showNav, canPrev, canNext, scrollByStep } = useTabsBar({
  viewportRef,
  headerRef,
  items: itemsRef,
  model
})

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
</script>
