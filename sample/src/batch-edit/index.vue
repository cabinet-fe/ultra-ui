<template>
  <div>
    <div>
      <u-checkbox v-model="readonly">只读</u-checkbox>
      <u-checkbox v-model="tree">树形</u-checkbox>
      <u-checkbox v-model="resizable">可调节尺寸</u-checkbox>
      <u-checkbox v-model="asynchronous">模拟异步</u-checkbox>
      <u-button @click="dialogVisible = !dialogVisible">弹框中</u-button>
    </div>
    <u-batch-edit
      :columns="columns"
      :readonly="readonly"
      :resizable="resizable"
      v-model:data="data"
      style="height: 400px"
      :model="model"
      :tree="tree"
      cols="1fr 400px"
      :delete-method="asynchronous ? deleteMethod : undefined"
      :save-method="asynchronous ? saveMethod : undefined"
      @created="
        model.setData({
          age: 666
        })
      "
    >
      <template #form="{ data }">
        <u-input field="name" label="名称" />
        <u-number-input field="age" label="年龄" />
        <u-input field="props.label" label="标签" />
        <u-input field="props.field" label="字段" />
        <u-input v-if="!data.age || data.age < 10" field="cc" label="cc" />
        <u-select field="unit" label="单位" :options="units" />
        <u-cascade
          field="cascade"
          label="单选级联选择器"
          :options="cascadeData"
        />
      </template>

      <template #column:v="scope"></template>
    </u-batch-edit>

    <u-dialog style="width: 900px" v-model="dialogVisible" title="字典项">
      <u-batch-edit
        :columns="columns"
        :readonly="readonly"
        :resizable="resizable"
        v-model:data="data"
        style="height: 400px"
        :model="model"
        :tree="tree"
        cols="1fr 1fr"
        :delete-method="asynchronous ? deleteMethod : undefined"
        :save-method="asynchronous ? saveMethod : undefined"
      >
        <template #form="{ data }">
          <u-input field="name" label="名称" />
          <u-number-input field="age" label="年龄" />
          <u-input field="props.label" label="标签" />
          <u-input field="props.field" label="字段" />
          <u-input v-if="!data.age || data.age < 10" field="cc" label="cc" />
          <!-- <u-cascade
            field="cascade"
            label="单选级联选择器"
            :options="cascadeData"
          /> -->
        </template>
      </u-batch-edit>
    </u-dialog>

    {{ data }}
  </div>
</template>

<script lang="ts" setup>
import { sleep } from 'cat-kit/fe'
import { FormModel, Message, defineTableColumns, formField } from 'ultra-ui'
import { shallowRef } from 'vue'
import 'ultra-ui/components/message/style.js'

const readonly = shallowRef(false)
const tree = shallowRef(false)
const resizable = shallowRef(true)
const dialogVisible = shallowRef(false)

const columns = defineTableColumns([
  { name: '名称', key: 'name', rules: { required: true } },
  { name: '年龄', key: 'age', rules: { max: 120 } },
  { name: '单选级联选择器', key: 'cascade' }
])

const data = shallowRef()
// Array.from({ length: 1 }).map((_, i) => ({
//   name: '姓名' + i,
//   age: Math.ceil(Math.random() * 80),
//   id: Math.random()
// }))

const model = new FormModel({
  name: { required: true },
  age: formField<number>({ max: 100 }),
  'props.field': {},
  'props.label': {},
  cc: { required: true },
  cascade: {},
  unit: {}
})

const asynchronous = shallowRef(false)

const deleteMethod = async row => {
  await sleep(2000)
  // await Promise.reject('a')
  Message.success('删除成功')
}

const saveMethod = async (data, type) => {
  await sleep(2000)
  Message.success('保存成功')
}
const units = [
  { label: '单位1', value: '1' },
  { label: '单位2', value: '2' },
  { label: '单位3', value: '3' }
]
const cascadeData = [
  {
    value: 'guide',
    label: 'Guide'
  },
  {
    value: 'component',
    label: 'Component',
    children: [
      {
        value: 'basic',
        label: 'Basic',
        children: [
          {
            value: 'layout',
            label: 'Layout'
          },
          {
            value: 'color',
            label: 'Color'
          },
          {
            value: 'typography',
            label: 'Typography'
          },
          {
            value: 'icon',
            label: 'Icon'
          },
          {
            value: 'button',
            label: 'Button'
          }
        ]
      },
      {
        value: 'form',
        label: 'Form',
        children: [
          {
            value: 'radio',
            label: 'Radio'
          },
          {
            value: 'checkbox',
            label: 'Checkbox'
          },
          {
            value: 'input',
            label: 'Input'
          },
          {
            value: 'input-number',
            label: 'InputNumber'
          },
          {
            value: 'select',
            label: 'Select'
          },
          {
            value: 'cascader',
            label: 'Cascader'
          },
          {
            value: 'switch',
            label: 'Switch'
          },
          {
            value: 'slider',
            label: 'Slider'
          },
          {
            value: 'time-picker',
            label: 'TimePicker'
          },
          {
            value: 'date-picker',
            label: 'DatePicker'
          },
          {
            value: 'datetime-picker',
            label: 'DateTimePicker'
          },
          {
            value: 'upload',
            label: 'Upload'
          },
          {
            value: 'rate',
            label: 'Rate'
          }
        ]
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'table',
            label: 'Table'
          },
          {
            value: 'tag',
            label: 'Tag'
          },
          {
            value: 'progress',
            label: 'Progress'
          },
          {
            value: 'tree',
            label: 'Tree'
          },
          {
            value: 'pagination',
            label: 'Pagination'
          },
          {
            value: 'badge',
            label: 'Badge'
          }
        ]
      },
      {
        value: 'notice',
        label: 'Notice',
        children: [
          {
            value: 'alert',
            label: 'Alert'
          },
          {
            value: 'loading',
            label: 'Loading'
          },
          {
            value: 'message',
            label: 'Message'
          },
          {
            value: 'message-box',
            label: 'MessageBox'
          },
          {
            value: 'notification',
            label: 'Notification'
          }
        ]
      },
      {
        value: 'navigation',
        label: 'Navigation',
        children: [
          {
            value: 'menu',
            label: 'Menu'
          },
          {
            value: 'tabs',
            label: 'Tabs'
          },
          {
            value: 'breadcrumb',
            label: 'Breadcrumb'
          },
          {
            value: 'dropdown',
            label: 'Dropdown'
          },
          {
            value: 'steps',
            label: 'Steps'
          }
        ]
      },
      {
        value: 'others',
        label: 'Others',
        children: [
          {
            value: 'dialog',
            label: 'Dialog'
          },
          {
            value: 'tooltip',
            label: 'Tooltip'
          },
          {
            value: 'popover',
            label: 'Popover'
          },
          {
            value: 'card',
            label: 'Card'
          },
          {
            value: 'carousel',
            label: 'Carousel'
          },
          {
            value: 'collapse',
            label: 'Collapse'
          }
        ]
      }
    ]
  },
  {
    value: 'resource',
    label: 'Resource',
    children: [
      {
        value: 'axure',
        label: 'Axure Components'
      },
      {
        value: 'sketch',
        label: 'Sketch Templates'
      },
      {
        value: 'docs',
        label: 'Design Documentation'
      }
    ]
  }
]
</script>

<style lang="scss" scoped></style>
