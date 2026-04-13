---
name: veltra-directives
description: >
  @veltra/directives Vue 自定义指令文档（vFocus、vClickOutside、vRipple）。
  当涉及指令、directive、聚焦、点击外部关闭、水波纹、ripple 样式引入时使用。
  完整源码见 generated/api-reference.md。
---

# veltra-directives

## 生成物

| 文件 | 内容 |
|------|------|
| [generated/api-reference.md](generated/api-reference.md) | 各指令目录下 `.ts` 与 ripple 的 `.scss` 源码 |
| [generated/manifest.json](generated/manifest.json) | 同步时间与文件列表 |

根目录执行 `bun run sync-veltra-directives` 可重新生成 `generated/`。

## 指令速查

### `vFocus`

挂载时聚焦：可直接用在 `<input>` 上，或用在容器上由指令在内部查找 `input`。

```vue
<input v-focus />
<div v-focus>
  <input />
</div>
```

### `vClickOutside`

在元素外按下并点击时触发回调（常用于关闭浮层）。

```vue
<div v-click-outside="handleClose">...</div>
```

```ts
function handleClose() {
  open.value = false
}
```

### `vRipple`

- 默认启用：`<button v-ripple>`
- 禁用：`<button v-ripple="false">`
- 自定义动画时长（毫秒，指令 arg）：`<button v-ripple:300>`
- 自定义波纹元素类名：`<button v-ripple="'my-ripple-class'">`

## 注册方式

**全局**：在消费项目中通常使用根目录 `README.md` 的完整引入方式：`import { UltraUI } from 'ultra-ui/install'` 后 `app.use(UltraUI)`，会注册组件与附带指令（含上述三者）。在 monorepo 内联 `@veltra/desktop` 时，以当前应用使用的安装入口为准。

**按需**：

```typescript
import { vFocus, vClickOutside, vRipple } from '@veltra/directives'

app.directive('focus', vFocus)
app.directive('click-outside', vClickOutside)
app.directive('ripple', vRipple)
```

（模板中 `v-focus` 对应注册名 `focus`，依此类推。）

## 样式依赖

`vRipple` 依赖波纹样式，按需构建时需单独引入：

```typescript
import '@veltra/directives/ripple/style'
```

否则波纹无视觉样式；走 `UltraUI` 全量安装并已引入全量样式时，一般已包含波纹样式链路。
