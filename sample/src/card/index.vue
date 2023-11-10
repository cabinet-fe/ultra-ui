<template>
  <div>
    <u-card width="400" size="small">
      <u-card-header> 卡片标题 </u-card-header>

      <u-card-content> 卡片内容 </u-card-content>

      <u-card-action align-right>
        <u-button type="primary" text>返回</u-button>
        <u-button plain type="primary">操作</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400">
      <u-card-cover
        src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
      />

      <u-card-action style="display: flex; justify-content: space-between">
        <u-text :max-rows="1" as="title"> 卡片描述 </u-text>
        <button-common-props tag="span">
          <u-button :icon="Star" />
          <u-button :icon="Star" />
          <u-button :icon="Lock" />
          <u-button :icon="MoreFilled" />
        </button-common-props>
      </u-card-action>
    </u-card>
  </div>
</template>

<script setup lang="ts">
import { MoreFilled, Star, Lock } from 'icon-ultra'
import { type ButtonProps, useComponentProps } from 'ultra-ui'

const ButtonCommonProps = useComponentProps<ButtonProps>({
  circle: true,
  type: 'primary',
  text: true,
  iconSize: 18,
  loading: true,
})
</script>

<style lang="scss" scoped>
div {
  & > .u-card {
    margin-bottom: 10px;
  }
}
</style>
