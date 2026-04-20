# 水平 tabs 胶囊圆角 + hover 出现的 close 按钮 + 填充宽度

## 补丁内容

用户反馈水平 tabs 的视觉与交互还差三点：

1. **关闭图标仅 hover 时出现**，并带有出现动画（而非持续显示）。
2. **支持 100% 宽度**：当父容器较宽时，背景条完整铺开；tab-item 自身宽度保持不变。
3. **圆角不够圆**：应为 round（胶囊/药丸状），而非现在的 `radius.default`（6px）。

### 1. 类型 API 扩展（`packages/desktop/src/types/tabs.ts`）

在 `TabsProps` 与 `TabsHorizontalProps` 中新增 `block?: boolean`，默认 `false`。
组合版的注释中说明该属性仅在 `position=top/bottom` 生效（垂直场景不承担铺满背景角色）。
未改动事件签名与 Exposed 类型。

### 2. 组件透传（`packages/desktop/src/components/tabs/tabs.vue`、`tabs-horizontal.vue`）

- `tabs.vue`：`withDefaults` 中为 `block` 设置默认值 `false`，并将 `:block="block"` 透传给 `<u-tabs-horizontal>`（垂直分支不需要）。
- `tabs-horizontal.vue`：
  - props 增加 `block?: boolean`（默认 `false`）。
  - 根 `div` 的 class 数组增加 `bem.is('block', block)`，输出 `is-block` 修饰符。

### 3. 样式改造（`packages/desktop/src/components/tabs/style.scss`）

关键变更：

- **胶囊圆角**：`$list-radius` / `$item-radius` 由 `fn.use-var(radius, default|small)` 改为 `9999px`。`__close` 按钮的 `border-radius` 也改为 `9999px`，保持视觉一致。`is(not-rounded)` 分支追加 `__close { border-radius: 0 }`，保证直角模式一致。
- **close hover 出现动画**：
  - `__close` 基础规则追加 `opacity: 1; transform: scale(1);`，`transition` 扩展为同时过渡 `opacity`/`transform`/`color`/`background-color`（约 0.18s/0.15s ease）。
  - 新增水平专属规则 `@include position((top, bottom), header-item)`：默认 `__close { opacity: 0; transform: scale(0.6); pointer-events: none; }`；当 `header-item:hover / :focus-visible / :focus-within` 时恢复 `opacity: 1; transform: scale(1); pointer-events: auto;`。`:focus-within` 让键盘 Tab 进入 close 按钮时也可见，兼顾可访问性。
  - 垂直布局（left/right）不受影响，`__close` 保持常驻显示。
- **is-block 填充宽度**：新增 `@include m.is(block) { __header-wrap { display: flex; width: 100%; max-width: 100%; align-self: stretch; } }`。由于 `__viewport { flex: 1 1 auto; }`，item 自身宽度维持（不被拉伸），多余空间由 viewport 吸收，整体背景条铺满父容器。

### 4. Playground 同步（`playgrounds/desktop/src/tabs/index.vue`）

- `configList` 新增 `{ label: '填充宽度', key: 'block' }`；`config` 新增 `block: false`。
- `<u-tabs>`（组合版 + Dialog 内）与 `<u-tabs-horizontal>` 都绑定 `:block="config.block"`，方便同时验证四种场景。

### 5. 验证

- `bun run check-types`：通过。
- `bun run lint`：0 errors（警告为已有遗留，与本次无关）。
- Playground 浏览器手工验证：
  - 默认胶囊圆角（UTabs / UTabsHorizontal 均为 pill 形状）。
  - 勾选「可关闭」后，tab 上无常驻 × 图标；hover/聚焦时 × 以渐显 + 放大动画出现（由 CSS 过渡驱动）。
  - 勾选「填充宽度」后，`__header-wrap` 背景条铺满父容器；tab-item 自身宽度不变（首页/Tab A 等保持原尺寸）。
  - 垂直布局（left/right）不受 `block` 影响，close 按钮保持常驻。
  - 控制台无业务相关报错（仅有与本次无关的 `--color-primary` 命名空间弃用提示）。

## 影响范围

- 修改文件: `packages/desktop/src/types/tabs.ts`
- 修改文件: `packages/desktop/src/components/tabs/tabs.vue`
- 修改文件: `packages/desktop/src/components/tabs/tabs-horizontal.vue`
- 修改文件: `packages/desktop/src/components/tabs/style.scss`
- 修改文件: `playgrounds/desktop/src/tabs/index.vue`
