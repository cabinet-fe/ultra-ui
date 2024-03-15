<template>
  <div>
    <div>
      删除和插入请右击
      <u-button @click="getValues">获取数据</u-button>
      <u-button @click="toggleColumns">切换columns</u-button>
      <u-button @click="addInfo">添加数据</u-button>
      <u-button @click=""></u-button>
      <!-- {{ columns }} -->
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

        <template #dd="{ data }">
          <u-input v-model="data.dd" />
        </template>

        <template #ff="{ data }">
          <u-input v-model="data.ff" />
        </template>

        <template #kk="{ data }">
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
        <template #dd="{ data }">
          <u-input v-model="data.dd" />
        </template>

        <template #ff="{ data }">
          <u-input v-model="data.ff" />
        </template>
      </u-row-form>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, shallowReactive } from 'vue'
import { shallowRef, reactive } from 'vue'

const rowFormRef = shallowRef()

const columns = shallowRef([
  { key: 'dd', name: '1', rules: { required: true } },
  { key: 'ff', name: '2' },
  { key: 'gg', name: '3' },
  { key: 'kk', name: '4' }
])

let modelValue = shallowRef([
  { dd: '第一条', ff: '333' },
  { dd: '第二条', ff: '123213' },
  {
    dd: '第三条',
    ff: '123213',
    ll: 123123,
    gg: '测试不写插槽',
    kk: '新年好',
    children: [{ dd: '树形结构', ff: '123123', ll: '1223', gg: '123' }]
  }
])

const modelDisabledValue = shallowRef([
  { dd: 'dd', ff: '2' },
  { dd: '第二条', ff: '123213' }
])

const getValues = () => {
  console.log(rowFormRef.value.getValue())
}

const toggleColumns = () => {
  columns.value = [
    ...columns.value,
    { name: Math.random() + '', key: Date.now() + '' }
  ]
}

const addInfo = () => {
  modelValue.value.push({
    dd: '第三条',
    ff: '123213',
    ll: 123123,
    gg: '测试不写插槽',
    kk: '新年好',
    children: [{ dd: '树形结构', ff: '123123', ll: '1223', gg: '123' }]
  })

  // console.log(modelValue.value, ' modelValue.value')
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
