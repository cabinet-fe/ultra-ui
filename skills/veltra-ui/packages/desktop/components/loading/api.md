# ULoading — 加载

> `import type { LoadingProps, LoadingEmits, LoadingExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/loading.ts`

提供四种加载动画的组件和指令，尺寸可通过 `UConfig` 全局配置或逐级继承。

## Import

```ts
// ULoading 由 Vite 自动导入，无需手动 import
import { vLoading } from '@veltra/desktop'
```

## vLoading 指令

在目标元素上渲染全屏加载遮罩，加载期间阻止用户交互。

```vue
<div v-loading:[type]="loading">
  <!-- 内容区域 -->
</div>
```

- `loading`: `boolean` — 是否显示加载遮罩
- `type`（可选 argument）: `'classic' | 'line' | 'dot' | 'spinner'` — 指定动画类型

> 示例见 [examples.md](./examples.md)
