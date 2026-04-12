# Source Discovery

## 目标

skill 被复制到其它项目后，先判断你手里是：

- workspace 源码
- 安装到 `node_modules` 的包
- 只剩编译产物和 `.d.ts`

不要默认存在当前仓库里的 `packages/styles/`。

## 推荐定位流程

```bash
rg --files . | rg '(@veltra/styles|packages/styles|node_modules/.*/@veltra/styles)'
```

再查这些关键文件：

```bash
rg -n '"@veltra/styles"|sass|exports|theme' package.json node_modules/@veltra/styles/package.json packages/styles/package.json
```

## 需要额外确认的内容

对 `@veltra/styles`，只定位包目录还不够，还要确认消费项目是否具备：

- Sass 编译器
- `NodePackageImporter`
- 对 `sass` 条件导出的支持

因此还要查：

```bash
rg -n 'NodePackageImporter|sass-embedded|pkg:@veltra/styles' .
```

## 没有源码时怎么退化

如果只有安装包：

- 先看 `package.json.exports`
- 再看 `.d.ts`
- 再看是否包含原始 `.scss`

如果包只发布了 `dist` 和 `src/*.scss`，那已经足够做文档用途；不要把“没有 monorepo 源码”误判成“无法分析”。
