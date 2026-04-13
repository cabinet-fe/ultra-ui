# BEM 类名工具（`bem` / `makeBEM`）

`@veltra/utils` 在运行时通过 `makeBEM(CLS_PREFIX)` 得到默认的 `bem`（前缀为 `u-`，见 `dom/class-name.ts`）。类型定义在 `helper/make-bem.ts`（同步见 `generated/api-reference.md`）。

## `BEM` 实例 API

由 `bem('blockName')` 得到的对象（类型参数简写为 `N` = 块名）：

| 成员 | 签名（概念） | 返回值 |
|------|----------------|--------|
| `b` | 块根类名字面量 | `` `${prefix}${N}` ``，默认如 `u-button` |
| `e(name)` | 元素名 | `` `${b}__${name}` `` |
| `m(mod)` | 修饰符 | `` `${b}--${mod}` `` |
| `em(e, m)` | 元素 + 修饰符 | `` `${b}__${e}--${m}` `` |
| `create(sub)` | 子块名 | 新的 `BEM` 实例，块名为 `` `${N}-${sub}` `` |

## `BEMFactory`（`makeBEM` 返回值 / 默认 `bem` 函数）

| 成员 | 说明 |
|------|------|
| 调用 `bem(name)` | 等价于上表，得到 `BEM` 实例 |
| `bem.is(name)` | 返回 `` `is-${name}` `` |
| `bem.is(name, condition)` | `condition === true` 时返回 `` `is-${name}` ``，否则 `''` |

`makeBEM<Prefix>(prefix)`：自定义块前缀（如 `''` 或 `` `${string}-` ``），得到带该前缀的工厂；工厂上同样挂载 `is`。

## 在 `.vue` 中的典型用法

以下片段来自 Ultra UI 的 `Button` 实现，展示块根、修饰符与 `is-*` 辅助类（消费侧写法相同，仅块名随组件变化）：

```vue
<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

const cls = bem('button')

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    props.type && cls.m('color-' + props.type),
    bem.is('circle', props.circle),
    bem.is('disabled', props.disabled),
    bem.is('loading', props.loading)
  ]
})
</script>
```

模板里也可写 `` :class="cls.e('icon')" `` 等形式，与 SCSS 中 `@use 'pkg:@veltra/styles/mixins'` 的 BEM 结构对应。

## `makeBEM` 自定义前缀

若需要非 `u-` 的前缀（少数场景），使用：

```typescript
import { makeBEM } from '@veltra/utils'

const xbem = makeBEM('my-' as const)
const root = xbem('widget').b // → my-widget
```

默认组件库内应优先使用导出的 `bem`（`u-`），与设计 token、样式 partial 一致。
