# @cat-kit/tsconfig 示例

在项目根 `tsconfig.json` 中继承预设：

```json
{
  "extends": "@cat-kit/tsconfig/tsconfig.node.json",
  "compilerOptions": { "rootDir": "./src", "outDir": "./dist" },
  "include": ["src"]
}
```

将 `tsconfig.node.json` 换成 `tsconfig.web.json`、`tsconfig.bun.json` 或 `tsconfig.vue.json` 以匹配目标环境。

> 详见 `../../generated/tsconfig/`
