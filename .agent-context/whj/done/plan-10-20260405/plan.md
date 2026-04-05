# 新增数字范围输入组件（UNumberRangeInput）

> 状态: 已执行

## 目标

在组件库中新增 `number-range-input`：用两个数字输入框录入区间，支持表单上下文（size / disabled / readonly）、与 `UNumberInput` 一致的数值类 props（min、max、step、精度等），`v-model` 类型为 `[number | undefined, number | undefined]`。当两侧均有值时自动保持起始不大于结束（改一侧时钳制另一侧）。提供 `sample/src/number-range-input` 示例页并完成导出与全量安装样式注册。

## 内容

1. 在 `ui/types/components/number-range-input.ts` 定义 `NumberRangeInputProps`（在 `NumberInputProps` 上去掉 `modelValue`、`placeholder`，增加 `modelValue?: [number | undefined, number | undefined]`、`startPlaceholder`、`endPlaceholder`、`separator`）、`NumberRangeInputEmits`、`NumberRangeInputExposed`，并在 `ui/types/index.ts` 增加 `export *`。
2. 新增目录 `ui/components/number-range-input/`：`number-range-input.vue`（`defineOptions` 名 `NumberRangeInput`）、`index.ts` 导出 `UNumberRangeInput`、`style.scss`（BEM `number-range-input`，横向排列与分隔符样式）、`style.ts`（引入 `number-input/style` 与本组件 scss）。
3. 组件实现：`useFormComponent` + `useFormFallbackProps`；非只读时渲染两个 `UNumberInput` 与中间分隔符；通过计算属性 setter 在更新一侧时若与另一侧冲突则钳制另一侧；`@change` 时向父组件 `emit('change', tuple)`；只读时展示带 `prefix`/`suffix` 的区间文本，双空为 `FORM_EMPTY_CONTENT`。
4. 在 `ui/components/index.ts` 增加 `export * from './number-range-input'`；在 `ui/install.ts` 增加 `./components/number-range-input/style` 导入（与 `number-input` 相邻）。
5. 新增 `sample/src/number-range-input/index.vue`：基础绑定、`min`/`max`/`step`、禁用与只读示例。
6. 运行 `bun vitest`，修复因本次改动导致的失败用例。

## 影响范围

- `ui/types/components/number-range-input.ts`（新建）
- `ui/types/index.ts`
- `ui/components/number-range-input/`（新建：`number-range-input.vue`、`index.ts`、`style.scss`、`style.ts`）
- `ui/components/index.ts`
- `ui/install.ts`
- `sample/src/number-range-input/index.vue`（新建）
- `sample/components.d.ts`（构建/插件自动补全 `UNumberRangeInput` 全局类型）
- `ui/components/input/input.vue`
- `ui/components/input/style.scss`

## 历史补丁

- patch-1: 拆分 v-model 与清空按钮占位
