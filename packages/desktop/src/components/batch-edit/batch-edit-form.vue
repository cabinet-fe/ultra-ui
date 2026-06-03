<template>
  <aside :class="cls.e('form')" v-if="state.visible && !!props.model">
    <header :class="cls.e('form-header')">
      <span :class="[cls.e('form-icon'), bem.is(headerInfo.tone)]">
        <u-icon>
          <component :is="headerInfo.icon" />
        </u-icon>
      </span>
      <div :class="cls.e('form-title')">
        <h3 :class="cls.e('form-title-text')">{{ headerInfo.title }}</h3>
        <span v-if="headerInfo.chip" :class="cls.e('form-chip')">
          {{ headerInfo.chip }}
        </span>
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
          :model="props.model"
          :readonly="props.readonly"
          @keydown="handleFormKeydown"
          :label-width="props.labelWidth"
        >
          <template #default="{ data, model }">
            <slot
              v-bind="{
                data,
                model,
                row: state.row,
                depth: state.depth,
                indexes: insertIndexes,
                index: state.row?.index
              }"
            />
          </template>
        </u-form>
      </transition>
    </u-scroll>

    <footer :class="cls.e('form-footer')">
      <span :class="cls.e('form-hint')" v-if="!props.readonly && state.dataUpdated">
        有未保存改动
      </span>
      <span :class="cls.e('form-hint')" v-else-if="!props.readonly">
        <u-kbd>Ctrl + Enter</u-kbd> 保存 · <u-kbd>Esc</u-kbd> 关闭
      </span>
      <span :class="cls.e('form-hint')" v-else>只读模式</span>

      <div :class="cls.e('form-actions')">
        <u-button text :loading="state.loading" @click="handleClose"> 取消 </u-button>
        <u-button
          v-if="!props.readonly && (creatable || updatable)"
          :type="state.type === 'create' ? 'success' : 'primary'"
          :loading="state.loading"
          :disabled="!state.dataUpdated"
          @click="handleSave"
        >
          保存
        </u-button>
      </div>
    </footer>
  </aside>
</template>

<script lang="ts" setup>
import { AddChild, Close, EditPen, Plus, View } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, type Component } from 'vue'

import { UButton } from '../button'
import { UForm } from '../form'
import { UIcon } from '../icon'
import { UKbd } from '../kbd'
import { UScroll } from '../scroll'
import { BatchEditDIKey } from './di'

defineOptions({ name: 'BatchEditForm' })

const {
  cls,
  props,
  state,
  insertIndexes,
  handleSave,
  handleClose,
  staticFeatures,
  dynamicFeatures
} = inject(BatchEditDIKey)!

const creatable = computed(() => {
  return (
    state.type === 'create' &&
    (staticFeatures.value.has('create') || dynamicFeatures.value.create?.(state.row))
  )
})

const updatable = computed(() => {
  return (
    state.type === 'update' &&
    (staticFeatures.value.has('update') || dynamicFeatures.value.update?.(state.row))
  )
})

interface HeaderInfo {
  icon: Component
  title: string
  chip?: string
  tone: 'create' | 'update' | 'view' | 'child'
}

const headerInfo = computed<HeaderInfo>(() => {
  if (props.readonly) {
    return {
      icon: View,
      title: '查看详情',
      chip: state.row ? `第 ${state.row.index + 1} 行` : undefined,
      tone: 'view'
    }
  }
  if (state.parentRow) {
    return {
      icon: AddChild,
      title: '新增子级',
      chip: `归属于第 ${state.parentRow.index + 1} 行`,
      tone: 'child'
    }
  }
  if (state.type === 'create') {
    return { icon: Plus, title: '新增', tone: 'create' }
  }
  return {
    icon: EditPen,
    title: '编辑',
    chip: state.row ? `第 ${state.row.index + 1} 行` : undefined,
    tone: 'update'
  }
})

/** 通过 row 切换 / 类型切换驱动表单内容淡出淡入 */
const bodyKey = computed(() => {
  return `${state.type}-${state.row?.uid ?? 'create'}-${state.parentRow?.uid ?? 'root'}`
})

function handleFormKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSave()
  }
}
</script>
