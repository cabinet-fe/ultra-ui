<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <UPasswordInput v-model="pwd" placeholder="请输入密码" />
    </section>

    <section>
      <h3>可清除</h3>
      <UPasswordInput v-model="clearablePwd" clearable placeholder="输入后出现清除按钮" />
    </section>

    <section>
      <h3>带前缀</h3>
      <UPasswordInput v-model="pwd" placeholder="请输入密码">
        <template #prefix>密码</template>
      </UPasswordInput>
    </section>

    <section>
      <h3>禁用</h3>
      <UPasswordInput v-model="pwd" disabled placeholder="禁用" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UPasswordInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/password-input/style'

const pwd = shallowRef('')
const clearablePwd = shallowRef('secret')
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
