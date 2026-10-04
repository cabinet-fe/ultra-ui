<template>
  <div :class="[cls.b, cls.m(size)]">
    <div :class="cls.e('header')">
      <u-checkbox
        :model-value="allChecked"
        :indeterminate="indeterminate"
        :disabled="disabled || !selectable.length"
        @update:model-value="handleCheckAll"
      />

      <span :class="cls.e('title')">{{ title }}</span>

      <span :class="cls.e('count')">{{ checkedCount }}/{{ options.length }}</span>
    </div>

    <div v-if="filterable" :class="cls.e('filter')">
      <input
        v-model="query"
        :class="cls.e('filter-input')"
        :placeholder="placeholder"
        :disabled="disabled"
      />
    </div>

    <ul v-if="filtered.length" :class="cls.e('body')">
      <li
        v-for="option of filtered"
        :key="option.key"
        :class="[cls.e('item'), bem.is('disabled', disabled || option.disabled)]"
        @click="handleItemClick(option)"
      >
        <u-checkbox
          :model-value="checkedKeys.has(option.key)"
          :disabled="disabled || option.disabled"
          @update:model-value="emit('check', option.key, $event)"
          @click.stop
        />

        <span :class="cls.e('item-label')">{{ option.label }}</span>
      </li>
    </ul>

    <div v-else :class="cls.e('empty')">
      <u-empty />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentSize } from '@veltra/utils'
import { bem } from '@veltra/utils'
import { computed, ref } from 'vue'

import type { TransferOption } from '../../types'
import { UCheckbox } from '../checkbox'
import { UEmpty } from '../empty'

defineOptions({ name: 'TransferList' })

const {
  title = '',
  options = [],
  checkedKeys,
  filterable = false,
  placeholder = '',
  disabled = false,
  size = 'default'
} = defineProps<{
  /** 栏标题 */
  title?: string
  /** 本栏选项 */
  options?: TransferOption[]
  /** 两栏共用的勾选 key 集合 */
  checkedKeys: Set<string | number>
  /** 是否显示搜索框 */
  filterable?: boolean
  /** 搜索框占位符 */
  placeholder?: string
  /** 是否禁用整栏 */
  disabled?: boolean
  /** 组件尺寸 */
  size?: ComponentSize
}>()

const emit = defineEmits<{
  (e: 'check', key: string | number, checked: boolean): void
  (e: 'check-all', keys: Array<string | number>, checked: boolean): void
}>()

const cls = bem('transfer-list')

const query = ref('')

/** 搜索只作用于本栏，按 label 匹配 */
const filtered = computed(() => options.filter((o) => o.label.includes(query.value)))
const selectable = computed(() => filtered.value.filter((o) => !o.disabled))

const allChecked = computed(
  () => selectable.value.length > 0 && selectable.value.every((o) => checkedKeys.has(o.key))
)

const indeterminate = computed(() => {
  const count = selectable.value.filter((o) => checkedKeys.has(o.key)).length
  return count > 0 && !allChecked.value
})

const checkedCount = computed(() => options.filter((o) => checkedKeys.has(o.key)).length)

function handleCheckAll(checked: boolean) {
  const keys = checked
    ? selectable.value.map((o) => o.key)
    : filtered.value.filter((o) => checkedKeys.has(o.key)).map((o) => o.key)
  emit('check-all', keys, checked)
}

function handleItemClick(option: TransferOption) {
  if (disabled || option.disabled) return
  emit('check', option.key, !checkedKeys.has(option.key))
}
</script>
