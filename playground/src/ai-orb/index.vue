<template>
  <div class="ai-orb-demo">
    <!-- ======== 生命状态：常态动画（呼吸 / 眨眼 / 视线游移） ======== -->
    <CustomCard title="生命状态">
      <div class="ai-orb-demo__stage">
        <UAiOrb :size="140" :status="status" />
      </div>
      <u-radio-group :items="statusItems" v-model="status" />
      <p class="ai-orb-demo__hint">
        idle 平静：随机眨眼（偶发双眨）+ 视线游移转头；thinking 思考：眯眼 + 视线缓慢扫视；speaking
        输出：嘴随节奏开合。
      </p>
    </CustomCard>

    <!-- ======== 瞬时表情：对应阶段性工作事件 ======== -->
    <CustomCard title="瞬时表情（阶段性事件）">
      <div class="ai-orb-demo__stage">
        <UAiOrb ref="reactionOrb" :size="140" />
      </div>
      <div class="ai-orb-demo__actions">
        <u-button @click="react('happy')">开心 · 回答完毕</u-button>
        <u-button @click="react('shock')">惊讶</u-button>
        <u-button @click="react('frustrated')">沮丧 · 工具调用失败</u-button>
      </div>
      <p class="ai-orb-demo__hint">
        通过模板引用调用 <code>orb.react(type)</code> 播放约 1-2s 瞬时表情：happy
        先睁大眼睛再弯眼大笑点头；shock 睁大眼睛 + 后仰；frustrated 闭紧眼睛 + 摇头。UAiChat
        中工具调用失败会自动对工作球触发 frustrated。
      </p>
    </CustomCard>

    <!-- ======== 尺寸 ======== -->
    <CustomCard title="尺寸">
      <div class="ai-orb-demo__sizes">
        <div v-for="s in sizes" :key="s" class="ai-orb-demo__size-cell">
          <UAiOrb :size="s" />
          <span class="ai-orb-demo__label">{{ s }}px</span>
        </div>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { AiOrbExposed, AiOrbReaction, AiOrbStatus } from '@veltra/ai'
import { shallowRef, useTemplateRef } from 'vue'

import CustomCard from '../desktop/card/custom-card.vue'

const statusItems = [
  { label: 'idle 平静', value: 'idle' },
  { label: 'thinking 思考', value: 'thinking' },
  { label: 'speaking 输出', value: 'speaking' }
]

const status = shallowRef<AiOrbStatus>('idle')

const reactionOrbRef = useTemplateRef<AiOrbExposed>('reactionOrb')

const react = (reaction: AiOrbReaction) => reactionOrbRef.value?.react(reaction)

const sizes = [24, 32, 48, 64, 88]
</script>

<style scoped>
.ai-orb-demo__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--u-bg-color-container);
}

.ai-orb-demo__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ai-orb-demo__hint {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--u-text-color-secondary);
}

.ai-orb-demo__sizes {
  display: flex;
  align-items: flex-end;
  gap: 32px;
}

.ai-orb-demo__size-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ai-orb-demo__label {
  font-size: 12px;
  color: var(--u-text-color-secondary);
}
</style>
