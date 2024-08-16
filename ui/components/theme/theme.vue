<template>
  <div :class="cls.b">
    <theme-group title="主题色">
      <theme-item label="品牌"></theme-item>
      <theme-item label="默认"></theme-item>
      <theme-item label="成功"></theme-item>
      <theme-item label="失败"></theme-item>
      <theme-item label="警告"></theme-item>
      <theme-item label="信息"></theme-item>
    </theme-group>

    <theme-group title="背景色">
      <theme-item label="底层"></theme-item>
      <theme-item label="中层"></theme-item>
      <theme-item label="顶层"></theme-item>
      <theme-item label="禁用"></theme-item>
      <theme-item label="悬浮"></theme-item>
    </theme-group>

    <theme-group title="边框">
      <theme-item label="宽度">
        <u-number-input
          v-model="theme.border.width"
          :min="0"
          :step="1"
          :clearable="false"
        />
      </theme-item>
      <theme-item label="样式"></theme-item>
      <theme-item label="颜色"></theme-item>
    </theme-group>
    <theme-group title="圆角">
      <theme-item label="小">
        <u-number-input
          v-model="theme.radius.small"
          :min="0"
          :step="1"
          :clearable="false"
        />
      </theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.radius.default"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.radius.large"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="表单组件高度">
      <theme-item label="小"
        ><u-number-input
          v-model="theme.formComponentHeight.small"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.formComponentHeight.default"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.formComponentHeight.large"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="菜单高度">
      <theme-item label="小"
        ><u-number-input
          v-model="theme.menuHeight.small"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.menuHeight.default"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.menuHeight.large"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="标签尺寸">
      <theme-item label="小">
        <u-number-input
          v-model="theme.tag.small"
          :step="1"
          :min="0"
          :clearable="false"
        />
      </theme-item>
      <theme-item label="中">
        <u-number-input
          v-model="theme.tag.default"
          :min="0"
          :clearable="false"
          :step="1"
        />
      </theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.tag.large"
          :step="1"
          :min="0"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="字体族"> </theme-group>
    <theme-group title="文字颜色"> </theme-group>
    <theme-group title="标题字体大小">
      <theme-item label="小"
        ><u-number-input
          v-model="theme.fontSizeTitle.small"
          :min="14"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.fontSizeTitle.default"
          :min="14"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.fontSizeTitle.large"
          :min="14"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="正文字体大小">
      <theme-item label="小"
        ><u-number-input
          v-model="theme.fontSizeMain.small"
          :min="12"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.fontSizeMain.default"
          :min="12"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.fontSizeMain.large"
          :min="12"
          :step="1"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="辅助字体大小">
      <theme-item label="小"
        ><u-number-input
          v-model="theme.fontSizeAssist.small"
          :min="12"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.fontSizeAssist.default"
          :min="12"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.fontSizeAssist.large"
          :min="12"
          :step="1"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="阴影">
      <theme-item label="水平偏移"
        ><u-number-input :step="1" v-model="theme.shadow.x" :clearable="false"
      /></theme-item>
      <theme-item label="垂直偏移"
        ><u-number-input :step="1" v-model="theme.shadow.y" :clearable="false"
      /></theme-item>
      <theme-item label="模糊半径"
        ><u-number-input
          v-model="theme.shadow.blur"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="扩散半径"
        ><u-number-input
          v-model="theme.shadow.spread"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="颜色"></theme-item>
    </theme-group>
    <theme-group title="间距">
      <theme-item label="小"
        ><u-number-input
          v-model="theme.gap.small"
          :step="1"
          :min="0"
          :clearable="false"
      /></theme-item>
      <theme-item label="中"
        ><u-number-input
          v-model="theme.gap.default"
          :min="0"
          :step="1"
          :clearable="false"
      /></theme-item>
      <theme-item label="大"
        ><u-number-input
          v-model="theme.gap.large"
          :step="1"
          :min="0"
          :clearable="false"
      /></theme-item>
    </theme-group>
    <theme-group title="断点"> </theme-group>
  </div>
</template>

<script lang="ts" setup>
import { theme } from '@ui/styles/theme'
import { bem } from '@ui/utils'
import { ThemeDIKey } from './di'
import { provide } from 'vue'
import ThemeGroup from './group.vue'
import ThemeItem from './group-item.vue'
import { UNumberInput } from '../number-input'

defineOptions({
  name: 'Theme'
})

const cls = bem('theme')

provide(ThemeDIKey, {
  cls
})
</script>
