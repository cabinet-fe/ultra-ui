<template>
  <aside :class="cls.e('form')" v-if="state.formVisible && !!props.model">
    <header :class="cls.e('form-header')">
      <span :class="[cls.e('form-icon'), bem.is(state.formActionType)]">
        <u-icon>
          <component :is="headerInfo.icon" />
        </u-icon>
      </span>
      <div :class="cls.e('form-title')">
        <h3 :class="cls.e('form-title-text')">{{ headerInfo.title }}</h3>
      </div>
      <u-button
        :class="cls.e('form-close')"
        :icon="Close"
        text
        circle
        size="small"
        title="关闭"
        @click="handleClose"
      />
    </header>

    <u-scroll always :class="cls.e('form-body')" :key="bodyKey">
      <transition name="fade" appear mode="out-in">
        <u-form
          ref="formComponentRef"
          :model="props.model"
          :readonly="props.readonly"
          :label-width="props.labelWidth"
          @field:change="handleFieldChange"
        >
          <component
            v-for="value of slots.form?.({
              row: state.row,
              depth: state.depth,
              indexes: state.indexPath,
              index: state.row?.index
            })"
            :is="value"
          />
        </u-form>
      </transition>
    </u-scroll>

    <footer :class="cls.e('form-footer')">
      <span :class="cls.e('form-hint')">
        <template v-if="props.readonly"> 只读模式 </template>

        <span :class="{ [bem.is('concealed')]: !focused }">
          <template v-if="!(state.formActionType === 'update' && props.quickEdit)">
            <u-kbd>Ctrl + S</u-kbd> 保存 ·
          </template>
          <u-kbd>Esc</u-kbd> 关闭
        </span>
      </span>

      <div :class="cls.e('form-actions')">
        <u-button text :loading="state.loading" @click="handleClose"> 取消 </u-button>
        <u-button v-if="showSaveBtn" type="primary" :loading="state.loading" @click="handleSave">
          保存
        </u-button>
      </div>
    </footer>
  </aside>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, shallowRef, toRef } from 'vue'

import type { BatchEditSlots } from '../../types'
import type { _FormExposed, FormExposed } from '../../types/form'
import { UButton } from '../button'
import { UForm } from '../form'
import { UIcon } from '../icon'
import { UKbd } from '../kbd'
import { UScroll } from '../scroll'
import { BatchEditDIKey } from './di'
import { FORM_ACTION_HEADER_MAP } from './form-action-header'

defineOptions({ name: 'BatchEditForm' })

defineProps<{ slots: BatchEditSlots }>()

const batchEditCtx = inject(BatchEditDIKey)!

const { cls, props, state, handleClose, handleSave, staticFeatures, dynamicFeatures } = batchEditCtx

const focused = toRef(batchEditCtx, 'focused')

const formComponentRef = shallowRef<FormExposed>()

defineExpose<_FormExposed>({
  el: toRef(() => formComponentRef.value?.el),
  validate: () => formComponentRef.value?.validate() ?? Promise.resolve(true),
  clearValidate: () => formComponentRef.value?.clearValidate(),
  reset: () => formComponentRef.value?.reset()
})

function handleFieldChange(field: string, value: any) {
  if (state.row && props.quickEdit) {
    o(state.row.data).set(field, value)
  }
}

const creatable = computed(() => {
  if (state.formActionType !== 'create') return false
  return staticFeatures.value.has('create') || dynamicFeatures.value.create?.(state.row)
})

const creatableChild = computed(() => {
  if (state.formActionType !== 'createChild') return false
  return staticFeatures.value.has('createChild') || dynamicFeatures.value.createChild?.(state.row)
})

const updatable = computed(() => {
  if (state.formActionType !== 'update') return false
  return staticFeatures.value.has('update') || dynamicFeatures.value.update?.(state.row)
})

const showSaveBtn = computed(() => {
  if (props.readonly) return false
  if (props.quickEdit && state.formActionType === 'update') return false
  return creatable.value || updatable.value || creatableChild.value
})

const headerInfo = computed(() => FORM_ACTION_HEADER_MAP[state.formActionType])

/** 通过 row 切换 / 类型切换驱动表单内容淡出淡入 */
const bodyKey = computed(() => {
  return `${state.formActionType}-${state.row?.uid ?? 'create'}-${state.parentRow?.uid ?? 'root'}`
})
</script>
