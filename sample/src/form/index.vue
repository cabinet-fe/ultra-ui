<template>
  <div>
    <u-radio-group :data="sizeOptions" v-model="size" />

    <u-checkbox v-model="disabled"> 禁用 </u-checkbox>

    <u-checkbox v-model="readonly"> 只读 </u-checkbox>

    <u-form
      :size="size"
      :disabled="disabled"
      :readonly="readonly"
      :model="model"
      label-width="100px"
    >
      <u-input field="name" label="姓名" tips="四个字以内" />
      <u-number-input field="age" label="年龄" />
      <u-number-input field="debt" currency label="借款" :step="1" />
      <u-input field="phone" label="手机" />
      <u-input field="email" label="邮箱" />
    </u-form>

    <u-button @click="model.validate()">校验</u-button>
    <u-button @click="model.clearValidate()">重置</u-button>

    {{ model.data }}

    <ul class="list" ref="sortRef">
      <li
        class="list-item"
        :class="index % 2 ? 'odd' : 'even'"
        v-for="(item, index) in list"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {  type ComponentSize } from 'ultra-ui'
import { field, FormModel } from 'ultra-ui/components'
import { shallowRef } from 'vue'
import { useSort } from './use-sort'

const readonly = shallowRef(false)
const disabled = shallowRef(false)
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'default' },
  { label: '大', value: 'large' }
]

const model = new FormModel({
  name: { maxLen: 4, required: true },
  age: field<string>({ required: '年龄是必填的' }),
  aa: { required: true },
  phone: {
    validator(value) {
      if (!value) return ''
      if (/^1[1-9]{10}$/.test(value)) return ''
      return '你得输入一个手机号'
    }
  },
  debt: {},
  email: {
    match: [
      /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
      '这个时候你得输入一个邮箱'
    ]
  }
})

const sortRef = shallowRef()
const list = shallowRef(Array.from({ length: 10 }).map(() => Math.random()))

const size = shallowRef<ComponentSize>('default')

useSort({
  target: sortRef,
  onChange() {}
  // disabled: 'odd'
})
</script>

<style scoped lang="scss">
.list {
  border: 1px solid #eee;
  margin-top: 100px;
  &-item {
    height: 32px;
    line-height: 32px;
    padding: 0 8px;
    border-bottom: 1px solid #eee;
    cursor: default;
    background-color: #fff;
    user-select: none;

    &:last-child {
      border: none;
    }

    transition: transform 0.25s;
  }
}
</style>
