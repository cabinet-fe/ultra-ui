<template>
  <u-card :class="cls.e('form')" v-if="state.visible && !!props.model">
    <u-card-header>
      <template v-if="props.readonly">详情</template>
      <template v-else-if="!!state.parentRow">新增子级</template>
      <template v-else-if="state.type === 'create'">新增</template>
      <template v-else-if="state.type === 'update'">编辑</template>
    </u-card-header>

    <transition name="fade" appear mode="out-in">
      <u-scroll always :class="cls.e('form-wrap')">
        <u-form
          :model="props.model"
          :readonly="props.readonly"
          @keyup.enter="handleSave"
          :label-width="props.labelWidth"
        >
          <template #default="{ data, model }">
            <slot
              v-bind="{
                data,
                model,
                row: state.row,
                indexes: insertIndexes,
                index: state.row?.index
              }"
            />
          </template>
        </u-form>
      </u-scroll>
    </transition>

    <u-card-action :class="cls.e('action')">
      <u-button
        text
        type="primary"
        :loading="state.loading"
        @click="handleClose"
      >
        关闭
      </u-button>
      <u-button
        v-if="!props.readonly && !quickEdit"
        :type="state.type === 'create' ? 'success' : 'primary'"
        :loading="state.loading"
        @click="handleSave"
      >
        确认{{ state.type === 'create' ? '新增' : '修改' }}
      </u-button>
    </u-card-action>
  </u-card>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { UForm } from '../form'
import { UCard, UCardAction, UCardHeader } from '../card'
import { BatchEditDIKey } from './di'
import { UScroll } from '../scroll'
import { UButton } from '../button'

defineOptions({
  name: 'BatchEditForm'
})

const { cls, props, state, insertIndexes, handleSave, handleClose, quickEdit } =
  inject(BatchEditDIKey)!
</script>
