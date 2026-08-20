# 文件系统 — API

```ts
declare function readDir(
  dir: string,
  options?: ReadDirOptions & { onlyFiles?: false }
): Promise<DirEntry[]>
declare function readDir(
  dir: string,
  options: ReadDirOptions & { onlyFiles: true }
): Promise<string[]>

declare function ensureDir(path: string): Promise<void>
declare function readJson<T = unknown>(
  path: string,
  options?: ReadJsonOptions
): Promise<T>
declare function writeJson(
  path: string,
  data: unknown,
  options?: WriteJsonOptions
): Promise<void>
declare function writeFile(
  path: string,
  data: WriteFileData,
  options?: WriteFileOptions
): Promise<void>
declare function movePath(
  src: string,
  dest: string,
  options?: MoveOptions
): Promise<void>
declare function emptyDir(path: string): Promise<void>
declare function removePath(
  path: string,
  options?: RemoveOptions
): Promise<void>
```

另导出 Node：`readFile`、`copyFile`、`cp`、`existsSync`。
