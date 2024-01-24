<template>
  <div>
    <u-card width="400" size="small">
      <u-card-header> 卡片标题 </u-card-header>

      <u-card-content>
        愿您在新的一年里，龙飞凤舞 龙潭虎穴， 龙腾虎跃， 龙马精神， 龙钟虎踞，
        龙争虎斗， 龙章凤函， 一龙一飞， 亢龙有悔， 龙潭虎渊， 龙行虎步，
        龙神凤雏， 龙战虎争， 龙屈虎伏， 龙腾虎跃， 龙蟠虎踞， 龙腾虎踞，
        龙腾虎跃， 龙腾凤集， 龙腾虎跃！
      </u-card-content>

      <u-card-action align-right>
        <u-button type="primary" text>返回</u-button>
        <u-button type="primary">确认</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400">
      <u-card-cover
        src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
      />

      <u-card-action
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <u-text :max-rows="1" as="title"> 卡片描述 </u-text>
        <button-common-props tag="span">
          <u-button :icon="Star" type="primary" />
          <u-button :icon="Lock" type="warning" />
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
  // type: 'primary',
  // text: true,
  iconSize: 18,
  loading: false
})
</script>

<style lang="scss" scoped>
div {
  & > .u-card {
    margin-bottom: 10px;
  }
}
</style>
