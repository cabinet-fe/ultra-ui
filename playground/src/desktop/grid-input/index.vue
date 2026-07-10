<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <p class="hint">默认 6 格、分隔符 `-`、不可输入 0</p>
      <u-grid-input v-model="basic" />
      <p class="value">值：{{ basic || '（空）' }}</p>
    </section>

    <section>
      <h3>数据回显</h3>
      <p class="hint">带分隔符的初始值应正确拆分到各格</p>
      <u-grid-input v-model="echo" :length="6" separator="-" />
      <u-grid-input v-model="echoJoined" :length="6" separator="" :zero="true" />
      <p class="value">带分隔：{{ echo || '（空）' }}　无分隔：{{ echoJoined || '（空）' }}</p>
    </section>

    <section>
      <h3>自定义长度</h3>
      <p class="hint">4 位短码</p>
      <u-grid-input v-model="shortCode" :length="4" separator="" />
      <p class="value">值：{{ shortCode || '（空）' }}</p>
    </section>

    <section>
      <h3>自定义分隔符</h3>
      <p class="hint">空格分隔 / 无分隔符</p>
      <u-grid-input v-model="spaced" :length="4" separator=" " />
      <u-grid-input v-model="joined" :length="6" separator="" />
      <p class="value">空格：{{ spaced || '（空）' }}　无分隔：{{ joined || '（空）' }}</p>
    </section>

    <section>
      <h3>验证码（允许输入 0）</h3>
      <p class="hint">:zero="true"，可输入 0–9</p>
      <u-grid-input v-model="otp" :length="6" :zero="true" separator="" />
      <p class="value">值：{{ otp || '（空）' }}</p>
    </section>

    <section>
      <h3>组织编码结构（禁止输入 0）</h3>
      <p class="hint">结构 3-3-2 表示最多 3 层；编码长度可为 3 / 6 / 8 位，每位只能是 1–9</p>
      <div class="row">
        <span class="label">一级（3 位）</span>
        <u-grid-input v-model="orgL1" :length="3" separator="" />
      </div>
      <div class="row">
        <span class="label">二级（6 位）</span>
        <u-grid-input v-model="orgL2" :length="6" separator="" />
      </div>
      <div class="row">
        <span class="label">三级（8 位）</span>
        <u-grid-input v-model="orgL3" :length="8" separator="" />
      </div>
      <p class="value">
        L1：{{ orgL1 || '（空）' }}　L2：{{ orgL2 || '（空）' }}　L3：{{ orgL3 || '（空）' }}
      </p>
    </section>

    <section>
      <h3>调用 clear 清空</h3>
      <div class="row">
        <u-button type="primary" @click="clearOtp">清空验证码</u-button>
        <u-grid-input ref="otpRef" v-model="clearable" :length="6" :zero="true" separator="" />
      </div>
      <p class="value">值：{{ clearable || '（空）' }}</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { GridInputExposed } from '@veltra/desktop'
import { shallowRef, useTemplateRef } from 'vue'

const basic = shallowRef('')
const echo = shallowRef('1-2-3-4-5-6')
const echoJoined = shallowRef('102030')
const shortCode = shallowRef('')
const spaced = shallowRef('')
const joined = shallowRef('')
const otp = shallowRef('')
const orgL1 = shallowRef('')
const orgL2 = shallowRef('')
const orgL3 = shallowRef('')
const clearable = shallowRef('')

const otpRef = useTemplateRef<GridInputExposed>('otpRef')

const clearOtp = () => {
  otpRef.value?.clear()
  clearable.value = ''
}
</script>

<style scoped>
.demo {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 640px;
}

section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--u-text-color-secondary, #666);
}

.value {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--u-text-color-secondary, #666);
  word-break: break-all;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  flex-shrink: 0;
  width: 88px;
  font-size: 13px;
}
</style>
