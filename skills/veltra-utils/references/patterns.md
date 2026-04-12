# Patterns

## 扩展 helper 前先做判断

按这个顺序落位：

1. DOM 读写、class、style、position、z-index 放到 `src/dom/`
2. 与 Vue vnode/ref 直接相关的轻量 helper 放到 `src/helper/vue.ts` 或新增 `src/helper/*`
3. 表单规则与验证器能力放到 `src/form/`
4. 纯类型放到 `src/types/`
5. 共享常量放到 `src/shared/`

如果能力已经强绑定某个组件或样式语义，不应放进 `utils`。

## 维持 BEM 约定

优先复用：

```ts
import { bem } from '@veltra/utils'

const cls = bem('button')
cls.b
cls.e('icon')
cls.m('primary')
bem.is('disabled', true)
```

不要在上层组件里手写 `u-*` 字符串去绕开 `bem()`，否则会削弱统一命名。

## 维持类型分层

- 组件通用属性放 `component-common.ts`
- 表单 provide/inject 约束放 `form-context.ts`
- 帮助类型与值解构类型放 `helper.ts`
- `desktop` 专属 props/type 不要回流到 `utils`

## 扩展 Validator 时遵守现有规则顺序

`Validator` 现在的语义是：

1. 先校验 `required`
2. 再校验普通规则
3. 最后执行异步/自定义 `validator`

新增规则时保持这个顺序，不要打乱已有错误优先级。

## 处理副作用时保持克制

`@veltra/utils` 当前只有极少数浏览器读写操作，但仍然不承担样式副作用。

- 可以做 `HTMLElement` class/style 操作
- 可以读取 `window.getComputedStyle`
- 不要在入口文件里自动注册全局监听
- 不要引入 SCSS、CSS、theme runtime

## 修改后检查

- 是否补上 `src/index.ts` 或 `src/types/index.ts` 导出
- 是否影响 `@veltra/compositions` / `@veltra/directives` / `@veltra/desktop` 的调用点
- 是否仍符合 `platform: neutral` 的构建定位
