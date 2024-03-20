<template>
  <div>
    <div>
      删除和插入请右击
      <u-button @click="handleGetValue">获取数据</u-button>
      <u-button @click="toggleColumns">切换columns</u-button>
      <u-button @click="addInfo">添加数据</u-button>
      <u-button @click="handleValidate">校验</u-button>
      <!-- {{ columns }} -->
      {{ modelValue }}
      <u-row-form
        style="margin-top: 10px"
        ref="rowFormRef"
        :columns="columns"
        v-model="modelValue"
        @update:model-value=""
      >
        <template #header>
          <u-input />
        </template>

        <template #column:dd="{ data }">
          <u-input v-model="data.kk" @update:model-value="c.log(modelValue)" />
        </template>

        <template #column:ff="{ data }">
          <u-input v-model="data.ff" />
        </template>

        <template #column:kk="{ data }">
          <u-input v-model="data.kk" />
        </template>
      </u-row-form>
    </div>

    <div style="margin-top: 10px">
      <div>禁用</div>
      <u-row-form
        style="margin-top: 10px"
        :columns="columns"
        v-model="modelDisabledValue"
        :disabled="true"
      >
        <template #columns.dd="{ data }">
          <u-input v-model="data.dd" />
        </template>

        <template #columns.ff="{ data }">
          <u-input v-model="data.ff" />
        </template>
      </u-row-form>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { defineRowFormColumns } from 'ultra-ui'
import { onMounted, ref } from 'vue'
import { shallowRef } from 'vue'

const rowFormRef = shallowRef()

let columns = defineRowFormColumns([
  { key: 'dd', name: '1', rules: { required: true } },
  { key: 'ff', name: '2' },
  { key: 'gg', name: '3' },
  { key: 'kk', name: '4' }
])

let modelValue = shallowRef([
  {
    dd: '第一条',
    ff: '333',
    // children: [{ dd: '树形结构', ff: '123123', ll: '1223', gg: '123' }]
  },
  { dd: '第二条', ff: '123213' },
  {
    dd: '第三条',
    ff: '123213',
    ll: 123123,
    gg: '测试不写插槽',
    kk: '新年好'
  }
])

const modelDisabledValue = shallowRef([
  { dd: 'dd', ff: '2' },
  { dd: '第二条', ff: '123213' }
])

const handleGetValue = () => {
  console.log(rowFormRef.value.getValue())
}

const toggleColumns = () => {
  columns.value = [
    ...columns.value,
    { name: Math.random() + '', key: Date.now() + '' }
  ]

  console.log(columns.value, 'columns')
}

const addInfo = () => {
  modelValue.value = [
    ...modelValue.value,
    {
      dd: '第三条',
      ff: '123213',
      ll: 123123,
      gg: '测试不写插槽',
      kk: '新年好'
    }
  ]

  // console.log(modelValue.value, ' modelValue.value')
}

/** 校验 */
const handleValidate = () => {
  console.log(rowFormRef.value.validate())
}

onMounted(() => {
  // getValues()
})
</script>
<style scoped lang="scss">
.box {
  width: 1000px;
}
</style>
