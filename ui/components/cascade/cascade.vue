<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled), cls.m(size)]"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    trigger="click"
    ref="dropdownRef"
    :disabled="disabled"
    :width="panelDataList.length ? 'auto' : ''"
  >
    <template #trigger>
      <!-- 单选展示 -->
      <u-input
        v-if="!multiple"
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        native-readonly
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>

      <!-- 多选展示 -->
    </template>

    <template #content>
      <!-- 过滤 -->
      <div v-if="filterable" :class="[cls.e('content-filter'), cls.m(size)]">
        <u-input
          placeholder="输入关键字进行过滤"
          v-model="qs"
          :size="size"
          :clearable="false"
        >
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <div :class="cls.e('content')" v-if="panelDataList.length">
        <UCascadePanel
          v-for="(data, index) of panelDataList"
          :key="index"
          :data="data"
          :value="valueNodes[index]"
          @expand="setPanelData(index, $event)"
        />
      </div>

      <div :class="cls.e('empty')" v-else>
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <div :class="[cls.m(size)]">
    <div :class="cls.e('tags')">
      <u-tag> </u-tag>
    </div>
  </div>

  <!-- <span v-else>{{ FORM_EMPTY_CONTENT }}</span> -->
</template>

<script lang="ts" setup generic="Multiple extends boolean">
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type { CascadeProps, CascadeEmits, DropdownExposed } from '@ui/types'
import { bem } from '@ui/utils'
import { computed, provide, shallowRef, triggerRef, watchEffect } from 'vue'
import { ArrowDown, Search } from 'icon-ultra'
import { CascadeDIKey } from './di'
import { UInput } from '../input'
import { UTag } from '../tag'
import { UIcon } from '../icon'
import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import UCascadePanel from './cascade-panel.vue'

defineOptions({
  name: 'Cascade'
})

const cls = bem('cascade')

const emit = defineEmits<CascadeEmits>()

const props = withDefaults(defineProps<CascadeProps<Multiple>>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: 'children',
  filterable: false,
  options: () => [],
  visibilityLimit: 3
})

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const panelDataList = shallowRef<Record<string, any>[][]>([props.options])

function setPanelData(index: number, item: Record<string, any>) {
  if (item.children?.length) {
    panelDataList.value[index + 1] = item.children
  }
  panelDataList.value.splice(index + 2, 1)
  triggerRef(panelDataList)
}

watchEffect(() => {
  panelDataList.value = [props.options]
})

const valueNodes = computed(() => {
  const { multiple, modelValue } = props
  if (multiple || !modelValue || typeof modelValue !== 'string') return []

  return (props.modelValue as string)?.split('/') ?? []
})

const qs = shallowRef<string>('')

const dropdownRef = shallowRef<DropdownExposed>()

provide(CascadeDIKey, {
  cls,
  size,
  disabled,
  readonly,
  cascadeProps: props
})
</script>
