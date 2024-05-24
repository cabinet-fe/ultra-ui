<template>
  <div class="wrapper">
    <div class="config">
      <ul>
        <li v-for="item in configList">
          <u-checkbox v-model="config[item.key]"
            >{{ item.label }}：{{ item.key }}</u-checkbox
          >
        </li>
        <li>
          <div>方位：position</div>
          <u-radio-group
            radioType="btn"
            :items="[
              { label: '上', value: 'top' },
              { label: '下', value: 'bottom' },
              { label: '左', value: 'left' },
              { label: '右', value: 'right' }
            ]"
            v-model="config.position"
          />
        </li>
      </ul>
    </div>

    <CustomCard title="使用和插槽的类型提示">
      <u-tabs
        v-model:items="items"
        v-model="active"
        :position="config.position"
        :closable="config.closable"
        :keep-alive="config.keepAlive"
        :style="{
          height: config.fixedHeight ? '300px' : ''
        }"
      >
        <!-- <template v-for="item in items" #[item.name]>{{ item }}</template> -->

        <template #a>
          <CompA />
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
          <div>22</div>
        </template>

        <template #c>
          <CompB />
        </template>

        <template #name:a>666</template>
      </u-tabs>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import CompA from './comp-a.vue'
import CompB from './comp-b.vue'
// let items = ref(['TabOne', 'TabTwo', 'TabThree', 'TabFour'])

let items = shallowRef<
  Array<{ name: string; key: 'a' | 'b' | 'c' | 'dd'; disabled?: boolean }>
>([
  { key: 'a', name: '测试标题1' },
  { key: 'b', name: '测试标题22', disabled: true },
  { key: 'c', name: '测试标题333' },
  { key: 'dd', name: '测试标题4444' }
])

const active = ref<string>('a')

const count = ref(0)

const configList = [
  { label: '可关闭', key: 'closable' },
  { label: '保活', key: 'keepAlive' },
  { label: '固定高度', key: 'fixedHeight' }
  // { label: '排序', key: 'sortable' }
]
const config = reactive({
  closable: false,
  sortable: false,
  keepAlive: false,
  position: 'top' as any,
  fixedHeight: false
})
</script>

<style lang="scss" scoped>
.wrapper {
  .config {
    border: 1px dashed #eee;
  }
  .display {
    width: 600px;
    height: 400px;
    border: 1px solid gold;
  }
  .title {
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    line-height: 50px;
  }
}
</style>
