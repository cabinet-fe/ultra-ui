# ultra-ui
给你带来极致性能, 极致代码, 极致体验的Vue3组件库

## 注释友好
我们为代码添加了提示完备的注释


## SSR支持
目前暂时不支持SSR

- [] 待后续再支持

## 主题策略
css的变量系统帮我们能完全解决了主题的问题

而css变量最核心的问题在于无法提供友好的类型支持

要完全使用主题的功能, 必须做出足够的约束, 我们希望任何样式能够使用以下的形式, 因此我们还选择使用[vanilla-extract/css](https://vanilla-extract.style/)

```ts
import { theme } from 'ultra-ui'

const style = {
  color: theme.color.primary
}
```


## 贡献指南

