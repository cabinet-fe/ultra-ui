<template>
  <div class="demo">
    <section>
      <h3>角色预设</h3>
      <UText as="main-title">main-title 主标题</UText>
      <UText as="title">title 标题</UText>
      <UText as="sub-title">sub-title 副标题</UText>
      <UText>content 正文（默认）</UText>
      <UText as="additional">additional 辅助说明</UText>
    </section>

    <section>
      <h3>排版修饰</h3>
      <UText deleted>删除线文本</UText>
      <UText underline>下划线文本</UText>
      <UText bold>加粗文本</UText>
      <UText italic>斜体文本</UText>
      <UText bold italic underline deleted>组合修饰</UText>
    </section>

    <section>
      <h3>字号覆盖</h3>
      <UText :font-size="20">fontSize=20，覆盖角色默认字号</UText>
    </section>

    <section>
      <h3>关键词高亮</h3>
      <UText highlight="移动端">支持移动端关键词高亮，跟随主题 warning 色。</UText>
      <UText :highlight="['低代码', '零改动']">同一份低代码 schema，双端渲染零改动。</UText>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UText } from '@veltra/mobile'
import '@veltra/mobile/components/text/style'
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端阅读密度
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
}
</style>
