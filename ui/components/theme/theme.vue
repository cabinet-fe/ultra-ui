<template>
  <div :class="themeClass">
    <div :class="cls.e('content')">
      <theme-group title="主题色彩">
        <theme-item label="主要颜色">
          <u-palette v-model="theme.color.primary" />
        </theme-item>
        <theme-item label="成功颜色">
          <u-palette v-model="theme.color.success" />
        </theme-item>
        <theme-item label="警告颜色">
          <u-palette v-model="theme.color.warning" />
        </theme-item>
        <theme-item label="危险颜色">
          <u-palette v-model="theme.color.danger" />
        </theme-item>
        <theme-item label="信息颜色">
          <u-palette v-model="theme.color.info" />
        </theme-item>
        <theme-item label="禁用颜色">
          <u-palette v-model="theme.color.disabled" />
        </theme-item>
        <theme-item label="默认颜色">
          <u-palette v-model="theme.color.default" />
        </theme-item>
      </theme-group>

      <theme-group title="背景设置">
        <theme-item label="顶部背景">
          <u-palette v-model="theme.bg.color.top" />
        </theme-item>
        <theme-item label="中部背景">
          <u-palette v-model="theme.bg.color.middle" />
        </theme-item>
        <theme-item label="底部背景">
          <u-palette v-model="theme.bg.color.bottom" />
        </theme-item>
        <theme-item label="悬停背景">
          <u-palette v-model="theme.bg.color.hover" />
        </theme-item>
        <theme-item label="黑色背景">
          <u-palette v-model="theme.bg.color.black" />
        </theme-item>
      </theme-group>

      <theme-group title="背景滤镜">
        <theme-item label="模糊效果">
          <u-input
            v-model="theme.bg.filter.blur"
            placeholder="例如：blur(16px)"
          />
        </theme-item>
        <theme-item label="饱和度">
          <u-input
            v-model="theme.bg.filter.saturate"
            placeholder="例如：saturate(180%)"
          />
        </theme-item>
      </theme-group>

      <theme-group title="边框设置">
        <theme-item label="边框颜色">
          <u-palette v-model="theme.border.color" />
        </theme-item>
        <theme-item label="边框宽度">
          <u-number-input
            v-model="theme.border.width"
            :min="0"
            :step="1"
            :max="10"
          />
        </theme-item>
        <theme-item label="边框样式">
          <u-select v-model="theme.border.style" :options="borderStyles" />
        </theme-item>
      </theme-group>

      <theme-group title="复选框设置">
        <theme-item label="边框颜色">
          <u-palette v-model="theme.checkbox.border" />
        </theme-item>
      </theme-group>

      <theme-group title="单选框设置">
        <theme-item label="边框颜色">
          <u-palette v-model="theme.radio.border" />
        </theme-item>
      </theme-group>

      <theme-group title="文字颜色">
        <theme-item label="标题文字">
          <u-palette v-model="theme['text-color'].title" />
        </theme-item>
        <theme-item label="主要文字">
          <u-palette v-model="theme['text-color'].main" />
        </theme-item>
        <theme-item label="占位符文字">
          <u-palette v-model="theme['text-color'].placeholder" />
        </theme-item>
        <theme-item label="次要文字">
          <u-palette v-model="theme['text-color'].second" />
        </theme-item>
        <theme-item label="辅助文字">
          <u-palette v-model="theme['text-color'].assist" />
        </theme-item>
        <theme-item label="禁用文字">
          <u-palette v-model="theme['text-color'].disabled" />
        </theme-item>
        <theme-item label="白色文字">
          <u-palette v-model="theme['text-color'].white" />
        </theme-item>
      </theme-group>

      <theme-group title="尺寸设置">
        <theme-item label="小圆角">
          <u-number-input
            v-model="theme.radius.small"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认圆角">
          <u-number-input
            v-model="theme.radius.default"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="大圆角">
          <u-number-input
            v-model="theme.radius.large"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="表单组件高度">
        <theme-item label="小高度">
          <u-number-input
            v-model="theme['form-component-height'].small"
            :min="16"
            :max="40"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认高度">
          <u-number-input
            v-model="theme['form-component-height'].default"
            :min="20"
            :max="50"
            :step="1"
          />
        </theme-item>
        <theme-item label="大高度">
          <u-number-input
            v-model="theme['form-component-height'].large"
            :min="30"
            :max="60"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="菜单设置">
        <theme-item label="小菜单高度">
          <u-number-input
            v-model="theme.menu.height.small"
            :min="20"
            :max="50"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认菜单高度">
          <u-number-input
            v-model="theme.menu.height.default"
            :min="30"
            :max="60"
            :step="1"
          />
        </theme-item>
        <theme-item label="大菜单高度">
          <u-number-input
            v-model="theme.menu.height.large"
            :min="40"
            :max="80"
            :step="1"
          />
        </theme-item>
        <theme-item label="悬停背景">
          <u-input v-model="theme.menu.hover.bg" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="悬停文字">
          <u-input v-model="theme.menu.hover.color" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="激活背景">
          <u-input v-model="theme.menu.active.bg" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="激活文字">
          <u-input v-model="theme.menu.active.color" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="菜单背景颜色">
          <u-input v-model="theme.menu.bg.color" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="菜单背景模糊">
          <u-input v-model="theme.menu.bg.blur" placeholder="CSS模糊值" />
        </theme-item>
        <theme-item label="菜单背景饱和度">
          <u-input v-model="theme.menu.bg.saturate" placeholder="CSS饱和度" />
        </theme-item>
        <theme-item label="菜单背景图片">
          <u-input v-model="theme.menu.bg.image" placeholder="图片URL" />
        </theme-item>
        <theme-item label="菜单文字颜色">
          <u-palette v-model="theme.menu.color" />
        </theme-item>
      </theme-group>

      <theme-group title="字体设置">
        <theme-item label="字体族">
          <u-input v-model="theme['font-family']" placeholder="字体族名称" />
        </theme-item>
        <theme-item label="小标题字体">
          <u-number-input
            v-model="theme['font-size-title'].small"
            :min="8"
            :max="24"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认标题字体">
          <u-number-input
            v-model="theme['font-size-title'].default"
            :min="8"
            :max="24"
            :step="1"
          />
        </theme-item>
        <theme-item label="大标题字体">
          <u-number-input
            v-model="theme['font-size-title'].large"
            :min="8"
            :max="32"
            :step="1"
          />
        </theme-item>
        <theme-item label="小正文字体">
          <u-number-input
            v-model="theme['font-size-main'].small"
            :min="8"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认正文字体">
          <u-number-input
            v-model="theme['font-size-main'].default"
            :min="8"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="大正文字体">
          <u-number-input
            v-model="theme['font-size-main'].large"
            :min="8"
            :max="24"
            :step="1"
          />
        </theme-item>
        <theme-item label="小辅助字体">
          <u-number-input
            v-model="theme['font-size-assist'].small"
            :min="8"
            :max="16"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认辅助字体">
          <u-number-input
            v-model="theme['font-size-assist'].default"
            :min="8"
            :max="16"
            :step="1"
          />
        </theme-item>
        <theme-item label="大辅助字体">
          <u-number-input
            v-model="theme['font-size-assist'].large"
            :min="8"
            :max="20"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="间距设置">
        <theme-item label="小间距">
          <u-number-input
            v-model="theme.gap.small"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认间距">
          <u-number-input
            v-model="theme.gap.default"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="大间距">
          <u-number-input
            v-model="theme.gap.large"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="阴影设置">
        <theme-item label="阴影颜色">
          <u-palette v-model="theme.shadow.color" />
        </theme-item>
        <theme-item label="水平偏移">
          <u-number-input
            v-model="theme.shadow.x"
            :min="-20"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="垂直偏移">
          <u-number-input
            v-model="theme.shadow.y"
            :min="-20"
            :max="20"
            :step="1"
          />
        </theme-item>
        <theme-item label="模糊半径">
          <u-number-input
            v-model="theme.shadow.blur"
            :min="0"
            :max="50"
            :step="1"
          />
        </theme-item>
        <theme-item label="扩散半径">
          <u-number-input
            v-model="theme.shadow.spread"
            :min="0"
            :max="20"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="标签尺寸">
        <theme-item label="小标签">
          <u-number-input
            v-model="theme.tag.small"
            :min="16"
            :max="32"
            :step="1"
          />
        </theme-item>
        <theme-item label="默认标签">
          <u-number-input
            v-model="theme.tag.default"
            :min="20"
            :max="40"
            :step="1"
          />
        </theme-item>
        <theme-item label="大标签">
          <u-number-input
            v-model="theme.tag.large"
            :min="24"
            :max="48"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="断点设置">
        <theme-item label="超小屏幕">
          <u-number-input
            v-model="theme.breakpoint.xs"
            :min="320"
            :max="768"
            :step="1"
          />
        </theme-item>
        <theme-item label="小屏幕">
          <u-number-input
            v-model="theme.breakpoint.sm"
            :min="600"
            :max="1024"
            :step="1"
          />
        </theme-item>
        <theme-item label="中屏幕">
          <u-number-input
            v-model="theme.breakpoint.md"
            :min="960"
            :max="1440"
            :step="1"
          />
        </theme-item>
        <theme-item label="大屏幕">
          <u-number-input
            v-model="theme.breakpoint.lg"
            :min="1280"
            :max="2560"
            :step="1"
          />
        </theme-item>
      </theme-group>

      <theme-group title="表格设置">
        <theme-item label="表格边框颜色">
          <u-palette v-model="theme.table['border-color']" />
        </theme-item>
        <theme-item label="表头背景">
          <u-palette v-model="theme.table.header.bg" />
        </theme-item>
        <theme-item label="表头文字">
          <u-input v-model="theme.table.header.color" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="条纹背景">
          <u-palette v-model="theme.table.stripe.bg" />
        </theme-item>
        <theme-item label="条纹文字">
          <u-input v-model="theme.table.stripe.color" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="悬停背景">
          <u-input v-model="theme.table.hover.bg" placeholder="CSS颜色值" />
        </theme-item>
        <theme-item label="悬停文字">
          <u-input v-model="theme.table.hover.color" placeholder="CSS颜色值" />
        </theme-item>
      </theme-group>
    </div>

    <div :class="cls.e('actions')">
      <u-button :class="cls.e('reset-btn')" @click="handleResetTheme">
        重置主题
      </u-button>
      <u-button
        :class="cls.e('export-btn')"
        @click="handleExportTheme"
        type="primary"
      >
        导出主题
      </u-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ThemeProps } from '@ui/types'
import { lightTheme } from '@ui/styles/theme/light'
import { bem } from '@ui/utils'
import { ThemeDIKey } from './di'
import { provide, computed, watch } from 'vue'
import ThemeGroup from './group.vue'
import ThemeItem from './group-item.vue'
import { UNumberInput } from '../number-input'
import { UPalette } from '../palette'
import { UInput } from '../input'
import { UButton } from '../button'
import { USelect } from '../select'

defineOptions({
  name: 'UTheme'
})

defineProps<ThemeProps>()

const cls = bem('theme')

const themeClass = computed(() => {
  return [cls.b]
})

// 边框样式选项
const borderStyles = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '双线', value: 'double' }
]

// 创建主题实例的副本用于编辑
const { theme } = lightTheme

// 重置主题到默认值
const handleResetTheme = () => {
  const defaultTheme = new (lightTheme.constructor as any)(lightTheme.theme)
  Object.assign(theme, defaultTheme.theme)
}

// 导出主题配置
const handleExportTheme = () => {
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

// 提供依赖注入
provide(ThemeDIKey, {
  cls
})
</script>
