# Architecture

以下内容描述的是这个 skill 随附参考仓库里观察到的 `@veltra/desktop` 结构，用来帮助你在其它项目中建立心智模型，不代表消费项目本地一定保留完全相同的目录。

## 包结构

`@veltra/desktop` 当前由两条主线组成：

- `src/components/`
  70 个组件目录，每个目录至少有组件实现与 `index.ts`
- `src/types/`
  77 个类型文件，统一对外暴露 props / emits / exposed

入口：

- `src/index.ts`
  `export * from './components'` + `export type * from './types'`
- `src/components/index.ts`
  组件 barrel
- `src/types/index.ts`
  类型 barrel

## 单个组件的标准解剖

典型目录：

```text
src/components/<name>/
  <name>.vue
  index.ts
  style.ts
  style.scss
  use-*.ts
  di.ts
```

配套类型：

```text
src/types/<name>.ts
```

核心规则：

- 组件实现和类型文件分离
- `style.ts` 先引依赖组件/指令样式，再引本组件 `style.scss`
- `di.ts` 只在父子上下文明显稳定时引入

## 典型依赖链

- `@veltra/utils`
  提供 BEM、shared type、DOM helper
- `@veltra/compositions`
  提供 form/config/model/pop/virtual 等组合式逻辑
- `@veltra/directives`
  提供 `vFocus`、`vClickOutside`、`vRipple`
- `@veltra/styles`
  提供 Sass 基础设施与 theme runtime
- `@veltra/icons`
  提供图标 SFC

## 组件模式示例

### 基础按钮类组件

看：

- `packages/desktop/src/components/button/button.vue`
- `packages/desktop/src/types/button.ts`
- `packages/desktop/src/components/button/style.ts`

特点：

- `bem('button')`
- size 来自 `useFallbackProps()`
- 指令直接在组件内用 `vRipple`
- 暴露值通过 `_ButtonExposed`

### 表单容器

看：

- `packages/desktop/src/components/form/form.vue`
- `packages/desktop/src/types/form.ts`

特点：

- `useFormComponent(props)` 作为 provider
- 插槽节点会被拦截和自动包装成 `u-form-item`

### 复杂数据组件

看：

- `packages/desktop/src/components/table/table.vue`
- `packages/desktop/src/types/table.ts`

特点：

- `provide(TableDIKey, context)`
- 组合使用 `useRows`、`useColumns`、`useCheck`、`useVirtual`

## 当前仓库里的真实偏差

这是使用本包时必须知道的现状：

- `packages/desktop/AGENTS.md` 与 `packages/desktop/tsdown.config.ts` 都提到 `src/install.ts`
- 但当前工作树中不存在 `packages/desktop/src/install.ts`

因此：

- 不要把 `@veltra/desktop/install` 当成已验证可用的现成实现
- 需要全局安装能力时，先重新确认当前分支是否补回了该文件

另一个偏差：

- playground 中 demo 目录名 `contextmenu`
- 真实组件目录名 `context-menu`

不要把 demo 目录名误认成组件目录规范。
