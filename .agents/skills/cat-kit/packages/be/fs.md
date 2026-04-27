# be — fs

Node.js 文件系统操作工具，增强原生 `node:fs/promises`。

## 目录操作

### `readDir`

```ts
interface DirEntry {
  path: string          // 绝对路径
  relativePath: string  // 相对于根目录的路径
  name: string          // 文件/目录名
  depth: number         // 深度（根目录为 0）
  isFile: boolean
  isDirectory: boolean
  isSymbolicLink: boolean
}

function readDir(dir: string, options?: ReadDirOptions & { onlyFiles?: false }): Promise<DirEntry[]>
function readDir(dir: string, options: ReadDirOptions & { onlyFiles: true }): Promise<string[]>
```

递归读取目录内容。

- `recursive`：是否递归，默认 `true`
- `filter`：过滤函数 `(entry: DirEntry) => boolean`
- `onlyFiles`：为 `true` 时直接返回路径字符串数组

```ts
import { readDir } from '@cat-kit/be'

// 获取完整信息
const entries = await readDir('./src', { recursive: true })

// 只获取 .ts 文件路径
const files = await readDir('./src', { onlyFiles: true, filter: e => e.name.endsWith('.ts') })
```

### `ensureDir`

```ts
function ensureDir(dirPath: string): Promise<void>
```

确保目录存在，不存在则递归创建（等同 `mkdir -p`）。若路径存在但不是目录则抛错。

```ts
import { ensureDir } from '@cat-kit/be'

await ensureDir('./dist/assets')
```

### `emptyDir`

```ts
function emptyDir(dirPath: string): Promise<void>
```

确保目录为空：删除内部所有内容（保留目录本身），不存在则创建。

```ts
import { emptyDir } from '@cat-kit/be'

await emptyDir('./temp')
```

### `removePath`

```ts
function removePath(targetPath: string, options?: RemoveOptions): Promise<void>

interface RemoveOptions {
  force?: boolean  // 为 true 时忽略不存在的路径
}
```

删除文件或目录（递归删除，等同 `rm -rf`）。

```ts
import { removePath } from '@cat-kit/be'

await removePath('./dist', { force: true })
```

### `movePath`

```ts
function movePath(src: string, dest: string, options?: MoveOptions): Promise<void>

interface MoveOptions {
  overwrite?: boolean  // 为 true 时覆盖已存在的目标
}
```

移动文件或目录。支持跨文件系统移动（先 cp 再 rm）。自动创建目标父目录。

```ts
import { movePath } from '@cat-kit/be'

await movePath('./old-config.json', './config/default.json', { overwrite: true })
```

## 文件读写

### `writeFile`

```ts
function writeFile(filePath: string, data: WriteFileData, options?: WriteFileOptions): Promise<void>

interface WriteFileOptions {
  encoding?: BufferEncoding  // 默认 'utf8'
  mode?: number              // 权限，默认 0o666
  flag?: string              // 文件标志，默认 'w'（支持 'a', 'wx'）
}

type WriteFileData = string | Buffer | NodeJS.ArrayBufferView
  | ReadableStream<Uint8Array> | Readable | AsyncIterable<...> | Iterable<...>
```

增强的写文件函数：自动创建父目录，支持 Web Streams、Node.js Readable、迭代器。

```ts
import { writeFile } from '@cat-kit/be'

await writeFile('./data/output.txt', 'hello world')
await writeFile('./data/log.txt', 'appended\n', { flag: 'a' })
```

### `readJson` / `writeJson`

```ts
function readJson<T = Record<string, any>>(filePath: string, options?: ReadJsonOptions): Promise<T>
function writeJson(filePath: string, data: unknown, options?: WriteJsonOptions): Promise<void>

interface WriteJsonOptions {
  encoding?: string  // 默认 'utf8'
  replacer?: (key: string, value: any) => any  // JSON stringify replacer
  space?: number     // 缩进空格数，默认 2
  eol?: string       // 行尾符，默认 '\n'
}
```

JSON 文件读写。`writeJson` 自动创建目录、末尾自动加换行。

```ts
import { readJson, writeJson } from '@cat-kit/be'

const config = await readJson<{ port: number }>('./config.json')
await writeJson('./config.json', { ...config, port: 8080 })
```

## 原生 re-export

`@cat-kit/be` 重新导出 `node:fs/promises` 的 `readFile`、`cp`、`copyFile`，以及 `node:fs` 的 `existsSync`。

```ts
import { readFile, cp, existsSync } from '@cat-kit/be'

if (existsSync('./src')) {
  await cp('./src', './backup', { recursive: true })
}
```

> 类型签名：`../../generated/be/fs/`
