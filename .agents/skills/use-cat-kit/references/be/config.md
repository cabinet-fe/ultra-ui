# be — 配置管理

支持 YAML、TOML、JSON 格式。

```typescript
import { readConfig, writeConfig, ConfigManager } from '@cat-kit/be'

const config = await readConfig<T>('/path/config.yaml')
await writeConfig('/path/config.toml', data)

const mgr = new ConfigManager<T>({
  path: '/path/config.yaml',
  defaults: { port: 3000 },
  watch?: boolean,
  onChange?: (config) => {}
})
await mgr.load()
mgr.get('port')
mgr.set('debug', true)
await mgr.save()
mgr.dispose()
```
