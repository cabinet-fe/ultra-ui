<template>
  <div class="box">
    <CustomCard title="基础胶囊">
      <div class="demo-row">
        <u-chip
          v-for="{ label, value } of items"
          :key="value"
          v-model="single"
          name="chip-demo"
          :value="value"
          :disabled="value === '3'"
        >
          {{ label }}
        </u-chip>
      </div>
      <div class="demo-value">当前值：{{ single }}</div>
    </CustomCard>

    <CustomCard title="胶囊单选组">
      <u-chip-group :items="items" v-model="grouped" />
      <div class="demo-value">当前值：{{ grouped }}</div>
    </CustomCard>

    <CustomCard title="不同尺寸 (small / default / large)">
      <div class="demo-section">
        <div class="demo-desc">胶囊</div>
        <div class="demo-col">
          <div class="demo-row">
            <u-chip
              v-for="{ label, value } of items"
              :key="value"
              v-model="sized"
              name="chip-size-small"
              size="small"
              :value="value"
            >
              {{ label }}
            </u-chip>
          </div>
          <div class="demo-row">
            <u-chip
              v-for="{ label, value } of items"
              :key="value"
              v-model="sized"
              name="chip-size-default"
              size="default"
              :value="value"
            >
              {{ label }}
            </u-chip>
          </div>
          <div class="demo-row">
            <u-chip
              v-for="{ label, value } of items"
              :key="value"
              v-model="sized"
              name="chip-size-large"
              size="large"
              :value="value"
            >
              {{ label }}
            </u-chip>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <div class="demo-desc">胶囊单选组</div>
        <div class="demo-col">
          <u-chip-group :items="items" v-model="sized" size="small" />
          <u-chip-group :items="items" v-model="sized" size="default" />
          <u-chip-group :items="items" v-model="sized" size="large" />
        </div>
      </div>
    </CustomCard>

    <CustomCard title="某项禁用">
      <u-chip-group
        :items="items"
        v-model="grouped"
        :disabled-item="(item) => item.value === '2'"
      />
    </CustomCard>

    <CustomCard title="窄容器溢出">
      <div class="demo-desc">
        容器宽 220px。不按 Shift
        滚轮即可横滚，按住拖动也可；点被截断或贴边的纸片会先滚进可视区再选中；方向键在组内移动并露出焦点项。
      </div>
      <div class="overflow-box">
        <u-chip-group :items="many" v-model="overflow" />
      </div>
      <div class="demo-value">当前值：{{ overflow }}</div>
    </CustomCard>

    <CustomCard title="整组禁用">
      <u-chip-group :items="items" v-model="grouped" disabled />
    </CustomCard>

    <CustomCard title="只读">
      <u-chip-group :items="items" v-model="grouped" readonly />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const single = shallowRef('1')
const grouped = shallowRef('1')
const sized = shallowRef('1')
const overflow = shallowRef('north')

const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]

const many = [
  { label: '华北 · 北京', value: 'north' },
  { label: '东北 · 沈阳', value: 'northeast' },
  { label: '华东 · 上海', value: 'east' },
  { label: '华中 · 武汉', value: 'central' },
  { label: '华南 · 广州', value: 'south' },
  { label: '西南 · 成都', value: 'southwest' },
  { label: '西北 · 西安', value: 'northwest' },
  { label: '港澳 · 香港', value: 'hk' }
]
</script>

<style scoped lang="scss">
.demo-desc {
  font-size: 13px;
  color: var(--u-text-color-second);
  margin-bottom: 10px;
}

.demo-section {
  & + & {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--u-border-color);
  }
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.demo-value {
  margin-top: 10px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.overflow-box {
  width: 220px;
  max-width: 100%;
  border: 1px dashed var(--u-border-color);
  border-radius: 8px;
  padding: 8px 0;
}
</style>
