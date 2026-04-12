# Source Discovery

## 目标

这个 skill 被复制到别的项目后，不要先假设当前仓库里仍然有 `packages/utils/`。先确认消费项目里能看到哪一层产物。

## 优先级顺序

1. workspace 源码
2. `node_modules/@veltra/utils` 安装产物
3. `dist/*.d.ts` + `package.json.exports`
4. 仅有运行时代码时，再从 import 反推入口

## 推荐定位流程

先在项目根查这些位置：

```bash
rg --files . | rg '(@veltra/utils|packages/utils|node_modules/.*/@veltra/utils)'
```

再查 package manifest：

```bash
rg -n '"@veltra/utils"|name\": \"@veltra/utils\"|exports|types' package.json node_modules/@veltra/utils/package.json packages/utils/package.json
```

## 找到源码时怎么读

如果存在 workspace 目录：

- 先看 `src/index.ts`
- 再看 `src/types/`
- 最后看具体 helper 文件

如果只有安装产物：

- 先看 `package.json.exports`
- 再看 `dist/index.d.ts` 与 `dist/types/*.d.ts`
- 若 `development` 条件暴露源码路径，再继续追到 `src/*`

## 没有源码时的退化策略

只拿到安装包也能完成大部分文档任务：

- 用 `package.json.exports` 判断 public surface
- 用 `.d.ts` 还原 API
- 用已编译 `dist/*.js` 验证真实运行时行为

如果安装包里没有 `src/`，不要继续假设存在 monorepo 源码。
