# core — 执行控制

## 何时使用

防抖、节流、延时、限并发任务、捕获同步异常。

## 推荐公开 API

`debounce`、`throttle`、`sleep`、`parallel`、`safeRun`

```ts
import { debounce, parallel, sleep } from '@cat-kit/core'

const onResize = debounce(() => {}, 300)
await parallel([async () => 1, async () => 2], { concurrency: 1 })
await sleep(100)
```

详情见 [apis.md](apis.md)。

## 约束

- `debounce` 默认 `300ms`、`immediate: true`；窗口内再调用最终 trailing 一次
- `throttle` 仅 leading；被抑制调用返回最近一次结果
- `parallel` 保持结果顺序；默认全并发；`concurrency` 须为正整数；拒绝后已启动任务不取消
- `safeRun` 只捕获同步抛错

## 类型入口

[timer.d.ts](../../../generated/core/optimize/timer.d.ts) · [parallel.d.ts](../../../generated/core/optimize/parallel.d.ts) · [safe.d.ts](../../../generated/core/optimize/safe.d.ts)
