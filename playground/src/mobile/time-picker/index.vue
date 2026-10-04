<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <UTimePicker v-model="base" @change="onChange" />
      <p class="tip">当前值：{{ base ?? '未选择' }}</p>
    </section>

    <section>
      <h3>绑定值类型（dataType）</h3>
      <UTimePicker v-model="str" />
      <UTimePicker v-model="timestamp" data-type="timestamp" />
      <UTimePicker v-model="dateObj" data-type="date" />
      <p class="tip">
        字符串：{{ str ?? '-' }} / 时间戳：{{ timestamp ?? '-' }} / Date：
        {{ dateObj ? dateObj.toISOString().slice(11, 19) : '-' }}
      </p>
    </section>

    <section>
      <h3>禁用时段</h3>
      <UTimePicker
        v-model="limited"
        :disabled-hours="disabledHours"
        :disabled-minutes="disabledMinutes"
        :disabled-seconds="disabledSeconds"
      />
      <p class="tip">禁用小时 0~5 与 18~23；小时为 8 时禁用分钟 0~29；8:30 时禁用秒 0~29</p>
    </section>

    <section>
      <h3>自定义格式</h3>
      <UTimePicker v-model="formatted" format="HH时mm分" value-format="HH:mm" />
      <p class="tip">显示 {{ formatted ?? '-' }}（值按 valueFormat 落盘）</p>
    </section>

    <section>
      <h3>禁用 / 只读 / 不可清除</h3>
      <UTimePicker v-model="base" disabled />
      <UTimePicker v-model="base" readonly />
      <UTimePicker v-model="base" :clearable="false" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { UTimePicker } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/time-picker/style'

const base = shallowRef('09:30:00')

const str = shallowRef('09:30:00')
const timestamp = shallowRef(date().setHours(9).setMinutes(30).setSeconds(0).timestamp)
const dateObj = shallowRef(new Date(2026, 0, 1, 9, 30, 0))

const limited = shallowRef('08:30:30')
const formatted = shallowRef<string>()

function disabledHours() {
  return [...Array.from({ length: 6 }, (_, i) => i), ...Array.from({ length: 6 }, (_, i) => i + 18)]
}

function disabledMinutes(hour: number) {
  return hour === 8 ? Array.from({ length: 30 }, (_, i) => i) : []
}

function disabledSeconds(hour: number, minute: number) {
  return hour === 8 && minute === 30 ? Array.from({ length: 30 }, (_, i) => i) : []
}

function onChange(t?: Date) {
  console.log('change', t)
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.tip {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
