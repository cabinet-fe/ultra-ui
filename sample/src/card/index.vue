<template>
  <div>
    <u-card width="400" size="aaa">
      <u-card-header> 卡片标题 </u-card-header>

      <u-card-content> 卡片内容 </u-card-content>

      <u-card-action>
        <u-button type="primary" text>返回</u-button>
        <u-button plain type="primary">操作</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400">
      <u-card-cover
        src="https://img1.baidu.com/it/u=4250406567,15377877&fm=253&fmt=auto&app=120&f=JPEG?w=1422&h=800"
      />

      <u-card-action style="display: flex; justify-content: space-between; align-items: center">
        <u-text :max-rows="1" as="title"> 卡片描述 </u-text>
        <button-common-props tag="span">
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
  iconSize: 18
})
</script>

<style lang="scss" scoped>
div {
  & > .u-card {
    margin-bottom: 10px;
  }
}
</style>
