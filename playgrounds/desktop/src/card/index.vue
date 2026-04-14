<template>
  <div>
    <u-card width="400">
      <u-card-header>标题</u-card-header>
      <u-card-content>正文示例</u-card-content>
      <u-card-action align-right>
        <u-button type="primary" text>返回</u-button>
        <u-button type="primary">确认</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400" integrate>
      <u-card-header>融合卡片</u-card-header>
      <u-card-content>integrate 示例</u-card-content>
      <u-card-action align-right>
        <u-button type="primary" text>返回</u-button>
        <u-button type="primary">确认</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400">
      <u-card-cover
        src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
      />
      <u-card-action style="display: flex; justify-content: space-between; align-items: center">
        <u-text :max-rows="1" as="title">描述</u-text>
        <button-common-props tag="span" size="small" :loading="loading">
          <u-button
            v-for="btn of buttons"
            :key="btn.type"
            :icon="btn.icon"
            :type="btn.type"
            @click="handleClick"
          />
        </button-common-props>
      </u-card-action>
    </u-card>
  </div>
</template>

<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import type { ButtonProps } from '@veltra/desktop'
import { Lock, MoreFilled, Star } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

const ButtonCommonProps = useComponentProps<ButtonProps>({
  circle: true,
  iconSize: 18,
  loading: false
})

const buttons = [
  { type: 'primary' as const, icon: Star },
  { type: 'warning' as const, icon: Lock },
  { icon: MoreFilled }
]

const loading = shallowRef(false)

function handleClick() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>

<style lang="scss" scoped>
div > .u-card {
  margin-bottom: 10px;
}
</style>
