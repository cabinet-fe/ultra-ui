# be — 文件系统

```typescript
import {
  readDirRecursive, readFile, readFileStream,
  writeFile, writeFileStream,
  copyFile, moveFile, removeFile, removeDir,
  ensureDir, exists, stat, watchFile
} from '@cat-kit/be'
```

## 递归读目录

```typescript
const files = await readDirRecursive('/path', {
  include?, exclude?, depth?, followSymlinks?
})
// FileInfo[]：{ path, name, isFile, isDir, size, mtime }
```

## 读写

```typescript
await readFile('/path/file.txt')              // string
await readFile('/path/file.bin', 'binary')    // Uint8Array
await writeFile('/path/file.txt', content, { encoding?, overwrite?, createDir? })
```

## 流式

```typescript
const stream = readFileStream(path, { chunkSize })
await writeFileStream(path, readableStream)
```

## 操作

```typescript
await copyFile(src, dest, { overwrite? })
await moveFile(src, dest, { overwrite? })
await removeFile(path)
await removeDir(path, { recursive? })
await ensureDir(path)
await exists(path)
await stat(path)
```

## 监听

```typescript
const w = watchFile('/path', { recursive?, debounce?, onChange: (event, path) => {} })
w.close()
```
