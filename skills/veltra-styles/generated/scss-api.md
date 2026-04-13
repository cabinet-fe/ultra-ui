# SCSS API（mixins / functions / vars）

## `_mixins.scss`

```scss
// 来源: packages/styles/src/_mixins.scss
@use 'vars';
@use 'sass:list';
@use 'sass:map';
@use 'functions' as fn;

/** flex布局 */
@mixin flex($display: flex, $justify: flex-start, $align: center, $wrap: nowrap) {
  display: $display;
  justify-content: $justify;
  align-items: $align;
  flex-wrap: $wrap;
}

@mixin size {
  @each $size in vars.$sizes {
    &--#{$size} {
      @content ($size);
    }
  }
}

@mixin b($blocks...) {
  @each $block in $blocks {
    .#{vars.$namespace}#{$block} {
      @content;
    }
  }
}

@mixin e($elements...) {
  $selector-list: null;

  @each $element in $elements {
    @if ($selector-list != null) {
      $selector-list: #{$selector-list} + ', &__' + #{$element};
    } @else {
      $selector-list: '&__' + #{$element};
    }
  }

  #{$selector-list} {
    @content;
  }
}

@mixin m($modifiers...) {
  $selector-list: null;

  @each $modifier in $modifiers {
    @if ($selector-list != null) {
      $selector-list: #{$selector-list} + ', &--' + #{$modifier};
    } @else {
      $selector-list: '&--' + #{$modifier};
    }
  }

  #{$selector-list} {
    @content;
  }
}

@mixin em($element, $modifier) {
  $selector: '&__' + #{$element} + '--' + $modifier;
  #{$selector} {
    @content;
  }
}

@mixin is($types...) {
  @each $type in $types {
    &.is-#{$type} {
      @content;
    }
  }
}

@mixin bem($b, $e: null, $m: null) {
  $b: '.' + vars.$namespace + $b;

  @if ($e != null) {
    @each $ei in $e {
      @if ($m != null) {
        @each $mi in $m {
          #{$b + '__' + $ei + '--' + $mi} {
            @content;
          }
        }
      } @else {
        #{$b + '__' + $ei} {
          @content;
        }
      }
    }
  } @else {
    #{$b} {
      @content;
    }
  }
}

@mixin ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/**
* 设置css变量
* 参数1:变量前缀
* 参数2: 一个由值组成的列表或者由key, value组成的map
* css-var(height, (
*   large: 40px
*   default: 32px
*   small: 24px
* ))
* 生成的css变量:
* --u-height-large: 40px;
* --u-height-default: 32px;
* --u-height-small: 24px;
*/
@mixin css-var($prefix, $list) {
  @each $type, $value in $list {
    @if $value == null {
      --#{$prefix}: #{$type};
    } @else {
      // "" + $type用于消除警告
      --#{$prefix}-#{"" + $type}: #{$value};
    }
  }
}

@function breakpoint($point) {
  @return var(--u-breakpoint-#{$point});
}

/** 暗色：data-theme 与系统偏好，与 UITheme.injectBuiltInThemes 选择器策略一致 */
@mixin dark {
  html[data-theme='dark'] & {
    @content;
  }

  @media (prefers-color-scheme: dark) {
    html:not([data-theme='light']) & {
      @content;
    }
  }
}

@mixin xs {
  @media screen and (min-width: 0) and (max-width: breakpoint(xs)) {
    @content;
  }
}

@mixin sm {
  @media screen and (min-width: breakpoint(xs)) and (max-width: breakpoint(sm)) {
    @content;
  }
}

@mixin md {
  @media screen and (min-width: breakpoint(sm)) and (max-width: breakpoint(md)) {
    @content;
  }
}

@mixin lg {
  @media screen and (min-width: breakpoint( md)) and (max-width: breakpoint(lg)) {
    @content;
  }
}

@mixin xl {
  @media screen and (min-width: breakpoint(lg)) {
    @content;
  }
}
```

## `_functions.scss`

```scss
// 来源: packages/styles/src/_functions.scss
@use 'vars';
@use 'sass:list';

// 使用单个变量（全局主题 token，`--u-*`）
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--u-#{$basename}#{$suffix});
}

// 组件级 token：`var(--u-{component}-{property}[, fallback])`
@function component-var($component, $property, $fallback: null) {
  @if $fallback == null {
    @return var(--u-#{$component}-#{$property});
  }

  @return var(--u-#{$component}-#{$property}, #{$fallback});
}

// 使用多个变量
@function use-vars($vars, $separator: ' ') {
  $result: '';
  $len: list.length($vars);
  @for $i from 1 to $len {
    $result: $result + use-var(list.nth($vars, $i)) + $separator;
  }

  $result: $result + use-var(list.nth($vars, $len));

  @return $result;
}

// bem的函数
@function bem($b, $e: null, $m: null) {
  $b: '.' + vars.$namespace + $b;
  @if ($e != null) {
    $b: $b + '__' + $e;
  }

  @if ($m != null) {
    $b: $b + '--' + $m;
  }

  @return $b;
}
```

## `_vars.scss`

```scss
// 来源: packages/styles/src/_vars.scss
@use 'sass:map';

$namespace: 'u-';

// 与全局 CSS 变量对齐的语义化别名（便于 SCSS 中直接引用）
$color-primary: var(--u-color-primary);
$text-color-main: var(--u-text-color-main);
$border-color: var(--u-border-color);
$bg-color-top: var(--u-bg-color-top);

// 定义size映射的函数, 保证尺寸的统一性, size-vars(small, default, large)
// 例子：
// size-vars((height: 24px), (height: 32px), (height: 40px))
// 生成:
//  (small: (height: 24px), default: (height: 32px), large: (height: 40px))
@function size-vars($sizes...) {
  $size-types: (small, default, large);
  $size-result: ();

  @for $i from 1 through length($size-types) {
    $size-result: map.merge($size-result, (#{nth($size-types, $i)}: nth($sizes, $i)));
  }
  @return $size-result;
}

$sizes: (small, default, large);

// 颜色类别
$color-types: (
  // 品牌色
  primary,
  // 成功色
  success,
  // 警告色
  warning,
  // 危险色
  danger,
  // 信息
  info,
  // 禁用色
  disabled,
  // 默认色
  default
);
```

