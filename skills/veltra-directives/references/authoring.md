# Authoring

## 新增指令时使用的目录结构

```text
src/
  your-directive/
    index.ts
    style.ts
    style.scss
```

如果没有样式，可省略 `style.ts` 与 `style.scss`。

## 必做步骤

1. 在 `src/<directive>/index.ts` 导出 `vYourDirective`
2. 如有样式，新增 `style.ts` 并只做副作用 import
3. 在 `src/index.ts` 聚合导出
4. 如有新子路径，核对 `package.json.exports`

## 样式接入方式

当前 ripple 的样式入口是：

```ts
import './style.scss'
```

SCSS 内部应继续使用：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
```

并依赖构建配置中的 `NodePackageImporter`。

## 事件清理模式

文档级与全局级监听必须符合：

- 按“是否已有活跃实例”决定是否注册全局监听
- 指令 `updated` 能正确响应启停切换
- `unmounted` 总能清理实例与监听

`vClickOutside` 当前就是这套模式的标准实现。
