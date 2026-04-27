# @cat-kit/fe 示例

## 分块读文件

```ts
import { readChunks } from '@cat-kit/fe'

const file = document.querySelector('input[type=file]')!.files![0]
if (file) {
  for await (const chunk of readChunks(file, { chunkSize: 1024 * 1024 })) {
    console.log(`读取了 ${chunk.byteLength} 字节`)
  }
}
```

## 文件下载

```ts
import { saveBlob } from '@cat-kit/fe'

const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
saveBlob(blob, 'export.json')
```

## 剪贴板

```ts
import { clipboard, queryPermission } from '@cat-kit/fe'

if (await queryPermission('clipboard-write')) {
  await clipboard.copy('hello world')
}

// 多种格式
await clipboard.copy([
  new Blob(['<b>hello</b>'], { type: 'text/html' }),
  new Blob(['hello'], { type: 'text/plain' })
])

const text = await clipboard.readText()
```

## 类型安全的存储

```ts
import { storage, storageKey } from '@cat-kit/fe'

const tokenKey = storageKey<string>('token')
const userKey = storageKey<{ name: string }>('user')

storage.local.set(tokenKey, 'abc123', 86400) // 1 天过期
storage.local.set(userKey, { name: 'Alice' })

const token = storage.local.get(tokenKey)
const user = storage.local.get(userKey, { name: 'Guest' })
```

## Cookie

```ts
import { cookie } from '@cat-kit/fe'

cookie.set('theme', 'dark', { expires: 365 * 86400, sameSite: 'Lax' })
cookie.get('theme')     // 'dark'
cookie.has('theme')     // true
```

## Tween 动画

```ts
import { Tween, tweenEasings } from '@cat-kit/fe'

const el = document.getElementById('box')!

const tween = new Tween({
  from: 0,
  to: 200,
  duration: 600,
  easing: tweenEasings.easeOutQuad,
  onUpdate: ({ value }) => {
    el.style.transform = `translateX(${value}px)`
  },
  onFinish: () => console.log('done')
})

tween.play()
```

## Virtualizer 最小完整示例

见 [virtualizer.md](virtualizer.md) 完整的 API 速查表。

> 类型参考：`../../generated/fe/index.d.ts`
