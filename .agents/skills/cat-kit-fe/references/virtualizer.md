# fe — virtualizer

**权威 typings**：[`generated/fe/virtualizer/index.d.ts`](../generated/virtualizer/index.d.ts)

## 公共 API 速查

### 构造与生命周期

| API | 签名 | 关键行为 |
| --- | --- | --- |
| `new Virtualizer(options?)` | `(options?: VirtualizerOptions) => Virtualizer` | 不挂载 DOM；`initialOffset` / `initialViewport` 仅构造时生效，供 SSR 占位 |
| `.connect(element)` | `(el: HTMLElement \| null) => this` | 绑定滚动容器；传相同元素只 `syncFromElement`、传不同元素先 `disconnect`、传 `null` 等价 `disconnect`。订阅 `scroll`（驱动 `offset`/`isScrolling`）、原生 `scrollend` 或 120ms 兜底计时器、`ResizeObserver`（驱动 `viewportSize`） |
| `.disconnect()` | `() => this` | 取消 rAF 校准、卸下事件与 RO、清空 `mounted`；**不**清测量缓存与订阅者，实例可复用 |
| `.destroy()` | `() => void` | `disconnect` + 释放 `ResizeTracker` + 清订阅者。Vue `onBeforeUnmount` / React cleanup 必须调用 |

### 选项与尺寸更新

| API | 签名 | 关键行为 |
| --- | --- | --- |
| `.setOptions(options)` | `(options: VirtualizerOptions) => this` | 部分更新；`getItemKey` 先于 `count` 应用；`initialOffset` / `initialViewport` 在此处无效 |
| `.setCount(count)` | `(count: number) => this` | 收缩时剪裁测量缓存与 `mounted`；扩张时新项走估值；未变化为 no-op |
| `.setViewport(size)` | `(size: number) => this` | 一般由 `ResizeObserver` 自动同步；SSR / 测试手动调用 |
| `.setOffset(offset)` | `(offset: number) => this` | 只更新逻辑 offset，**不写 DOM**；要真实跳转请用 `scrollToOffset` |

### 测量

| API | 签名 | 关键行为 |
| --- | --- | --- |
| `.measure(index, size)` | `(index: number, size: number) => this` | 单条；越界静默忽略 |
| `.measureMany(records)` | `(records: Iterable<{index, size}>) => this` | 批量；同批次视口前方项的 scroll 补偿合并为一次 DOM 写入 |
| `.measureElement(index, el)` | `(index: number, el: Element \| null) => void` | 异步 RO 优先，回退 `getBoundingClientRect`；`el: null` → `unobserve`；keyed 模式下同一 element 迁移 index 时自动清理旧 `mounted` 条目 |

### 滚动

| API | 签名 | 关键行为 |
| --- | --- | --- |
| `.scrollToOffset(offset, options?)` | `(offset: number, { behavior? }) => this` | `align` 对本方法无效；`behavior: 'smooth'` 走 rAF 校准 |
| `.scrollToIndex(index, options?)` | `(index: number, { align?, behavior? }) => this` | `align` 默认 `'auto'`（仅视口外才滚）；`count === 0` no-op；`behavior: 'smooth'` 时动画期间若测量漂移自动 `behavior: 'auto'` 修正目标 |

### 快照、订阅、读取

| API | 签名 | 关键行为 |
| --- | --- | --- |
| `.getSnapshot()` | `() => VirtualSnapshot` | **同一对象引用在纯 offset 帧保留不变**；禁止用 `===` 判重渲染，应比结构字段或走 `subscribe` |
| `.subscribe(listener)` | `(listener) => () => void` | 注册时立即同步回调一次；只在结构性变化时推送；纯 offset 不触发；返回取消函数 |
| `.getItem(index)` | `(index: number) => VirtualItem` | 越界抛 `RangeError`；业务侧可见性计算用 |
| `.reset()` | `() => this` | 清测量缓存 + 位置缓存 + 取消 rAF + `offset = 0`；**不**解绑容器、**不**清订阅者；仅用于数据源整体替换 |

## 使用备注

