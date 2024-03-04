<template>
  <div class="box">
    删除和插入请右击
    <u-button @click="getValues">123</u-button>
    <u-row-form ref="rowFormRef" :columns="columns" v-model="modelValue">
      <template #dd="{ row }">
        <u-input v-model="row.dd" />
      </template>

      <template #ff="{ row }">
        <u-input v-model="row.ff" />
      </template>

      <template #kk="{ row }">
        <u-input v-model="row.kk" />
      </template>
    </u-row-form>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue'
import { reactive, shallowRef } from 'vue'

const rowFormRef = shallowRef()

const columns = shallowRef([
  { key: 'dd', name: '回家' },
  { key: 'ff', name: '抢不到票' },
  { key: 'gg', name: '秒无' },
  { key: 'kk', name: '2024新年好' }
])

const modelValue = reactive([
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

const getValues = () => {
  console.log(rowFormRef.value.getValue())
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
