# SCSS

## 导入

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';
```

注意，使用 `pkg` 协议时，需要在下游项目中的 `vite.config.ts` 文件中添加以下配置:

```ts
//...其它导入
import { NodePackageImporter } from 'sass-embedded'

defineConfig({
  // ...其它配置
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } } }
})
```

## BEM

```scss
@include m.b(button) {
  @include m.e(icon) {
  }

  @include m.m(primary) {
  }

  @include m.is(disabled) {
  }
}
```

输出规则：

```scss
@include m.b(button) {
} // .u-button
@include m.e(icon) {
} // &__icon
@include m.m(primary) {
} // &--primary
@include m.em(icon, left) {
} // &__icon--left
@include m.bem(button, icon, left) {
} // .u-button__icon--left
```

## 变量函数

```scss
.box {
  color: fn.use-var(text-color, main); // var(--u-text-color-main)
  background: fn.use-var(bg-color, top); // var(--u-bg-color-top)
  border: fn.use-var(border); // var(--u-border)
  box-shadow: fn.use-var(shadow); // var(--u-shadow)
  height: fn.component-var(button, height, 32px); // var(--u-button-height, 32px)
}
```

## 尺寸、暗色、断点

```scss
@include m.size using ($size) {
  height: fn.use-var(form-component-height, $size);
}

@include m.dark {
  background: fn.use-var(bg-color, bottom);
}

@include m.md {
  width: 100%;
}
```

## 自定义命名空间

你可以在下游项目中转发 veltra-ui 的 mixins 和 functions，并通过简单地覆盖命名空间来扩展出自己的 mixins 和 functions。

命名空间变量名为 `$namespace`，默认值为 `u`。覆盖后 BEM 类名和 CSS 变量前缀同步变化。

推荐使用转发来定义一个独立的 `_mixins.scss`/`_functions.scss_` 文件，使用时直接引用即可。

```scss
// my-app/.../_mixins.scss
@forward 'pkg:@veltra/styles/mixins' with (
  $namespace: 'my-app'
);

// 使用
@use 'pkg:@veltra/styles/mixins' as m;
@use '../.../_mixins.scss' as m2;

@include m.b(button) {
}
// 编译成 .u-button

@include m2.b(button) {
}
// 编译成 .my-app-button
```
