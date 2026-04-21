# SCSS Foundation

## 基础引入方式

在消费组件样式时，优先使用：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';
```

这里依赖 Dart Sass 的 `NodePackageImporter` 与包导出的 `sass` 条件。

## 常用 mixin

源码：`packages/styles/src/_mixins.scss`

高频能力：

- `m.b('button')`
  生成 `.u-button { ... }`
- `m.e('icon')`
  生成 `&__icon`
- `m.m('large')`
  生成 `&--large`
- `m.em('item', 'active')`
  生成 `&__item--active`
- `m.is('disabled')`
  生成 `&.is-disabled`
- `m.size`
  遍历 `small/default/large`
- `m.css-var()`
  批量生成 CSS custom property
- `m.dark`
  按 `html[data-theme='dark']` 和系统深色偏好包裹规则

## 常用 function

源码：`packages/styles/src/_functions.scss`

高频能力：

- `fn.use-var(text-color, main)`
  读取 `var(--u-text-color-main)`
- `fn.component-var(button, height)`
  读取 `var(--u-button-height)`
- `fn.use-vars((border-color, bg-color-bottom))`
  连续读取多个变量
- `fn.bem(button, icon, active)`
  仅在 Sass 中拼 class selector

## 推荐的组件样式骨架

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;

@include m.b(button) {
  @include m.css-var(
    'u-button',
    (
      height: 32px,
      radius: 8px
    )
  );

  height: fn.component-var(button, height);

  @include m.e(icon) {
    color: fn.use-var(text-color, main);
  }

  @include m.m(primary) {
    color: fn.use-var(color, primary);
  }
}
```

## 放置规则

- 通用 mixin/function/变量放 `@veltra/styles`
- 组件局部 token 放各组件 `style.scss`
- 组件样式入口通过 `style.ts` 汇总依赖

不要把组件业务样式抽到 `@veltra/styles`，除非它真的是跨组件共享基础设施。
