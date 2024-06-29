<template>
  <div>
    <div>
      方向:
      <u-radio-group :items="directions" v-model="direction"> </u-radio-group>
    </div>
    <div>
      对齐: <u-radio-group :items="aligns" v-model="alignment"> </u-radio-group>
    </div>
    <div>
      触发方式:
      <u-radio-group :items="triggers" v-model="trigger"> </u-radio-group>
    </div>
    <div>内容: <u-textarea v-model="content" /></div>
    <CustomCard title="基础用法">
      <u-tip
        :direction="direction"
        :alignment="alignment"
        :trigger="trigger"
        :content="content"
      >
        <u-button>触发</u-button>
      </u-tip>

      <u-tip
        :direction="direction"
        :alignment="alignment"
        :trigger="trigger"
        :content="content"
      >
        <u-button>触发2</u-button>
      </u-tip>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import type { TipAlign, TipDirection } from 'ultra-ui/types'

const directions = ['top', 'bottom', 'left', 'right'].map(d => ({
  label: d,
  value: d
}))
const aligns = ['start', 'center', 'end'].map(d => ({
  label: d,
  value: d
}))
const triggers = ['hover', 'click'].map(d => ({
  label: d,
  value: d
}))

const content = shallowRef(
  '提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容'
)
const direction = shallowRef<TipDirection>('top')
const alignment = shallowRef<TipAlign>('center')
const trigger = shallowRef<'hover' | 'click'>('hover')
</script>

<style lang="scss" scoped>
.color-red {
  color: red;
}

.flex-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.flex-column {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-around;
}
.tip-box {
  h4 {
    text-align: center;
    padding-bottom: 20px;
  }
}
.tip-row {
  padding: 0 20px;
  .u-tip:nth-child(1) {
    margin-left: 50px;
  }
  .u-tip:nth-child(3) {
    margin-right: 50px;
  }
}
.tip-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tip-column {
  width: max-content;
  padding: 10px 0;
  .u-tip {
    margin: 20px 0;
  }
}
.pd20 {
  margin-bottom: 80px;
}

.anime-test {
  display: none;
  opacity: 0;
}
</style>
