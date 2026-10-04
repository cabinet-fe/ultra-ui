<template>
  <div :class="[cls.b, cls.m(size), bem.is('disabled', disabled || readonly)]">
    <u-transfer-list
      :title="titles[0]"
      :options="sourceOptions"
      :checked-keys="checkedSet"
      :filterable="filterable"
      :placeholder="filterPlaceholder[0]"
      :disabled="disabled || readonly"
      :size="size"
      @check="handleCheck"
      @check-all="handleCheckAll"
    />

    <div :class="cls.e('buttons')">
      <u-button
        :icon="ArrowRight"
        circle
        :disabled="disabled || readonly || !checkedSourceKeys.length"
        @click="moveTo('right')"
      />

      <u-button
        :icon="ArrowLeft"
        circle
        :disabled="disabled || readonly || !checkedTargetKeys.length"
        @click="moveTo('left')"
      />
    </div>

    <u-transfer-list
      :title="titles[1]"
      :options="targetOptions"
      :checked-keys="checkedSet"
      :filterable="filterable"
      :placeholder="filterPlaceholder[1]"
      :disabled="disabled || readonly"
      :size="size"
      @check="handleCheck"
      @check-all="handleCheckAll"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { ArrowLeft, ArrowRight } from '@veltra/icons/normal'
import { bem, injectFormContext } from '@veltra/utils'
import { computed, shallowReactive, watch } from 'vue'

import type { TransferDirection, TransferEmits, TransferProps } from '../../types'
import { UButton } from '../button'
import UTransferList from './transfer-list.vue'

defineOptions({ name: 'UTransfer' })

const props = defineProps<TransferProps>()

const emit = defineEmits<TransferEmits>()

const cls = bem('transfer')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const model = defineModel<Array<string | number>>({ default: () => [] })

/** 数据源，两栏共用；未传时按空列表处理 */
const dataSource = computed(() => props.dataSource ?? [])

/** 栏标题，未传时用默认文案 */
const titles = computed<[string, string]>(() => props.titles ?? ['源列表', '目标列表'])

/** 搜索框占位符，未传时用默认文案 */
const filterPlaceholder = computed<[string, string]>(
  () => props.filterPlaceholder ?? ['请输入搜索内容', '请输入搜索内容']
)

/** 两栏共用的勾选 key 集合，移动后清空 */
const checkedSet = shallowReactive<Set<string | number>>(new Set())

const targetKeySet = computed(() => new Set(model.value))

/** 两栏按 data-source 出现顺序各取一半 */
const sourceOptions = computed(() => dataSource.value.filter((o) => !targetKeySet.value.has(o.key)))
const targetOptions = computed(() => dataSource.value.filter((o) => targetKeySet.value.has(o.key)))

const checkedSourceKeys = computed(() =>
  Array.from(checkedSet).filter((key) => !targetKeySet.value.has(key))
)
const checkedTargetKeys = computed(() =>
  Array.from(checkedSet).filter((key) => targetKeySet.value.has(key))
)

/** 数据源或绑定值外部变化后，清掉已不在数据源里的残留勾选 */
watch([dataSource, model], () => {
  const keys = new Set(dataSource.value.map((o) => o.key))
  for (const key of checkedSet) {
    if (!keys.has(key)) checkedSet.delete(key)
  }
})

const handleCheck = (key: string | number, checked: boolean) => {
  if (checked) {
    checkedSet.add(key)
  } else {
    checkedSet.delete(key)
  }
}

const handleCheckAll = (keys: Array<string | number>, checked: boolean) => {
  keys.forEach((key) => (checked ? checkedSet.add(key) : checkedSet.delete(key)))
}

const moveTo = (direction: TransferDirection) => {
  const movedKeys = direction === 'right' ? checkedSourceKeys.value : checkedTargetKeys.value
  if (!movedKeys.length) return

  const movedSet = new Set(movedKeys)
  const targetKeys =
    direction === 'right'
      ? [...model.value, ...movedKeys]
      : model.value.filter((key) => !movedSet.has(key))

  model.value = targetKeys
  checkedSet.clear()
  emit('change', targetKeys, direction, movedKeys)
}
</script>
