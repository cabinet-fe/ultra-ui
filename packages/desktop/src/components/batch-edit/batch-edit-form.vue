<template>
  <!-- 表单常驻挂载（快照只在挂载时对传入的 model 拍一次），仅用 v-show 控制显隐 -->
  <aside :class="cls.e('form')" v-if="!!props.model" v-show="state.formVisible">
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

    <u-scroll always :class="cls.e('form-body')">
      <transition name="fade" appear mode="out-in">
        <u-form
          ref="formComponentRef"
          :model="props.model"
          :readonly="props.readonly"
          :label-width="props.labelWidth"
          @field:change="handleFieldChange"
        >
          <slot
            v-bind="{
              row: state.row,
              parentRow: state.parentRow,
              formActionType: state.formActionType,
              depth: state.depth,
              indexes: state.indexPath,
              index: state.row?.index
            }"
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
        <u-button size="small" text :loading="state.loading" @click="handleClose"> 取消 </u-button>
        <u-button
          v-if="showSaveBtn"
          type="primary"
          size="small"
          title="保存"
          :icon="Save"
          :loading="state.loading"
          @click="handleSave"
        />
      </div>
    </footer>
  </aside>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { Close, Save } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, shallowRef, toRef } from 'vue'

import type { _FormExposed, FormExposed } from '../../types/form'
import { UButton } from '../button'
import { UForm } from '../form'
import { UIcon } from '../icon'
import { UKbd } from '../kbd'
import { UScroll } from '../scroll'
import { BatchEditDIKey } from './di'
import { FORM_ACTION_HEADER_MAP } from './form-action-header'

defineOptions({ name: 'UBatchEditForm' })

const batchEditCtx = inject(BatchEditDIKey)!

const { cls, props, state, handleClose, handleSave, staticFeatures, dynamicFeatures, syncing } =
  batchEditCtx

const focused = toRef(batchEditCtx, 'focused')

const formComponentRef = shallowRef<FormExposed>()

defineExpose<_FormExposed>({
  el: toRef(() => formComponentRef.value?.el),
  validate: () => formComponentRef.value?.validate() ?? Promise.resolve(true),
  clearValidate: () => formComponentRef.value?.clearValidate(),
  reset: () => formComponentRef.value?.reset()
})

function handleFieldChange(field: string, value: any) {
  // 编程方式重置/回显期间不写回行数据，避免默认值污染源数据
  if (syncing.value) return

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
  return (
    staticFeatures.value.has('createChild') || dynamicFeatures.value.createChild?.(state.parentRow)
  )
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
</script>
