# API Map

## 目录总览

`@veltra/utils` 当前由这些模块构成：

- `src/index.ts`
  聚合导出 `dom/*`、`form/validate`、`helper/*`、`reactive/proxy`、`shared`、`types`
- `src/dom/`
  DOM 操作与样式辅助
- `src/form/validate.ts`
  表单规则校验器
- `src/helper/`
  BEM、动画帧、补间、Vue vnode helper、toggle/increase 等通用工具
- `src/reactive/proxy.ts`
  响应式代理类工具
- `src/shared/`
  常量
- `src/types/`
  共享类型定义

## public exports 与子路径

- `@veltra/utils`
  默认入口，聚合 helper、constant、type
- `@veltra/utils/types`
  仅类型入口
- `@veltra/utils/types/*`
  直接读取子类型文件
- `@veltra/utils/shared`
  共享常量

## 高频能力

### class-name / BEM

源码：

- `packages/utils/src/dom/class-name.ts`
- `packages/utils/src/helper/make-bem.ts`

要点：

- `bem('button').b` 产出 `u-button`
- `bem('button').e('icon')` 产出 `u-button__icon`
- `bem('button').m('large')` 产出 `u-button--large`
- `bem.is('disabled', cond)` 产出 `is-disabled` 或空字符串
- class 前缀来自 `CLS_PREFIX = 'u-'`

### 表单校验

源码：

- `packages/utils/src/form/validate.ts`
- `packages/utils/src/types/utils/form/validate.ts`

要点：

- `Validator` 同时支持单条与多条数据校验
- 默认 `lazy = true`，同字段首个失败规则后停止
- 预设 `preset` 当前内建：`email`、`phone`、`num`、`url`、`idCard`
- `required` 总是优先于其它规则

### Vue / vnode helper

源码：

- `packages/utils/src/helper/vue.ts`

要点：

- `extractNormalVNodes()` 会拍平 `Fragment`/`template`
- 标量 children 会转换为 text vnode
- `shallowComputed()` 返回 `ShallowRef` 而不是标准 `computed`

### shared constant

源码：

- `packages/utils/src/shared/constants.ts`

常用值：

- `NAME_SPACE = 'U'`
- `CLS_PREFIX = 'u-'`
- `FORM_EMPTY_CONTENT = '-'`

### 共享类型

源码：

- `packages/utils/src/types/component-common.ts`
- `packages/utils/src/types/form-context.ts`
- `packages/utils/src/types/helper.ts`

高频类型：

- `ComponentSize = 'small' | 'default' | 'large'`
- `ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'`
- `ComponentProps`
- `FormComponentProps`

## 依赖边界

- 运行时依赖：`@cat-kit/core`
- peer：`vue`
- 上游消费者：`@veltra/compositions`、`@veltra/directives`、`@veltra/desktop`

不要把上游包的语义回灌进这里。`utils` 只负责通用能力，不负责组件业务。
