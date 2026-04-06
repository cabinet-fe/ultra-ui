# release 标签取消覆盖时跳过推送标签

## 补丁内容

`createTag` 在「标签已存在且用户选择不覆盖」时提前返回，但 `release` 仍执行 `git push origin v*`，可能与用户意图不符。现改为 `createTag` 返回是否成功创建标签，`release` 仅在 `tagged === true` 时推送标签；并修正成功日志文案。

## 影响范围

- 修改文件: `build/release.ts`
