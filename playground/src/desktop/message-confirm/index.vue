<template>
  <u-card class="panel">
    <u-card-header>消息确认</u-card-header>
    <u-card-content>
      <u-form class="fields" :model="config" :cols="2" label-position="top" no-tips>
        <u-input label="标题" field="title" placeholder="可留空" />
        <u-input label="内容" field="message" placeholder="确认文案" />
        <u-input label="确认按钮" field="confirmButtonText" />
        <u-input label="取消按钮" field="cancelButtonText" placeholder="留空则不显示" />
        <u-radio-group
          label="确认按钮类型"
          field="confirmButtonType"
          span="full"
          :items="buttonTypes"
        />
      </u-form>
    </u-card-content>
    <u-card-action align-right>
      <u-button plain type="danger" @click="showDanger">危险确认</u-button>
      <u-button type="primary" @click="showMsg">打开确认框</u-button>
    </u-card-action>
  </u-card>
</template>

<script setup lang="ts">
import {
  messageConfirm,
  UButton,
  UCard,
  UCardAction,
  UCardContent,
  UCardHeader,
  UForm,
  UInput,
  URadioGroup
} from '@veltra/desktop'
import type { ColorType } from '@veltra/desktop'
import { reactive } from 'vue'

const buttonTypes = [
  { label: 'primary', value: 'primary' },
  { label: 'info', value: 'info' },
  { label: 'success', value: 'success' },
  { label: 'warning', value: 'warning' },
  { label: 'danger', value: 'danger' }
]

const config = reactive({
  confirmButtonType: 'primary' as ColorType,
  title: '确认操作',
  message: '此操作执行后无法撤销，确定继续吗？',
  confirmButtonText: '确定',
  cancelButtonText: '取消'
})

const showMsg = () => {
  messageConfirm({
    title: config.title,
    message: config.message,
    confirmButtonType: config.confirmButtonType,
    confirmButtonText: config.confirmButtonText,
    cancelButtonText: config.cancelButtonText,
    onClose: (action) => {
      console.log('onClose:', action)
    }
  }).onClosed.then((action) => {
    console.log('onClosed:', action)
  })
}

const showDanger = () => {
  messageConfirm
    .danger('确认删除该文件吗？此操作不可撤销', { cancelButtonText: '取消' })
    .onClosed.then((action) => {
      console.log('danger closed:', action)
    })
}
</script>

<style lang="scss" scoped>
@use 'pkg:@veltra/styles/functions' as fn;

.panel {
  max-width: 640px;
}

.fields {
  row-gap: calc(#{fn.use-var(gap, default)} * 2);
}
</style>
