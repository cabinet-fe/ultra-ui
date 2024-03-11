<template>
  <div>
    {{ data }}

    <u-form label-width="100px" :use="form.key" no-tips>
      <u-input field="aa" label="测试a" tips="提示" />
      <u-input field="bb" label="测试b" tips="提示" />
      <u-input field="cc" label="测试c" tips="提示" />
      <u-input field="dd" label="测试d" tips="提示" />
    </u-form>

    <u-button @click="() => c.log(form.validate())">校验</u-button>

    <u-dialog>
      <u-form></u-form>
    </u-dialog>

    <div ref="previewRef"></div>
  </div>
</template>

<script lang="ts" setup>
import { useForm } from 'ultra-ui/components'

const [data, form] = useForm('form', {
  aa: {
    value: '',
    required: true
  },

  bb: {},
  cc: {},
  dd: {}
})
</script>
