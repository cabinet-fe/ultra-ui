# useConfig 示例

## 读写全局配置

```ts
import { useConfig } from '@veltra/compositions'

const { config, setConfig } = useConfig()

setConfig({ size: 'large', animation: false })
setConfig({ form: { labelWidth: 120 } }) // 深合并

config.size // ComponentSize
config.animation // boolean
config.form.labelWidth // number | string
config.paginator.pageSize // number
config.paginator.pageSizeOptions // number[]
```

## 直接切换文档尺寸类

```ts
import { setDocumentSize } from '@veltra/compositions'

setDocumentSize('large', 'default') // 切换 <html> 上的 size 类
```
