<template>
  <u-dropdown
    v-if="!readonly"
    :class="[
      cls.b,
      bem.is('disabled', disabled),
      bem.is('multiple', multiple),
      cls.m(size)
    ]"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    trigger="click"
    ref="dropdownRef"
    :disabled="disabled"
    :width="panelDataList.length ? 'auto' : ''"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
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
      <template v-if="multiple">
        <div v-if="modelValue" :class="cls.e('tags')">
          <u-tag
            v-for="tag of tags"
            :key="tag[valueKey]"
            :closable="!disabled"
            @close="handleCloseTag(tag)"
          >
            {{ getChainValue(tag, labelKey!) }}
          </u-tag>
          <u-tag v-if="restTag"> {{ restTag }}+ </u-tag>
        </div>

        <transition name="zoom-in" mode="out-in">
          <u-icon
            v-if="clearable && modelValue?.length && hovered && !disabled"
            :class="cls.e('clear')"
            @click.stop="handleClear"
          >
            <Close />
          </u-icon>

          <u-icon :class="cls.e('arrow')" v-else><ArrowDown /></u-icon>
        </transition>
      </template>
    </template>

    <template #content>
      <!-- 过滤 -->
      <div v-if="filterable" :class="[cls.e('panel-filter'), cls.m(size)]">
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
        <UCascadeMenu
          v-for="(data, index) of panelDataList"
          :data="data"
          :value="modelValueNodes[index]"
          @click="$event => handleMenuItemClick(index, $event)"
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
import {
  computed,
  nextTick,
  provide,
  shallowRef,
  triggerRef,
  watchEffect
} from 'vue'
import { ArrowDown, Search, Close } from 'icon-ultra'
import { CascadeDIKey } from './di'
import { UInput } from '../input'
import { UTag } from '../tag'
import { UIcon } from '../icon'
import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import UCascadeMenu from './cascade-menu.vue'
import { getChainValue, Tree } from 'cat-kit/fe'

defineOptions({
  name: 'Cascade'
})

const props = withDefaults(defineProps<CascadeProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: 'children',
  filterable: false,
  data: () => [],
  visibilityLimit: 3
})

const emit = defineEmits<CascadeEmits>()

const cls = bem('cascade')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const dropdownRef = shallowRef<DropdownExposed>()

const dataMap = new Map<string, Record<string, any>>()

// 面板数据
const panelDataList = shallowRef<Record<string, any>[][]>([])

watchEffect(() => {
  props.data &&
    props.data.forEach(item => {
      Tree.dft(item, item => {
        const value = getChainValue(item, props.valueKey)
        if (value !== null && value !== undefined) {
          dataMap.set(value, item)
        }
      })
    })
})

/** 单选时，值的节点数据 */
const modelValueNodes = shallowRef<any[]>([])

let modelChangedByUser = false

watchEffect(() => {
  const { modelValue, multiple, data } = props
  if (modelChangedByUser) return

  if (!multiple && typeof modelValue === 'string') {
    const nodes = modelValue.split('/')
    modelValueNodes.value = nodes
    console.log(
      nodes.slice(0, -1).map(v => {
        return getChainValue(dataMap.get(v)!, props.childrenKey)
      })
    )
    panelDataList.value = [
      props.data,
      ...nodes.slice(1).map(v => {
        return getChainValue(dataMap.get(v)!, props.childrenKey)
      })
    ]
  } else if (multiple && Array.isArray(modelValue)) {
    modelValueNodes.value = modelValue
    panelDataList.value = [props.data]
  }
})

function handleMenuItemClick(menuIndex: number, item: Record<string, any>) {
  const { checkStrictly, valueKey, childrenKey } = props

  modelChangedByUser = true

  const children = getChainValue(item, childrenKey)

  if (children?.length) {
    panelDataList.value[menuIndex + 1] = children
  }
  panelDataList.value.splice(menuIndex + 2)

  modelValueNodes.value[menuIndex] = getChainValue(item, valueKey)
  modelValueNodes.value.splice(menuIndex + 1)

  triggerRef(panelDataList)
  triggerRef(modelValueNodes)

  const modelValue = modelValueNodes.value.join('/')

  if (!checkStrictly) {
    emit('update:modelValue', modelValue)
  } else if (!children?.length) {
    emit('update:modelValue', modelValue)
  }

  nextTick(() => {
    dropdownRef.value?.updateDropdown()
    modelChangedByUser = false
  })
}

// 过滤
const qs = shallowRef<string>('')

// 多选
const hovered = shallowRef(false)

const tags = computed(() => {
  const { modelValue, multiple } = props
  let tags: Record<string, any>[] = []

  if (!multiple || !Array.isArray(modelValue)) return tags

  let { visibilityLimit } = props
  if (visibilityLimit < 0) {
    visibilityLimit = 0
  }

  // 禁用时，显示全部
  if (disabled.value || readonly.value) {
    visibilityLimit = props.modelValue?.length ?? 0
  }

  modelValue.slice(0, visibilityLimit).forEach(k => {
    // const option = optionsMap.value.get(k)
    // option && tags.push(option)
  })

  return tags
})

const restTag = computed(() => {
  const { visibilityLimit, modelValue } = props
  return (modelValue?.length ?? 0) - visibilityLimit
})

function handleCloseTag(tag: Record<string, any>) {}

function handleClear() {}

provide(CascadeDIKey, {
  cls,
  size,
  disabled,
  readonly,
  cascadeProps: props
})
</script>
