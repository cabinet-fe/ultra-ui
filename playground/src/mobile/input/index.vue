<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <UInput v-model="text" placeholder="请输入内容" />
    </section>

    <section>
      <h3>清除</h3>
      <UInput v-model="clearableText" placeholder="输入后出现清除按钮" />
      <UInput v-model="noClearText" :clearable="false" placeholder="不可清除" />
    </section>

    <section>
      <h3>前后缀</h3>
      <UInput v-model="amount" prefix="¥" suffix="元" />
      <UInput v-model="domain" placeholder="请输入域名">
        <template #prefix>https://</template>
        <template #suffix>.com</template>
      </UInput>
    </section>

    <section>
      <h3>输入约束</h3>
      <UInput
        v-model="phone"
        :pattern="/^\d*$/"
        placeholder="仅可输入数字（数字键盘）"
        inputmode="numeric"
      />
      <UInput v-model="remark" :maxlength="20" placeholder="最多 20 字" />
      <UInput v-model="keyword" placeholder="回车键显示「发送」" enterkeyhint="send" />
    </section>

    <section>
      <h3>状态</h3>
      <UInput v-model="text" disabled placeholder="禁用" />
      <UInput model-value="只读内容" readonly />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/input/style'

const text = shallowRef('')
const clearableText = shallowRef('可清除的内容')
const noClearText = shallowRef('不可清除的内容')
const amount = shallowRef('100')
const domain = shallowRef('')
const phone = shallowRef('')
const remark = shallowRef('')
const keyword = shallowRef('')
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
