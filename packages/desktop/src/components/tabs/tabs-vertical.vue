<template>
  <div
    :class="[
      cls.b,
      cls.m(position!),
      cls.m(size),
      bem.is('not-rounded', !rounded),
      bem.is('bar-only', !$slots.default)
    ]"
  >
    <ul :class="[cls.e('header'), cls.em('header', position!)]">
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

    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'

import type { ComponentSize, TabItem } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'TabsVertical' })

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
    /** 位置 */
    position?: 'left' | 'right'
  }>(),
  {
    position: 'left',
    rounded: true,
    closable: false
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
