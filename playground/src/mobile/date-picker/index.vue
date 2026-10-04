<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <UDatePicker v-model="base" @change="onChange" />
      <p class="tip">当前值：{{ base ?? '未选择' }}</p>
    </section>

    <section>
      <h3>日期类型（type）</h3>
      <UDatePicker v-model="day" type="date" />
      <UDatePicker v-model="month" type="month" />
      <UDatePicker v-model="year" type="year" />
      <p class="tip">
        date：{{ day ?? '-' }} / month：{{ month ?? '-' }} / year：{{ year ?? '-' }}
      </p>
    </section>

    <section>
      <h3>绑定值类型（dataType）</h3>
      <UDatePicker v-model="str" />
      <UDatePicker v-model="timestamp" data-type="timestamp" />
      <UDatePicker v-model="dateObj" data-type="date" />
      <p class="tip">
        字符串：{{ str ?? '-' }} / 时间戳：{{ timestamp ?? '-' }} / Date：
        {{ dateObj ? dateObj.toISOString().slice(0, 10) : '-' }}
      </p>
    </section>

    <section>
      <h3>禁用日期</h3>
      <UDatePicker v-model="limited" :disabled-date="disabledDate" />
      <p class="tip">今天及之前不可选</p>
    </section>

    <section>
      <h3>自定义格式</h3>
      <UDatePicker v-model="formatted" format="yyyy年MM月dd日" value-format="yyyy/MM/dd" />
      <p class="tip">显示 {{ formatted ?? '-' }}（值按 valueFormat 落盘）</p>
    </section>

    <section>
      <h3>禁用 / 只读 / 不可清除</h3>
      <UDatePicker v-model="base" disabled />
      <UDatePicker v-model="base" readonly />
      <UDatePicker v-model="base" :clearable="false" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { date } from '@cat-kit/core'
import { UDatePicker } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/date-picker/style'

const base = shallowRef(date().format('yyyy-MM-dd'))
const day = shallowRef<string>()
const month = shallowRef<string>()
const year = shallowRef<string>()

const str = shallowRef(date().format('yyyy-MM-dd'))
const timestamp = shallowRef(Date.now())
const dateObj = shallowRef(new Date())

const limited = shallowRef<string>()
const formatted = shallowRef<string>()

/** 今天及之前不可选 */
function disabledDate(d: { timestamp: number }) {
  return d.timestamp <= Date.now()
}

function onChange(d?: Date) {
  console.log('change', d)
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
