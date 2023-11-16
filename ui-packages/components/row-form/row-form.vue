<template>
  <table :class="cls.b">
    <!-- 表头 start -->
    <row-form-header :columns="modeColumns"></row-form-header>
    <!-- 表头 end -->

    <!-- 表体 start -->
    <tbody :class="cls.e('tbody')">
      <tr
        :class="cls.e('tr')"
        v-for="(dataItem, dataIndex) in data"
        :key="dataIndex"
      >
        <!-- 内容 -->
        <td v-for="(columnsItem, columnsIndex) in columns" :key="columnsIndex">
          <slot
            v-if="dataItem.obj?.edit"
            :name="columnsItem.key"
            :row="dataItem"
          ></slot>
          <span v-else>
            {{ dataItem[columnsItem.key] }}
          </span>
        </td>

        <!-- 操作栏 -->
        <td :class="cls.em('tbody', 'data')">
          <slot name="action">
            {{ dataItem?.obj?.edit }}
            <span @click="onSave(dataItem)">
              {{ dataItem?.obj?.edit ? '保存' : '编辑' }}
            </span>
            <span>插入</span>
            <span @click="onDeleteData(dataIndex)">删除</span>
          </slot>
        </td>
      </tr>
      <!-- 新增 -->
      <tr>
        <td :colspan="columns.length + 1">
          <row-form-button @click="onCreateData">新建</row-form-button>
        </td>
      </tr>
    </tbody>
    <!-- 表体 end -->

    <!-- 表尾 start -->
    <row-form-footer></row-form-footer>
    <!-- 表位 end -->
  </table>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type {
  RowFormProps,
  // RowFormCreate,
  RowFormEmits,
  RowFormRowStatus
} from './row-form.type'

import RowFormHeader from './row-form-header.vue'
// import { obj } from 'cat-kit'
import {
  computed,
  reactive,
  shallowRef,
  watch,
  type ShallowReactive
} from 'vue'
import { obj } from 'cat-kit'
import RowFormButton from './row-form-button.vue'
import RowFormFooter from './row-form-footer.vue'
import { useModel } from '@ui/compositions'
// import { watch } from 'vue'

defineOptions({
  name: 'URowForm'
})

const cls = bem('row-form')

const props = defineProps<RowFormProps<Record<string, any>>>()

const emit = defineEmits<RowFormEmits>()

const finalColumns = computed(() => {
  return [...props.columns]
})

/** 表头 */
let modeColumns = props.columns

/** 和modelValue同步的数组 可以存放modelValue不能存放的状态（编辑，校验） */
const values = shallowRef<any[]>(props.modelValue)

interface Row {
  edited: boolean
  index: number
  data: ShallowReactive<Record<string, any>>
  children: Row[]
  depth: number
}

/** 父组件没修改一次值 就同步一次values */

const data = useModel({ props, emit, local: true })

/** 保存 */

const onSave = (dataItem: Record<string, any>) => {
  dataItem.obj.edit = !dataItem.obj?.edit ?? true
  // validator(dataItem)

  emit('save', obj(dataItem.obj).omit(['edit', 'isValidator']))
  // emit('update:modelValue', reactive([{ aa: 'xxxx' }]))
}

// handler 句柄

/** 校验 */
// const validator = (dataItem: any) => {

// }

/** 点击新增 */
const onCreateData = async () => {
  let obj: RowFormRowStatus = {
    /** 是否可编辑 */
    edit: true,
    /** 是否提示校验 */
    isValidator: false
  }

  data.value = [...(data.value ?? []), obj]

  // let array = [{ edit: true, dd: 'xxx', cc: 'xxx', isValidator: true }]

  // let result = values.filter(item => {
  //   for (let key in obj) {
  //     if (obj[key] !== item[key]) {
  //       return true
  //     }
  //   }
  //   return false
  // })

  // console.log(result)

  // let aa = reactive([{ aa: 111 }])

  // emit('update:modelValue', aa)
}

/** 删除 */
const onDeleteData = async (index: number) => {
  props.modelValue?.splice(index, 1)
}
</script>
<style lang="scss" scoped>
td {
  text-align: center;
  padding: 10px 0;
  min-width: 150px;
}
// m.css-var(color, vars.$color-types)

table thead tr {
  background-color: #008c8c;
  color: #fff;
}

// table tbody tr:nth-child(odd) {
// background-color: #eee;
// }

table tbody tr:hover {
  background-color: #ccc;
}

table tbody tr:last-child:hover {
  background-color: initial;
}

// table tbody tr td:first-child {
//   color: #f40;
// }

table tfoot tr td {
  text-align: right;
  padding-right: 20px;
}
</style>
