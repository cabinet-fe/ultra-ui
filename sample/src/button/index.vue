<template>
  <div>
    <div class="space">
      <div>类别展示</div>
      <u-button>默认</u-button>

      <u-button
        :type="button.type"
        v-for="(button, index) of buttons"
        :class="bem.is('active', index === active)"
        @click="active = index"
        :disabled="undefined"
      >
        {{ button.text }}
      </u-button>
    </div>

    <div class="space">
      <div>尺寸</div>
      <u-button type="primary" size="large">大按钮</u-button>
      <u-button type="primary">中按钮</u-button>
      <u-button type="primary" size="small">小按钮</u-button>
    </div>

    <div class="space">
      <div>圆形</div>
      <u-button type="primary" circle :icon="Edit"></u-button>
    </div>

    <!-- disabled -->
    <div class="space">
      <div>禁用</div>
      <u-button disabled>默认</u-button>
      <u-button disabled type="primary">主题</u-button>
      <u-button disabled type="success">成功</u-button>
      <u-button disabled type="warning">警告</u-button>
      <u-button disabled type="danger">危险</u-button>
      <u-button disabled type="info">信息</u-button>
    </div>

    <!-- loading -->
    <div class="space">
      <div>加载</div>
      <u-button loading :loadingIcon="Refresh">默认</u-button>
      <u-button loading type="primary">主题</u-button>
      <u-button loading type="success">成功</u-button>
      <u-button loading type="warning">警告</u-button>
      <u-button loading type="danger">危险</u-button>
      <u-button loading type="info">信息</u-button>
    </div>

    <!-- 朴素模式 -->
    <div class="space">
      <div>朴素模式</div>
      <u-button plain>默认</u-button>
      <u-button plain type="primary">主题</u-button>
      <u-button plain type="success">成功</u-button>
      <u-button plain type="warning">警告</u-button>
      <u-button plain type="danger">危险</u-button>
      <u-button plain type="info">信息</u-button>
    </div>

    <div class="space">
      <div>朴素模式和禁用</div>
      <u-button plain disabled>默认</u-button>
      <u-button plain disabled type="primary">主题</u-button>
      <u-button plain disabled type="success">成功</u-button>
      <u-button plain disabled type="warning">警告</u-button>
      <u-button plain disabled type="danger">危险</u-button>
      <u-button plain disabled type="info">信息</u-button>
    </div>

    <!-- text -->
    <div class="space">
      <div>text</div>
      <u-button text>默认</u-button>
      <u-button text type="primary" loading>主题</u-button>
      <u-button text type="success" disabled>成功</u-button>
      <u-button text type="warning">警告</u-button>
      <u-button text type="danger">危险</u-button>
      <u-button text type="info">信息</u-button>
    </div>

    <div class="space">
      <div>分组</div>
      <u-button-group v-slot="{ props }">
        <u-button
          v-for="(button, index) of buttons"
          :class="bem.is('active', index === active)"
          @click="active = index"
          v-bind="props"
        >
          {{ button.text }}
        </u-button>
      </u-button-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Edit, Refresh } from 'icon-ultra'
import { bem } from 'ultra-ui'
import { shallowRef } from 'vue'

const buttons = [
  { type: 'primary', text: '主题' },
  { type: 'success', text: '成功' },
  { type: 'warning', text: '警告' },
  { type: 'danger', text: '危险' },
  { type: 'info', text: '信息' }
] as Array<{ type: any; text: string }>

const active = shallowRef(0)
</script>

<style lang="scss">
.space {
  // padding: 8px;
  // & > * {
  //   margin-right: 8px;
  // }
}

.is-active {
  // background-color: #ccc;
}
</style>