- `measureElement()` 在支持 `ResizeObserver` 的浏览器里优先走异步观察，避免新挂载项在滚动中立刻同步 `getBoundingClientRect()`。
- 如果列表项尺寸本来就是数据层已知值，优先用 `measureMany()` 批量上报，次选 `measure(index, size)`；这样可以把性能压力集中在虚拟滚动本身，而不是 DOM 测量或同帧多次重算。
- `useMeasuredAverage` 默认开启，适合 `estimateSize` 只能给近似值的场景；它会在平均值明显漂移时回刷未测区间，但不会把每次测量都放大成整表重算。
- `subscribe()` 是“结构变化订阅”，不是逐像素滚动流：`range`、`items`、`totalSize`、`viewportSize`、`isScrolling` 变化时才会推送；纯 `offset` 变化请直接读容器滚动位置。
- 在 Vue/React 里接 `Virtualizer` 时，避免把 FPS 面板、压测计数器、调试按钮这类每帧变化的状态和虚拟列表放在同一棵高频重渲染树里；必要时用 DOM 直写、子组件隔离或 `v-memo`/memo 保住列表渲染预算。
- 对静态行高或静态列宽这类不会变化的样式，优先缓存成稳定对象再绑定，减少滚动时重复分配和 patch 成本。
- 如果宿主框架在一次滚动手势里会收到多次 `scroll`/订阅回调，优先按 `requestAnimationFrame` 合帧后再提交 snapshot，避免一帧内重复 render。
- 极致性能场景（大表格、已知行高、滚动关键路径）里，应让宿主框架只渲染一次静态骨架（Vue 可用 `<tbody v-once>` / React 可用记忆化容器 + ref），滚动过程中由 `subscribe` 回调里纯 JS 原生 DOM API 管理行节点池：每个 `index` 对应的节点创建一次即永久缓存，新旧 range 做差集算出最小 `insertBefore` / `removeChild` 集合，前后 spacer 仅写 `style.height`；这样能把框架 render 从滚动热路径彻底移除，实测 2000 行 × 20 列压测下 CPU 占用 ≤5%、FPS 稳定 120。
- 上条优化要求行高在数据层就已知，一次性 `measureMany(rows.map((r, i) => ({ index: i, size: r.height })))` 即可跳过 `ResizeObserver` 增量测量路径；若行高依赖 DOM 真实布局，仍需保留 `measureElement` 流程。
- 虚拟列表里的条纹、斑马纹、分组底色等**按位置**变化的样式，**严禁使用 `:nth-of-type` / `:nth-child` / `:nth-last-*`**：滚动时每次 `insertBefore` / `removeChild` 会让剩余节点的 DOM 兄弟位序整体 ±1，`nth-*` 命中集合随之翻转，浏览器被迫对所有可见行重算样式并重绘子单元 —— 一行滚动放大成 N×M 格 paint，在 120Hz 屏上是首位掉帧来源。必须在创建节点时基于**数据索引**打稳定类（如 `index & 1` → `row-stripe`），CSS 只匹配该稳定类；这样滚动中只有真正新增/移除的那几行会 paint，其余行的样式完全不动。
- `Virtualizer` 内部已经做了「结构未变的纯 `offset` 变化不分配新 snapshot」的优化：`getSnapshot()` 在 range / items / totalSize / viewportSize / isScrolling 都没有变化的滚动帧里返回同一对象引用，只就地更新 `offset` / `isScrolling`。业务侧不要把 snapshot 当作不可变值做 `===` 对比判断「是否需要重渲染」，请改为对比 `range`、`totalSize` 等结构字段，或直接走 `subscribe` 的结构化推送。
- `getItemKey`（可选，`(index: number) => number | string`）传入后，`measure` / `measureMany` / `measureElement` 拿到的 `index` 会经过 `getItemKey(index)` 解析为 key 写入内部缓存，因此同一个数据项在列表前插 / 乱序 / 中段删除后仍能复用真实测量、避免大面积估值重算与 `totalSize` 跳变；`setCount(n)` 收缩时不在 `[0, n)` 范围内的 key 会被自动清理。**必须在整个生命周期稳定**，不要基于 `Math.random()`、当前时间或每次渲染新建的对象引用生成 key，否则缓存识别会失效。
- `setOptions({ count, getItemKey })` 一次性同轮更新时，内部会**先**应用新的 `getItemKey`，再对 `count` 做剪裁——保证剪裁使用的 alive key 集合来自新映射，不会把数据重排后仍存活的测量误删。业务在「前插 / 删除旧项 / 替换数据源」的同一次事务里既传新的 `getItemKey`、又传新的 `count` 是推荐写法。
- 同一批 `measureMany()` / `ResizeObserver` 回调中若有多条视口前方项的尺寸变化（例如首屏大图加载完一起回调），内部会把 `scroll` 补偿累积成一次 `scrollTop` / `scrollLeft` 写入、`recompute()` 开头统一 flush。业务侧不用自己节流，批量 `measureMany()` 就是最优路径。
- 大列表远距离 `scrollToIndex(n, { behavior: 'smooth' })` / `scrollToOffset(px, { behavior: 'smooth' })` 时，浏览器原生平滑动画途中如果测量更新让目标 offset 漂移，`Virtualizer` 会用 rAF 校准循环自动以 `behavior: 'auto'` 跳到修正后的目标；用户手动滚动（反向抢占）或再次发起新的 `scrollTo*` 会立即终止校准，另有 5 秒硬性安全阀兜底。**smooth 期间 `snapshot.offset` 由 scroll 事件驱动，调用 `scrollTo*` 后不要立刻同步读取 `snapshot.offset` 等于目标值**；需要精确的中间状态请直接读容器 `scrollTop` / `scrollLeft` 或订阅 `subscribe`。
