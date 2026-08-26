# URadioGroup 分段控件变体

## 术语

- **variant**：RadioGroupProps 新增的样式变体属性，取 `'default' | 'button'`，缺省 `'default'`

## 领域

URadioGroup 通过 `variant` 属性切换外观，行为逻辑不变（点击更新 modelValue 并 emit change，参数为 item）。缺省与显式 `'default'` 渲染保持原样：每项带 radio 圆点、无 button 修饰类。`variant="button"` 时容器在原有 class 上追加 BEM button 修饰类，整组渲染为单一带边框圆角的分段壳（gap 为 0、overflow hidden），选项隐藏 radio 圆点仅留文字并居中；选中项以主色文字加 `fn.color-a(color, 8, primary)` 背景高亮，禁用项降透明度；焦点环由视觉隐藏的原生 input 的 focus-visible 驱动（label 不可聚焦）。playground 设置抽屉（`playground/App.vue`）中组件尺寸与圆角选择改用该变体替代手写分段控件。

## 影响文件

- 新增：`.changeset/radio-group-segmented.md`
- 新增：`packages/desktop/src/components/radio-group/__test__/radio-group.test.ts`
- 修改：`packages/desktop/src/types/radio-group.ts`
- 修改：`packages/desktop/src/components/radio-group/radio-group.vue`
- 修改：`packages/desktop/src/components/radio-group/style.scss`
- 修改：`playground/App.vue`

## 更新记录

- 2026-08-26：归档自 cooking/radio-group-segmented
