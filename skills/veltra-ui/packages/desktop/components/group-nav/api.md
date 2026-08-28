# UGroupNav - 分组导航

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 备注

外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见 `../../../styles/theme.md`「侧栏导航外观」。
