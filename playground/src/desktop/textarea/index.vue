<template>
  <div class="sample">
    <section>
      <h3>基础用法</h3>
      <p>支持纵向拖拽高度，悬停或聚焦且有内容时右上角出现清空按钮。</p>
      <u-textarea v-model="basic" :rows="3" placeholder="写点什么吧…" />
    </section>

    <section>
      <h3>字数统计</h3>
      <p>
        <code>maxlength</code> + <code>show-count</code>，计数为「已输入/上限」，达到上限时变色。
      </p>
      <u-textarea v-model="comment" :maxlength="60" show-count :rows="3" placeholder="最多 60 字" />
    </section>

    <section>
      <h3>自适应高度</h3>
      <p><code>autosize</code> 下高度随内容增减，不再出现滚动条与拖拽手柄。</p>
      <u-textarea v-model="story" autosize placeholder="内容多长，框就多高" />
    </section>

    <section>
      <h3>固定行数</h3>
      <p><code>:resize="false"</code> 禁止拖拽，配合 <code>rows</code> 固定高度。</p>
      <u-textarea v-model="fixed" :resize="false" :rows="4" />
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="sizes">
        <div v-for="size in sizes" :key="size">
          <span class="label">{{ size }}</span>
          <u-textarea v-model="sized" :size="size" :rows="2" />
        </div>
      </div>
    </section>

    <section>
      <h3>状态</h3>
      <div class="states">
        <div>
          <span class="label">disabled</span>
          <u-textarea v-model="stateText" disabled :maxlength="100" show-count />
        </div>
        <div>
          <span class="label">native-readonly（可选中复制）</span>
          <u-textarea v-model="stateText" native-readonly />
        </div>
        <div>
          <span class="label">readonly（渲染为纯文本）</span>
          <u-textarea v-model="stateText" readonly />
        </div>
      </div>
    </section>

    <section class="wide">
      <h3>表单中使用</h3>
      <p>表单内用 <code>field</code> 绑定，校验失败时外框描红。</p>
      <u-form ref="formRef" :model="form" label-width="80px">
        <u-textarea
          label="反馈内容"
          field="feedback"
          span="full"
          :rows="3"
          :maxlength="200"
          show-count
          placeholder="请描述你遇到的问题（至少 10 字）"
          :rules="{ required: true, minLen: [10, '至少 10 个字'] }"
        />
      </u-form>
      <div class="actions">
        <u-button type="primary" @click="formRef?.validate()">提交校验</u-button>
        <u-button @click="formRef?.reset()">重置</u-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UTextarea } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const basic = shallowRef('')
const comment = shallowRef('界面清爽了很多，计数也更直观。')
const story = shallowRef('第一行\n第二行\n继续输入，高度会跟着变化')
const fixed = shallowRef('固定 4 行高度，内容超出后在框内滚动。')
const sized = shallowRef('不同尺寸下的字号、内边距与圆角')
const stateText = shallowRef('这是一段示例内容，\n用于展示不同状态下的文本域。')

const sizes = ['small', 'default', 'large'] as const

const form = reactive({ feedback: '' })
const formRef = shallowRef<FormExposed>()
</script>

<style scoped>
.sample {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 32px 40px;
  max-width: 1080px;
}

section.wide {
  grid-column: 1 / -1;
}

section h3 {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--u-text-color-title);
}

section p {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--u-text-color-second);
}

code {
  padding: 0 4px;
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--u-bg-color-hover);
}

.sizes,
.states {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--u-text-color-assist);
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
