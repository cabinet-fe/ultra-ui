# Component Authoring

以下约定来自参考仓库的真实实现，适合拿来判断消费项目是否仍遵循原始组件库的编写方式。

## 新增或重构组件时按这个顺序做

1. 在 `src/components/<name>/` 创建组件目录
2. 在 `src/types/<name>.ts` 定义 `Props`、`Emits`、`_Exposed`、`Exposed`
3. 在组件里 `defineOptions({ name: 'Xxx' })`
4. 用 `bem('<name>')` 管 class
5. 写 `style.scss`
6. 写 `style.ts` 作为副作用入口
7. 在组件目录 `index.ts` 导出 `U<Name>`
8. 补 `src/components/index.ts`
9. 补 `src/types/index.ts`
10. 如需要 playground 示例，在 `playgrounds/desktop/src/<demo>/index.vue` 新增页面

## 组件实现骨架

标准骨架：

```vue
<script setup lang="ts">
import { bem } from '@veltra/utils'
import type { XxxProps, XxxEmits, _XxxExposed } from '../../types'

defineOptions({ name: 'Xxx' })

const props = defineProps<XxxProps>()
const emit = defineEmits<XxxEmits>()
const cls = bem('xxx')

defineExpose<_XxxExposed>({ /* ... */ })
</script>
```

## 类型文件约定

放在 `src/types/<name>.ts`，不是组件目录。

常用命名：

- `<Name>Props`
- `<Name>Emits`
- `_<Name>Exposed`
- `<Name>Exposed`

例如 `packages/desktop/src/types/button.ts`。

## `style.ts` 的职责

`style.ts` 不是可选装饰，它是组件样式副作用的 public 入口。

典型写法：

```ts
import '../icon/style'
import '@veltra/directives/ripple/style.js'
import './style.scss'
```

规则：

- 先引依赖样式
- 最后引自己的 `style.scss`
- 只有需要的依赖才引

## 表单组件模式

如果组件会放入 `UForm`：

```ts
const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])
```

再根据只读态决定是否渲染输入控件或 `FORM_EMPTY_CONTENT`。

参考：

- `packages/desktop/src/components/input/input.vue`
- `packages/desktop/src/components/select/select.vue`
- `packages/desktop/src/components/palette/palette.vue`

## 何时使用 `di.ts`

满足以下条件再建 `di.ts`：

- 存在稳定父子层级
- 子组件必须消费多个上下文字段
- prop drilling 已明显不合适

参考：

- `table/di.ts`
- `grid/di.ts`
- `menu/di.ts`
- `palette/di.ts`

## 变更后检查

- `components/index.ts` 是否导出
- `types/index.ts` 是否导出
- `style.ts` 是否补全
- 组件是否需要 demo
- 是否误把类型写回组件目录
