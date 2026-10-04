<template>
  <div class="demo">
    <section>
      <h3>步进</h3>
      <UNumberInput v-model="count" :step="1" placeholder="数量" />
      <UNumberInput
        v-model="price"
        :step="0.5"
        :max-precision="2"
        suffix="元"
        placeholder="步长 0.5"
      />
    </section>

    <section>
      <h3>范围限制</h3>
      <UNumberInput v-model="limited" :step="10" :min="0" :max="100" placeholder="0 ~ 100" />
    </section>

    <section>
      <h3>精度</h3>
      <UNumberInput v-model="precise" :precision="2" placeholder="固定两位小数" />
      <UNumberInput v-model="currency" currency placeholder="货币格式（分 → 元）" :multiple="100" />
    </section>

    <section>
      <h3>状态</h3>
      <UNumberInput v-model="count" disabled :step="1" placeholder="禁用" />
      <UNumberInput model-value="66.60" readonly placeholder="只读" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UNumberInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/number-input/style'

const count = shallowRef<number | undefined>(1)
const price = shallowRef<number | undefined>()
const limited = shallowRef<number | undefined>(30)
const precise = shallowRef<number | undefined>()
const currency = shallowRef<number | undefined>(19900)
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
</style>
