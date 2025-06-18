<template>
  <div :class="cls.b">
    <theme-group title="主题色彩">
      <theme-item label="主要颜色">
        <input
          type="color"
          v-model="theme.color.primary"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="成功颜色">
        <input
          type="color"
          v-model="theme.color.success"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="警告颜色">
        <input
          type="color"
          v-model="theme.color.warning"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="危险颜色">
        <input
          type="color"
          v-model="theme.color.danger"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="信息颜色">
        <input
          type="color"
          v-model="theme.color.info"
          :class="cls.e('color-input')"
        />
      </theme-item>
    </theme-group>

    <theme-group title="背景设置">
      <theme-item label="顶部背景">
        <input
          type="color"
          v-model="theme.bg.color.top"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="中部背景">
        <input
          type="color"
          v-model="theme.bg.color.middle"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="底部背景">
        <input
          type="color"
          v-model="theme.bg.color.bottom"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="悬停背景">
        <input
          type="color"
          v-model="theme.bg.color.hover"
          :class="cls.e('color-input')"
        />
      </theme-item>
    </theme-group>

    <theme-group title="边框设置">
      <theme-item label="边框颜色">
        <input
          type="color"
          v-model="theme.border.color"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="边框宽度">
        <u-number-input
          v-model="theme.border.width"
          :min="0"
          :max="10"
          size="small"
        />
      </theme-item>
    </theme-group>

    <theme-group title="文字颜色">
      <theme-item label="标题文字">
        <input
          type="color"
          v-model="theme['text-color'].title"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="主要文字">
        <input
          type="color"
          v-model="theme['text-color'].main"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="占位符文字">
        <input
          type="color"
          v-model="theme['text-color'].placeholder"
          :class="cls.e('color-input')"
        />
      </theme-item>
      <theme-item label="辅助文字">
        <input
          type="color"
          v-model="theme['text-color'].assist"
          :class="cls.e('color-input')"
        />
      </theme-item>
    </theme-group>

    <theme-group title="尺寸设置">
      <theme-item label="小圆角">
        <u-number-input
          v-model="theme.radius.small"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
      <theme-item label="默认圆角">
        <u-number-input
          v-model="theme.radius.default"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
      <theme-item label="大圆角">
        <u-number-input
          v-model="theme.radius.large"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
    </theme-group>

    <theme-group title="字体设置">
      <theme-item label="字体族">
        <input
          type="text"
          v-model="theme['font-family']"
          :class="cls.e('text-input')"
          placeholder="字体族名称"
        />
      </theme-item>
      <theme-item label="小字体">
        <u-number-input
          v-model="theme['font-size-main'].small"
          :min="8"
          :max="24"
          size="small"
        />
      </theme-item>
      <theme-item label="默认字体">
        <u-number-input
          v-model="theme['font-size-main'].default"
          :min="8"
          :max="24"
          size="small"
        />
      </theme-item>
      <theme-item label="大字体">
        <u-number-input
          v-model="theme['font-size-main'].large"
          :min="8"
          :max="24"
          size="small"
        />
      </theme-item>
    </theme-group>

    <theme-group title="间距设置">
      <theme-item label="小间距">
        <u-number-input
          v-model="theme.gap.small"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
      <theme-item label="默认间距">
        <u-number-input
          v-model="theme.gap.default"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
      <theme-item label="大间距">
        <u-number-input
          v-model="theme.gap.large"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
    </theme-group>

    <theme-group title="阴影设置">
      <theme-item label="阴影颜色">
        <input
          type="color"
          v-model="shadowColor"
          :class="cls.e('color-input')"
          @input="updateShadowColor"
        />
      </theme-item>
      <theme-item label="水平偏移">
        <u-number-input
          v-model="theme.shadow.x"
          :min="-20"
          :max="20"
          size="small"
        />
      </theme-item>
      <theme-item label="垂直偏移">
        <u-number-input
          v-model="theme.shadow.y"
          :min="-20"
          :max="20"
          size="small"
        />
      </theme-item>
      <theme-item label="模糊半径">
        <u-number-input
          v-model="theme.shadow.blur"
          :min="0"
          :max="50"
          size="small"
        />
      </theme-item>
      <theme-item label="扩散半径">
        <u-number-input
          v-model="theme.shadow.spread"
          :min="0"
          :max="20"
          size="small"
        />
      </theme-item>
    </theme-group>

    <div :class="cls.e('actions')">
      <button :class="cls.e('reset-btn')" @click="resetTheme">重置主题</button>
      <button :class="cls.e('export-btn')" @click="exportTheme">
        导出主题
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { lightTheme } from '@ui/styles/theme/light'
import { bem } from '@ui/utils'
import { ThemeDIKey } from './di'
import { provide, ref, computed, watch } from 'vue'
import ThemeGroup from './group.vue'
import ThemeItem from './group-item.vue'
import { UNumberInput } from '../number-input'

defineOptions({
  name: 'UTheme'
})

const cls = bem('theme')

// 创建主题实例的副本用于编辑
const { theme } = lightTheme

// 阴影颜色的特殊处理（因为阴影颜色可能包含透明度）
const shadowColor = ref('#000000')

// 监听阴影颜色变化
const updateShadowColor = () => {
  // 将颜色转换为 rgba 格式，保持透明度
  const hex = shadowColor.value
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  theme.shadow.color = `rgba(${r}, ${g}, ${b}, 0.1)`
}

// 重置主题到默认值
const resetTheme = () => {
  const defaultTheme = new (lightTheme.constructor as any)(lightTheme.theme)
  Object.assign(theme, defaultTheme.theme)
  shadowColor.value = '#000000'
}

// 导出主题配置
const exportTheme = () => {
  const themeConfig = JSON.stringify(theme, null, 2)
  const blob = new Blob([themeConfig], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 监听主题变化并实时应用
watch(
  theme,
  () => {
    lightTheme.render()
  },
  { deep: true }
)

provide(ThemeDIKey, {
  cls
})
</script>
